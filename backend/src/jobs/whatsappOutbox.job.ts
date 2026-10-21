
import { prisma } from '../prisma';
import { sendWhatsAppMessage } from '../services/whatsapp.service';

const MAX_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 30_000;
const CLAIM_LEASE_MS = 2 * 60_000;

export const processWhatsAppOutbox = async (): Promise<void> => {
  const messages = await prisma.whatsAppOutboxMessage.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: new Date() },
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  for (const message of messages) {
    const claimed = await prisma.whatsAppOutboxMessage.updateMany({
      where: {
        id: message.id,
        status: 'PENDING',
        attempts: message.attempts,
        scheduledAt: message.scheduledAt,
      },
      data: {
        attempts: { increment: 1 },
        scheduledAt: new Date(Date.now() + CLAIM_LEASE_MS),
      },
    });

    if (claimed.count !== 1) continue;

    try {
      await sendWhatsAppMessage(message.recipient, message.messageBody);

      await prisma.whatsAppOutboxMessage.update({
        where: { id: message.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          lastError: null,
        },
      });
    } catch (error) {
      const attempts = message.attempts + 1;
      const retry = attempts < MAX_ATTEMPTS;

      await prisma.whatsAppOutboxMessage.update({
        where: { id: message.id },
        data: {
          status: retry ? 'PENDING' : 'FAILED',
          scheduledAt: retry
            ? new Date(
                Date.now() +
                  BASE_RETRY_DELAY_MS * 2 ** (attempts - 1)
              )
            : message.scheduledAt,
          lastError:
            error instanceof Error
              ? error.message
              : 'Unknown error',
        },
      });

      console.error(
        `WhatsApp message ${message.id} failed (attempt ${attempts}/${MAX_ATTEMPTS}).`,
        error
      );
    }
  }
};

export const startWhatsAppOutboxJob = (): void => {
  console.log('WhatsApp outbox job started.');

  setInterval(() => {
    processWhatsAppOutbox().catch((error) => {
      console.error('WhatsApp outbox processing failed:', error);
    });
  }, 5000);
};