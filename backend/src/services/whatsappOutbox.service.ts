import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const queueWhatsAppNotification = async (
  orderId: string,
  recipient: string,
  status: 'CONFIRMED' | 'REJECTED',
  orderNumber: string
): Promise<void> => {
  const messageBody =
    status === 'CONFIRMED'
      ? `Your order ${orderNumber} has been confirmed. Thank you for shopping with us!`
      : `Your order ${orderNumber} has been rejected. Please contact us if you need assistance.`;

  await prisma.whatsAppOutboxMessage.upsert({
    where: {
      deduplicationKey: `order-${orderId}-${status.toLowerCase()}`,
    },
    create: {
      deduplicationKey: `order-${orderId}-${status.toLowerCase()}`,
      salesOrderId: orderId,
      recipient,
      messageBody,
      status: 'PENDING',
    },
    update: {},
  });
};

export const enqueueStaffReviewNotification = async (
  tx: Prisma.TransactionClient,
  orderId: string,
  recipient: string,
  orderNumber: string
): Promise<void> => {
  const deduplicationKey = `whatsapp-staff-review-${orderId}`;

  await tx.whatsAppOutboxMessage.upsert({
    where: { deduplicationKey },
    create: {
      deduplicationKey,
      salesOrderId: orderId,
      recipient,
      messageBody: `WhatsApp order ${orderNumber} is awaiting staff review.`,
      status: 'PENDING',
    },
    update: {},
  });
};
