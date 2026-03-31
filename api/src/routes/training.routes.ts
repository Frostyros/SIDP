import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { getAllTrainings, getTrainingById, createTraining, updateTraining, deleteTraining } from '../controllers/training.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllTrainings);
router.get('/:id', getTrainingById);

router.post('/', createTraining); // Inputer can create
router.put('/:id', requireAdmin, updateTraining); // Only ADMIN config
router.delete('/:id', requireAdmin, deleteTraining);

export default router;
