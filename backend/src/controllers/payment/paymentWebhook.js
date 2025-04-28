import jwt from 'jsonwebtoken';
import { OrderStatus } from '../../models/OrderStatus.js';
import Order from '../../models/Order.js';

const PG_KEY = process.env.PG_KEY;

export const paymentWebhook = async (req, res) => {
  try {
    // Validate webhook payload structure
    const { order_info, sign } = req.body;
    if (!order_info || !sign) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Verify JWT signature
    try {
      jwt.verify(sign, PG_KEY);
    } catch (jwtError) {
      console.error('JWT Verification Failed:', jwtError);
      return res.status(403).json({ error: 'Unauthorized webhook' });
    }

    // Extract webhook payload details
    const { 
      order_id, 
      status, 
      payment_time, 
      bank_reference, 
      payment_message, 
      error_message,
      amount,
      payment_mode
    } = order_info;

    // Find corresponding OrderStatus
    const orderStatus = await OrderStatus.findOne({ collect_id: order_id });
    if (!orderStatus) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update OrderStatus with complete webhook information
    orderStatus.status = status.toLowerCase();
    orderStatus.transaction_amount = parseFloat(amount);
    orderStatus.payment_mode = payment_mode;
    orderStatus.payment_time = payment_time ? new Date(payment_time) : null;
    orderStatus.bank_reference = bank_reference || '';
    orderStatus.payment_message = payment_message || '';
    orderStatus.error_message = error_message || '';

    // Update corresponding Order status
    const order = await Order.findById(orderStatus.order_id);
    if (order) {
      order.status = status.toLowerCase();
      await order.save();
    }

    // Save updated OrderStatus
    await orderStatus.save();

    // Log webhook processing
    console.log(`Webhook processed for order: ${order_id}, Status: ${status}`);

    // Respond with success
    res.status(200).json({ 
      message: 'Webhook processed successfully', 
      order_id 
    });

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    res.status(500).json({ 
      error: 'Internal server error during webhook processing',
      details: error.message 
    });
  }
};

// Optional: Webhook verification middleware
export const verifyWebhookSignature = (req, res, next) => {
  try {
    const { sign } = req.body;
    jwt.verify(sign, process.env.PG_KEY);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid webhook signature' });
  }
};
