import { Router } from 'express';
import * as SalesOrderController from '../controllers/salesOrder.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createSalesOrderSchema, updateOrderStatusSchema,
  createShipmentSchema, createReturnSchema,
} from '../validators/salesOrder.validator';

const router = Router();
router.use(authenticate);

router.get('/', SalesOrderController.getAll);
router.get('/:id', SalesOrderController.getOne);
router.post('/', validate(createSalesOrderSchema), SalesOrderController.create);
router.put('/:id/status', validate(updateOrderStatusSchema), SalesOrderController.updateStatus);
router.post('/:id/shipment', validate(createShipmentSchema), SalesOrderController.shipOrder);
router.post('/:id/returns', validate(createReturnSchema), SalesOrderController.createReturn);

export default router;