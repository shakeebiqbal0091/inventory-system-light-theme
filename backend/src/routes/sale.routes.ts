// src/routes/sale.routes.ts
import { Router } from 'express';
import * as SaleController from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSaleSchema } from '../validators/sale.validator';

const router = Router();

router.use(authenticate);

router.get('/', SaleController.getAll);
router.post('/', validate(createSaleSchema), SaleController.create);

export default router;