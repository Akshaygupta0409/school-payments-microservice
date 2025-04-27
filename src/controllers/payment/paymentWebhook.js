import { OrderStatus } from '../../models/OrderStatus.js';

export const paymentWebhook = async (req, res) => {
  try {
    const { order_info } = req.body;
    if (!order_info || !order_info.order_id) {
      return res.status(400).send('Invalid webhook payload');
    }
    const { order_id, status, payment_time, bank_reference, payment_message, error_message } = order_info;
    const orderStatus = await OrderStatus.findOne({ collect_id: order_id });
    if (!orderStatus) {
      return res.status(404).send('Order not found');
    }
    orderStatus.status = status;
    orderStatus.payment_time = payment_time ? new Date(payment_time) : null;
    orderStatus.bank_reference = bank_reference || '';
    orderStatus.payment_message = payment_message || '';
    orderStatus.error_message = error_message || '';
    await orderStatus.save();
    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    res.status(500).send('Error processing webhook');
  }
};
