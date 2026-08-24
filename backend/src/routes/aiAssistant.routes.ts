import { Router } from 'express';
import * as AiAssistantController from '../controllers/aiAssistant.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.post('/chat', AiAssistantController.chat);

export default router;