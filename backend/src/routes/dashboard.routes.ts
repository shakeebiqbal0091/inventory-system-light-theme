// src/routes/dashboard.routes.ts
import { Router } from 'express';
import * as SaleController from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, SaleController.getDashboard);

export default router;
