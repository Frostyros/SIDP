import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);

export default router;
