
import { Request, Response } from 'express';
import * as SalesOrderService from '../services/salesOrder.service';

export const verifyWebhook = (req: Request, res: Response): void => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    res.status(503).send('WhatsApp webhook is not configured.');
    return;
  }

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    res.status(200).send(String(challenge));
    return;
  }

  res.sendStatus(403);
};

export const receiveWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Acknowledge delivery promptly so Meta does not keep retrying.
  res.sendStatus(200);

  try {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!rawBody) {
      console.error('WhatsApp webhook raw body is missing.');
      return;
    }

    const payload = JSON.parse(rawBody.toString('utf8'));

    if (payload.object !== 'whatsapp_business_account') {
      console.log('Ignoring unrelated webhook event.');
      return;
    }

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;

        const value = change.value;

        for (const message of value.messages ?? []) {
          const sender = message.from;
          const messageId = message.id;
          const messageType = message.type;

          let messageText: string | undefined;

          if (messageType === 'text') {
            messageText = message.text?.body;
          } else if (messageType === 'button') {
            messageText = message.button?.text;
          } else if (messageType === 'interactive') {
            messageText =
              message.interactive?.button_reply?.title ??
              message.interactive?.list_reply?.title;
          }

          console.log('Incoming WhatsApp message:', {
            sender,
            messageId,
            messageType,
            messageText,
          });

          // Order processing will be added in the next step.
        }
      }
    }
  } catch (error) {
    console.error('Failed to process WhatsApp webhook:', error);
  }
};

export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await SalesOrderService.createConfirmedWhatsAppPendingOrder(
      req.body
    );

    res.status(result.created ? 201 : 200).json({
      success: true,
      data: result.order,
      created: result.created,
      message: result.created
        ? 'WhatsApp order submitted for staff review.'
        : 'WhatsApp order was already submitted for staff review.',
    });
  } catch (error: unknown) {
    console.error(
      'Confirmed WhatsApp order intake failed:',
      error instanceof Error ? error.message : 'Unknown error.'
    );
    res.status(500).json({
      success: false,
      error: 'Unable to submit the order for staff review.',
    });
  }
};