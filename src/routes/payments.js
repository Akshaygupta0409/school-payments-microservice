import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPayment } from '../controllers/payment/createPayment.js';
import { paymentCallback } from '../controllers/payment/paymentCallback.js';
import { paymentWebhook } from '../controllers/payment/paymentWebhook.js';
import { transactionStatus } from '../controllers/payment/transactionStatus.js';
import { checkPaymentStatus } from '../controllers/payment/checkPaymentStatus.js';

const router = express.Router();

// Only trustees can initiate payments
router.post('/create-payment', authenticate, createPayment);
// Check status
router.get('/status/:id', authenticate, checkPaymentStatus);
// Payment callback endpoint (redirect from Edviron)
router.get('/callback', paymentCallback);
// Add webhook and transaction status endpoints
router.post('/webhook', paymentWebhook);
router.get('/transaction-status/:custom_order_id', transactionStatus);

export default router;
