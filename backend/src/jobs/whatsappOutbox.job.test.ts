import test from 'node:test';
import assert from 'node:assert/strict';
import * as WhatsAppService from '../services/whatsapp.service';
import { prisma } from '../prisma';
import { processWhatsAppOutbox } from './whatsappOutbox.job';

test('outbox worker claims a pending message once across concurrent workers', async () => {
  const originalDelegate = Object.getOwnPropertyDescriptor(
    prisma,
    'whatsAppOutboxMessage'
  );
  const originalSender = Object.getOwnPropertyDescriptor(
    WhatsAppService,
    'sendWhatsAppMessage'
  );
  const scheduledAt = new Date('2026-01-01T00:00:00.000Z');
  const message = {
    id: 'outbox-1',
    status: 'PENDING',
    attempts: 0,
    scheduledAt,
    createdAt: scheduledAt,
    recipient: '+15555550100',
    messageBody: 'Staff review is required.',
  };
  let storedMessage = { ...message };
  let sendCount = 0;

  Object.defineProperty(prisma, 'whatsAppOutboxMessage', {
    configurable: true,
    value: {
      findMany: async () => [{ ...storedMessage }],
      updateMany: async ({ where, data }: {
        where: {
          id: string;
          status: string;
          attempts: number;
          scheduledAt: Date;
        };
        data: { attempts: { increment: number }; scheduledAt: Date };
      }) => {
        if (
          storedMessage.id !== where.id ||
          storedMessage.status !== where.status ||
          storedMessage.attempts !== where.attempts ||
          storedMessage.scheduledAt.getTime() !== where.scheduledAt.getTime()
        ) {
          return { count: 0 };
        }
        storedMessage = {
          ...storedMessage,
          attempts: storedMessage.attempts + data.attempts.increment,
          scheduledAt: data.scheduledAt,
        };
        return { count: 1 };
      },
      update: async ({ data }: { data: Partial<typeof storedMessage> }) => {
        storedMessage = { ...storedMessage, ...data };
        return storedMessage;
      },
    },
  });
  Object.defineProperty(WhatsAppService, 'sendWhatsAppMessage', {
    configurable: true,
    value: async () => {
      sendCount += 1;
    },
  });

  try {
    await Promise.all([processWhatsAppOutbox(), processWhatsAppOutbox()]);
    assert.equal(sendCount, 1);
    assert.equal(storedMessage.attempts, 1);
    assert.equal(storedMessage.status, 'SENT');
  } finally {
    if (originalDelegate) {
      Object.defineProperty(prisma, 'whatsAppOutboxMessage', originalDelegate);
    } else {
      delete (prisma as unknown as Record<string, unknown>).whatsAppOutboxMessage;
    }
    if (originalSender) {
      Object.defineProperty(WhatsAppService, 'sendWhatsAppMessage', originalSender);
    } else {
      delete (WhatsAppService as unknown as Record<string, unknown>).sendWhatsAppMessage;
    }
  }
});
