import jwt from 'jsonwebtoken';
import axios from 'axios';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { school_id } = req.query;
    // sign payload
    const sign = jwt.sign(
      { school_id, collect_request_id: id },
      PG_KEY
    );
    const url = `${EDVIRON_API_BASE}/collect-request/${id}?school_id=${school_id}&sign=${sign}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${PG_API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error checking payment status:', error.message);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
};
