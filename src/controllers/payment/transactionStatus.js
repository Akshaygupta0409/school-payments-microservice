import jwt from 'jsonwebtoken';
import axios from 'axios';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

export const transactionStatus = async (req, res) => {
  try {
    const { custom_order_id } = req.params;
    const payload = {
      school_id: process.env.SCHOOL_ID,
      collect_request_id: custom_order_id
    };
    const sign = jwt.sign(payload, PG_KEY, { algorithm: 'HS256' });
    const url = `${EDVIRON_API_BASE}/collect-request/${custom_order_id}?school_id=${process.env.SCHOOL_ID}&sign=${sign}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${PG_API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error checking transaction status:', error.message);
    res.status(500).json({ error: 'Failed to check transaction status' });
  }
};
