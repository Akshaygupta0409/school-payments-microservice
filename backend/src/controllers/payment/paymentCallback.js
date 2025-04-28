import jwt from 'jsonwebtoken';
import { OrderStatus } from '../../models/OrderStatus.js';
import Order from '../../models/Order.js';
import axios from 'axios';

const EDVIRON_API_BASE = process.env.EDVIRON_API_BASE || 'https://dev-vanilla.edviron.com/erp';
const PG_KEY = process.env.PG_KEY;
const PG_API_KEY = process.env.PG_API_KEY;

export const paymentCallback = async (req, res, next) => {
  try {
    console.log('Callback Request Query:', req.query);
    console.log('Callback Request Body:', req.body);

    // Extract IDs from query parameters
    const { orderId, EdvironCollectRequestId, status: callbackStatus } = req.query;
    
    // Use Edviron's collect request ID for verification if available
    const collectRequestId = EdvironCollectRequestId || orderId;
    
    if (!collectRequestId) {
      console.error('No collect request ID provided in callback');
      return res.status(400).send('Missing collect request ID');
    }

    // If we already have a status in the callback, we can update directly
    if (callbackStatus && orderId) {
      console.log(`Direct status update from callback: ${callbackStatus}`);
      try {
        // First, find the order status
        let orderStatus = await OrderStatus.findOne({ collect_id: collectRequestId });
        
        if (!orderStatus) {
          // If not found by collect_id, try by order_id
          orderStatus = await OrderStatus.findOne({ order_id: orderId });
        }
        
        if (orderStatus) {
          // Map the callback status to our normalized status values
          const normalizedStatus = normalizeStatus(callbackStatus);
          
          // Update the order status
          orderStatus.status = normalizedStatus;
          orderStatus.updated_at = new Date();
          
          // If status is SUCCESS, update payment details
          if (normalizedStatus === 'Success') {
            orderStatus.payment_message = 'Payment completed successfully';
            orderStatus.payment_time = new Date();
          } else if (normalizedStatus === 'Failed') {
            orderStatus.error_message = 'Payment failed';
            orderStatus.payment_message = 'Payment transaction failed';
          } else if (normalizedStatus === 'Cancelled') {
            orderStatus.error_message = 'Payment cancelled by user';
            orderStatus.payment_message = 'Payment transaction cancelled';
          }
          
          await orderStatus.save();
          
          // Also update the parent order
          if (orderStatus.order_id) {
            const order = await Order.findById(orderStatus.order_id);
            if (order) {
              order.status = normalizedStatus;
              await order.save();
            }
          }
          
          console.log('Updated Order Status:', orderStatus);
          
          // Redirect to frontend with status info
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?orderId=${orderId}&status=${callbackStatus}&EdvironCollectRequestId=${collectRequestId}`);
        }
      } catch (updateError) {
        console.error('Error updating order status:', updateError);
      }
    }

    // Check payment status from Edviron API if not already processed
    try {
      // Prepare JWT signature
      const token = jwt.sign({ collect_request_id: collectRequestId }, PG_KEY, { expiresIn: '1h' });
      
      // Call Edviron API to verify payment status
      const apiResponse = await axios.post(
        `${EDVIRON_API_BASE}/collect/status`,
        { collect_request_id: collectRequestId },
        { 
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': PG_API_KEY,
            'x-pg-signature': token,
            'Accept': 'application/json'
          }
        }
      );
      
      const { data } = apiResponse;
      console.log('Payment status API response:', data);
      
      if (data && data.status) {
        // Update order status with the received payment status
        const normalizedStatus = normalizeStatus(data.status);
        
        let orderStatus = await OrderStatus.findOne({ collect_id: collectRequestId });
        if (!orderStatus && orderId) {
          orderStatus = await OrderStatus.findOne({ order_id: orderId });
        }
        
        if (orderStatus) {
          // Update status fields
          orderStatus.status = normalizedStatus;
          orderStatus.updated_at = new Date();
          
          // Update additional fields based on the API response
          if (data.payment_time) orderStatus.payment_time = new Date(data.payment_time);
          if (data.bank_reference) orderStatus.bank_reference = data.bank_reference;
          if (data.payment_message) orderStatus.payment_message = data.payment_message;
          if (data.error_message) orderStatus.error_message = data.error_message;
          if (data.payment_mode) orderStatus.payment_mode = data.payment_mode;
          if (data.transaction_amount) orderStatus.transaction_amount = data.transaction_amount;
          
          await orderStatus.save();
          
          // Also update the parent order
          if (orderStatus.order_id) {
            const order = await Order.findById(orderStatus.order_id);
            if (order) {
              order.status = normalizedStatus;
              await order.save();
            }
          }
          
          console.log('Updated Order Status from API:', orderStatus);
        }
        
        // Redirect to frontend with status info
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?orderId=${orderId || collectRequestId}&status=${data.status}&EdvironCollectRequestId=${collectRequestId}`);
      }
    } catch (apiError) {
      console.error('Error checking payment status:', apiError);
    }
    
    // If we couldn't process the status, redirect with PENDING status
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?orderId=${orderId || collectRequestId}&status=PENDING&EdvironCollectRequestId=${collectRequestId}`);
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Helper function to normalize status values
function normalizeStatus(status) {
  if (!status) return 'Pending';
  
  const statusStr = status.toString().toLowerCase();
  
  if (statusStr.includes('success') || statusStr === 'paid' || statusStr === 'captured' || statusStr === 'completed') {
    return 'Success';
  }
  
  if (statusStr.includes('fail') || statusStr === 'declined' || statusStr === 'rejected' || statusStr === 'error') {
    return 'Failed';
  }
  
  if (statusStr.includes('cancel')) {
    return 'Cancelled';
  }
  
  if (statusStr.includes('pend') || statusStr === 'awaiting' || statusStr === 'processing' || statusStr === 'initiated') {
    return 'Pending';
  }
  
  // If payment has any error text, treat as failed
  if (statusStr.includes('error') || statusStr.includes('timeout') || statusStr.includes('404')) {
    return 'Failed';
  }
  
  return 'Pending'; // Default to pending for unknown statuses
}
