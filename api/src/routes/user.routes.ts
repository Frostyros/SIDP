import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { getUsers, createUser, resetPassword, deleteUser } from '../controllers/user.controller';

const router = express.Router();

// All user management routes require ADMIN
router.get('/', authenticate, requireAdmin, getUsers);
router.post('/', authenticate, requireAdmin, createUser);
router.patch('/:id/reset-password', authenticate, requireAdmin, resetPassword);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
