import jwt from 'jsonwebtoken';
import axios from 'axios';
import { OrderStatus } from '../../models/OrderStatus.js';
import Order from '../../models/Order.js';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

export const transactionStatus = async (req, res) => {
  try {
    const { custom_order_id } = req.params;

    // 1. Try to fetch from our DB first (either by collect_id or order_id)
    let orderStatus = await OrderStatus.findOne({ collect_id: custom_order_id }).lean();
    if (!orderStatus) {
      // Maybe the user passed the Order _id instead of collect_id
      orderStatus = await OrderStatus.findOne({ order_id: custom_order_id }).lean();
    }

    if (orderStatus) {
      // If status is anything other than pending we can confidently return it
      if (orderStatus.status && orderStatus.status !== 'pending') {
        return res.json(formatOrderStatus(orderStatus));
      }
    }

    // 2. If DB record is missing or still pending, call Edviron API to fetch latest status
    const payload = {
      school_id: process.env.SCHOOL_ID,
      collect_request_id: custom_order_id
    };
    const sign = jwt.sign(payload, PG_KEY, { algorithm: 'HS256' });
    const url = `${EDVIRON_API_BASE}/collect-request/${custom_order_id}?school_id=${process.env.SCHOOL_ID}&sign=${sign}`;

    let apiData;
    try {
      const apiResp = await axios.get(url, {
        headers: { Authorization: `Bearer ${PG_API_KEY}` }
      });
      apiData = apiResp.data;
    } catch (apiErr) {
      console.error('Edviron API error while checking transaction status:', apiErr.response?.data || apiErr.message);
      // If we still have something from the DB, return that instead of failing completely
      if (orderStatus) {
        return res.json(formatOrderStatus(orderStatus));
      }
      return res.status(500).json({ error: 'Failed to check transaction status', details: apiErr.response?.data || apiErr.message });
    }

    // 3. Update / insert into DB for future look-ups
    const {
      collect_request_id: collectId,
      order_amount,
      transaction_amount,
      status,
      payment_mode,
      bank_reference,
      payment_message,
      payment_time,
      error_message
    } = apiData || {};

    let dbRecord = await OrderStatus.findOne({ collect_id: collectId });
    if (!dbRecord && orderStatus) {
      // Use previously fetched orderStatus document for update
      dbRecord = await OrderStatus.findById(orderStatus._id);
    }

    if (dbRecord) {
      dbRecord.status = status?.toLowerCase() || dbRecord.status;
      if (transaction_amount !== undefined) dbRecord.transaction_amount = transaction_amount;
      if (payment_mode) dbRecord.payment_mode = payment_mode;
      if (bank_reference) dbRecord.bank_reference = bank_reference;
      if (payment_message) dbRecord.payment_message = payment_message;
      if (payment_time) dbRecord.payment_time = new Date(payment_time);
      if (error_message) dbRecord.error_message = error_message;
      await dbRecord.save();
      return res.json(formatOrderStatus(dbRecord.toObject()));
    }

    // If for some reason we still don't have a record, just return the API data as-is
    return res.json({
      collect_id: collectId,
      status: status?.toLowerCase() || 'unknown',
      order_amount,
      transaction_amount,
      payment_mode,
      bank_reference,
      payment_message,
      payment_time,
      error_message
    });
  } catch (error) {
    console.error('Error checking transaction status (controller):', error);
    res.status(500).json({ error: 'Failed to check transaction status', details: error.message });
  }
};

// Helper to map DB record to response format expected by frontend
function formatOrderStatus(os) {
  return {
    collect_id: os.collect_id,
    custom_order_id: os.order_id, // This will be ObjectId; frontend just displays it as string
    status: os.status,
    order_amount: os.order_amount,
    transaction_amount: os.transaction_amount,
    payment_mode: os.payment_mode,
    bank_reference: os.bank_reference,
    payment_message: os.payment_message,
    payment_time: os.payment_time,
    error_message: os.error_message
  };
}
