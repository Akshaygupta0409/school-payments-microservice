import express from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware as needed (e.g., admin only)
router.post('/register', createUser);
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;
