import jwt from 'jsonwebtoken';
import Order from '../../models/Order.js';
import { OrderStatus } from '../../models/OrderStatus.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

export const createPayment = async (req, res, next) => {
  try {
    const { amount, student_info } = req.body;
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
    // Prepare JWT payload
    const payload = {
      school_id: process.env.SCHOOL_ID,
      amount: amount.toString(),
      callback_url: `${process.env.APP_URL}api/payments/callback?orderId=${order._id}`
    };
    // Sign JWT
    const sign = jwt.sign(payload, PG_KEY, { algorithm: 'HS256' });
    // Prepare request body
    const requestBody = {
      school_id: process.env.SCHOOL_ID,
      amount: amount.toString(),
      callback_url: payload.callback_url,
      sign
    };
    // Send request to payment API
    const response = await axios.post(`${EDVIRON_API_BASE}/create-collect-request`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PG_API_KEY}`
      }
    });
    const { collect_request_id, Collect_request_url } = response.data;
    if (!Collect_request_url) {
      throw new Error('Payment URL not found in response');
    }
    // Create OrderStatus
    const orderStatus = new OrderStatus({
      collect_id: collect_request_id,
      order_id: order._id,
      order_amount: parseFloat(amount),
      status: 'pending'
    });
    await orderStatus.save();
    // Redirect to payment URL
    res.redirect(Collect_request_url);
  } catch (error) {
    console.error('Error creating payment:', error.message);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};
