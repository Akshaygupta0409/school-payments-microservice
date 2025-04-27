import jwt from 'jsonwebtoken';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

// Create a collect request and return payment URL
export const createPayment = async (req, res, next) => {
  try {
    const { school_id, amount, callback_url } = req.body;
    // sign payload
    const sign = jwt.sign(
      { school_id, amount, callback_url },
      PG_KEY
    );
    const response = await fetch(
      `${EDVIRON_API_BASE}/create-collect-request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PG_API_KEY}`
        },
        body: JSON.stringify({ school_id, amount, callback_url, sign })
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`EDVIRON API error: ${response.status} ${text}`);
    }
    const data = await response.json();
    // return link and IDs
    res.json({
      collect_request_id: data.collect_request_id,
      collect_request_url: data.Collect_request_url || data.collect_request_url,
      sign: data.sign
    });
  } catch (err) {
    next(err);
  }
};

// Check payment status by ID
export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { school_id } = req.query;
    // sign payload
    const sign = jwt.sign(
      { school_id, collect_request_id: id },
      PG_KEY
    );
    const url = new URL(`${EDVIRON_API_BASE}/collect-request/${id}`);
    url.searchParams.append('school_id', school_id);
    url.searchParams.append('sign', sign);
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${PG_API_KEY}` }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`EDVIRON API error: ${response.status} ${text}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
};
