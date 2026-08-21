import { Router } from 'express';
import * as CustomerController from '../controllers/customer.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator';

const router = Router();
router.use(authenticate);

router.get('/', CustomerController.getAll);
router.get('/:id', CustomerController.getOne);
router.post('/', requireRole('ADMIN'), validate(createCustomerSchema), CustomerController.create);
router.put('/:id', requireRole('ADMIN'), validate(updateCustomerSchema), CustomerController.update);
router.delete('/:id', requireRole('ADMIN'), CustomerController.remove);

export default router;