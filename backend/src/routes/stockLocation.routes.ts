import { Router } from 'express';
import * as StockLocationController from '../controllers/stockLocation.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { allocateStockSchema, transferStockSchema } from '../validators/warehouse.validator';   // ← add allocateStockSchema


const router = Router();
router.use(authenticate);

router.get('/product/:productId', StockLocationController.getByProduct);
router.get('/warehouse/:warehouseId', StockLocationController.getByWarehouse);
router.post('/transfer', requireRole('ADMIN'), validate(transferStockSchema), StockLocationController.transfer);
router.post('/allocate', requireRole('ADMIN'), validate(allocateStockSchema), StockLocationController.allocate);

export default router;