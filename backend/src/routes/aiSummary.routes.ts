import { Router } from 'express';
import * as AiSummaryController from '../controllers/aiSummary.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/preview', requireRole('ADMIN'), AiSummaryController.preview);
router.post('/send', requireRole('ADMIN'), AiSummaryController.sendNow);

export default router;