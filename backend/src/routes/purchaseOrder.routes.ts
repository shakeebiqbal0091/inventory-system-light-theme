import { Router } from 'express';
import * as PurchaseOrderController from '../controllers/purchaseOrder.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPurchaseOrderSchema, updateStatusSchema, receiveStockSchema } from '../validators/purchaseOrder.validator';

const router = Router();
router.use(authenticate);

router.get('/', PurchaseOrderController.getAll);
router.get('/:id', PurchaseOrderController.getOne);
router.post('/', requireRole('ADMIN'), validate(createPurchaseOrderSchema), PurchaseOrderController.create);
router.put('/:id/status', requireRole('ADMIN'), validate(updateStatusSchema), PurchaseOrderController.updateStatus);
router.post('/:id/receive', requireRole('ADMIN'), validate(receiveStockSchema), PurchaseOrderController.receive);

export default router;