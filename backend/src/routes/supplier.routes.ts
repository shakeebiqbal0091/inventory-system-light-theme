import { Router } from 'express';
import * as SupplierController from '../controllers/supplier.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSupplierSchema, updateSupplierSchema } from '../validators/supplier.validator';

const router = Router();
router.use(authenticate);

router.get('/', SupplierController.getAll);
router.get('/:id', SupplierController.getOne);
router.post('/', requireRole('ADMIN'), validate(createSupplierSchema), SupplierController.create);
router.put('/:id', requireRole('ADMIN'), validate(updateSupplierSchema), SupplierController.update);
router.delete('/:id', requireRole('ADMIN'), SupplierController.remove);

export default router;