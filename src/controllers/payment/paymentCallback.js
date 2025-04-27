import jwt from 'jsonwebtoken';
import { OrderStatus } from '../../models/OrderStatus.js';
import axios from 'axios';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

export const paymentCallback = async (req, res, next) => {
  try {
    console.log('Callback Request Query:', req.query);
    console.log('Callback Request Body:', req.body);

    const { orderId } = req.query;
    if (!orderId) {
      console.error('No orderId provided in callback');
      return res.status(400).send('Missing order ID');
    }

    const payload = {
      school_id: process.env.SCHOOL_ID,
      collect_request_id: orderId
    };
    const sign = jwt.sign(payload, PG_KEY, { algorithm: 'HS256' });
    
    const url = `${EDVIRON_API_BASE}/collect-request/${orderId}?school_id=${process.env.SCHOOL_ID}&sign=${sign}`;
    
    console.log('Callback Verification URL:', url);
    console.log('Authorization Header:', `Bearer ${PG_API_KEY.substring(0, 10)}...`);

    try {
      const response = await axios.get(url, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PG_API_KEY}` 
        }
      });

      console.log('Edviron Callback Response:', response.data);

      const { status } = response.data;
      
      const updatedOrderStatus = await OrderStatus.findOneAndUpdate(
        { collect_id: orderId },
        { 
          status: status.toLowerCase(),
          updated_at: new Date()
        },
        { new: true }
      );

      console.log('Updated Order Status:', updatedOrderStatus);

      res.send(`Payment status: ${status}`);
    } catch (apiError) {
      console.error('Edviron API Error:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message
      });
      res.status(500).send('Error verifying payment with Edviron');
    }
  } catch (error) {
    console.error('Callback Processing Error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).send('Error processing payment callback');
  }
};
