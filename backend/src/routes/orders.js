import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getAllOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id', authenticate, updateOrder);
router.delete('/:id', authenticate, deleteOrder);

export default router;
