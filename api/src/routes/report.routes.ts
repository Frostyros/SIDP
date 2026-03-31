import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { exportReport } from '../controllers/report.controller';

const router = express.Router();

router.use(authenticate);

router.get('/export', exportReport);

export default router;
