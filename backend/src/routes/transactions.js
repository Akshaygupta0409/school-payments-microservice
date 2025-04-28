import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAllTransactions, getTransactionsBySchool } from '../controllers/transactionController.js';

const router = express.Router();

// Get all transactions with filtering, pagination, and sorting
router.get('/', authenticate, getAllTransactions);

// Get transactions by school ID
router.get('/school/:schoolId', authenticate, getTransactionsBySchool);

export default router;
