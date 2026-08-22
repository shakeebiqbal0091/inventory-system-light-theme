import { Router } from 'express';
import * as WarehouseController from '../controllers/warehouse.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createWarehouseSchema, updateWarehouseSchema } from '../validators/warehouse.validator';

const router = Router();
router.use(authenticate);

router.get('/', WarehouseController.getAll);
router.get('/:id', WarehouseController.getOne);
router.post('/', requireRole('ADMIN'), validate(createWarehouseSchema), WarehouseController.create);
router.put('/:id', requireRole('ADMIN'), validate(updateWarehouseSchema), WarehouseController.update);
router.delete('/:id', requireRole('ADMIN'), WarehouseController.remove);

export default router;