import jwt from 'jsonwebtoken';
import Order from '../../models/Order.js';
import { OrderStatus } from '../../models/OrderStatus.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

export const createPayment = async (req, res) => {
  try {
    const { amount, student_info, phone_number } = req.body;
    
    // Extensive logging
    console.log('Payment Creation Request:', {
      amount,
      student_info,
      phone_number,
      EDVIRON_API_BASE,
      SCHOOL_ID: process.env.SCHOOL_ID,
      APP_URL: process.env.APP_URL
    });

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    // Create Order
    const order = new Order({
      school_id: process.env.SCHOOL_ID,
      trustee_id: req.user ? req.user.userId : uuidv4(),
      student_info: student_info || { name: 'Student', id: uuidv4(), email: 'student@example.com' },
      gateway_name: 'Edviron',
      amount: parseFloat(amount),
      currency: 'INR',
      status: 'pending'
    });
    await order.save();

    // Generate a unique reference ID for this transaction
    const reference_id = `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Prepare detailed payload for better gateway integration
    const payloadData = {
      school_id: process.env.SCHOOL_ID,
      amount: amount.toString(),
      callback_url: `${process.env.APP_URL}api/payments/callback?orderId=${order._id}`,
      reference_id: reference_id,
      description: `Payment for ${student_info?.name || 'Student'}`,
      student_name: student_info?.name || 'Student',
      email: student_info?.email || 'student@example.com',
      phone: phone_number || '',
      allow_payment_methods: 'all', // Enable all payment methods
      mode: 'test', // Use test mode
      currency: 'INR'
    };

    // Sign JWT with comprehensive payload
    const sign = jwt.sign(payloadData, PG_KEY, { algorithm: 'HS256' });

    // Build complete request body with all necessary fields
    const requestBody = {
      ...payloadData,
      sign,
      // Add additional required parameters
      payer_details: {
        name: student_info?.name || 'Student',
        email: student_info?.email || 'student@example.com',
        phone: phone_number || '',
        address: {
          street: 'NA',
          city: 'NA',
          state: 'NA',
          country: 'India',
          zip: '000000'
        }
      },
      // Add payment preferences
      payment_preferences: {
        preferred_mode: phone_number ? 'UPI' : 'QR',
        auto_capture: true,
        allowed_payment_methods: ['UPI', 'CARD', 'NETBANKING', 'WALLET']
      },
      // Meta information to help with debugging
      meta: {
        source: 'school-payments-microservice',
        custom_order_id: order._id.toString(),
        integration_mode: 'redirect'
      },
      // Recurring payment flag (false for one-time payments)
      is_recurring: false
    };

    // Log detailed request info
    console.log('Edviron API Request:', {
      url: `${EDVIRON_API_BASE}/create-collect-request`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PG_API_KEY.substring(0, 10)}...`
      },
      body: requestBody
    });

    // Send request to payment API
    const response = await axios.post(`${EDVIRON_API_BASE}/create-collect-request`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PG_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    // Log full API response
    console.log('Edviron API Full Response:', response.data);

    // Extract URL with case-insensitive check
    const paymentUrl = response.data.collect_request_url || 
                       response.data.Collect_request_url || 
                       response.data.payment_url;

    // Validate response
    if (!paymentUrl) {
      console.error('No payment URL in response:', response.data);
      throw new Error('Payment URL not found in response');
    }

    const { collect_request_id } = response.data;

    // Save reference_id in the OrderStatus for later lookup
    const orderStatus = new OrderStatus({
      collect_id: collect_request_id,
      order_id: order._id,
      order_amount: parseFloat(amount),
      status: 'pending',
      payment_details: JSON.stringify({
        reference_id,
        phone: phone_number || '',
        preferred_mode: phone_number ? 'UPI' : 'QR'
      })
    });
    await orderStatus.save();

    // Return JSON with redirect_url and collect_request_url
    console.log('Returning JSON:', {
      redirect_url: paymentUrl,
      collect_request_url: paymentUrl,
      collect_request_id
    });
    res.json({ redirect_url: paymentUrl, collect_request_url: paymentUrl, collect_request_id });
  } catch (error) {
    console.error('Error creating payment:', error.message);
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    res.status(500).json({ 
      error: 'Failed to initiate payment',
      details: error.message 
    });
  }
};
