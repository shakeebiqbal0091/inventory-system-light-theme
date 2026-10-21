import { Request, Router } from 'express';
import crypto from 'crypto';
import * as WhatsAppController from '../controllers/whatsapp.controller';
import { authenticateInventoryService } from '../middleware/serviceAuth';
import { validate } from '../middleware/validate';
import { createWhatsAppOrderSchema } from '../validators/whatsapp.validator';

const router = Router();
router.post(
  '/orders',
  authenticateInventoryService,
  validate(createWhatsAppOrderSchema),
  WhatsAppController.createOrder
);

// Meta webhook verification
router.get('/webhook', WhatsAppController.verifyWebhook);

// Receive incoming Meta webhook events
router.post(
  '/webhook',
  (req, res, next) => {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
      res.status(503).json({ error: 'WhatsApp webhook is not configured.' });
      return;
    }

    const signature = req.header('x-hub-signature-256');

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!signature || !rawBody) {
      res.status(401).json({ error: 'Invalid webhook signature.' });
      return;
    }

    const expected =
      'sha256=' +
      crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      res.status(401).json({ error: 'Invalid webhook signature.' });
      return;
    }

    next();
  },
  WhatsAppController.receiveWebhook
);

export default router;