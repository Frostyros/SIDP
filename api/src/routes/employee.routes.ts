import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employee.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);

// Only ADMIN can manage employees
router.post('/', requireAdmin, createEmployee);
router.put('/:id', requireAdmin, updateEmployee);
router.delete('/:id', requireAdmin, deleteEmployee);

export default router;
