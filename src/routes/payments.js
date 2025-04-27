import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPayment, checkPaymentStatus } from '../controllers/paymentController.js';

const router = express.Router();

// Only trustees can initiate payments
router.post('/create-payment', authenticate, createPayment);
// Check status
router.get('/status/:id', authenticate, checkPaymentStatus);

export default router;
