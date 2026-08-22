import { Router } from 'express';
import * as StockLocationController from '../controllers/stockLocation.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { transferStockSchema } from '../validators/warehouse.validator';

const router = Router();
router.use(authenticate);

router.get('/product/:productId', StockLocationController.getByProduct);
router.get('/warehouse/:warehouseId', StockLocationController.getByWarehouse);
router.post('/transfer', requireRole('ADMIN'), validate(transferStockSchema), StockLocationController.transfer);

export default router;