import jwt from 'jsonwebtoken';
import { OrderStatus } from '../../models/OrderStatus.js';
import axios from 'axios';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

export const paymentCallback = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    if (orderId) {
      const payload = {
        school_id: process.env.SCHOOL_ID,
        collect_request_id: orderId
      };
      const sign = jwt.sign(payload, PG_KEY, { algorithm: 'HS256' });
      const url = `${EDVIRON_API_BASE}/collect-request/${orderId}?school_id=${process.env.SCHOOL_ID}&sign=${sign}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${PG_API_KEY}` }
      });
      const { status } = response.data;
      await OrderStatus.findOneAndUpdate(
        { collect_id: orderId },
        { status }
      );
      res.send(`Payment status: ${status}`);
    } else {
      res.send('Payment processing. Status will be updated soon.');
    }
  } catch (error) {
    console.error('Error in callback:', error.message);
    res.status(500).send('Error processing payment callback');
  }
};
