// src/routes/sale.routes.ts
import { Router } from 'express';
import * as SaleController from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', SaleController.getAll);
router.post('/', SaleController.create);

export default router;
