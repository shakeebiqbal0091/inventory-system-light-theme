import { Router } from 'express';
import * as ReportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/stock-movements', ReportController.stockMovements);
router.get('/sales-turnover', ReportController.salesTurnover);
router.get('/valuation', ReportController.valuation);

export default router;