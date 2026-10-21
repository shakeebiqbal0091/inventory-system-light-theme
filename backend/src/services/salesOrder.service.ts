import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import {
  enqueueStaffReviewNotification,
  queueWhatsAppNotification,
} from './whatsappOutbox.service';
// import { CreateSalesOrderInput, CreateShipmentInput, CreateReturnInput } from '../types';
import {
  CreateSalesOrderInput,
  CreateShipmentInput,
  CreateReturnInput,
  CreateWhatsAppOrderInput,
} from '../types';
import { checkAndAlertForProduct } from './alert.service';
import { recordMovement } from './stockMovement.service';   // ← add to imports

export interface CreateConfirmedWhatsAppOrderInput {
  providerEventId: string;
  customerName: string;
  whatsappNumber: string;
  // The trusted caller must only set this after verifying an explicit customer confirmation.
  customerConfirmed: boolean;
  shippingAddress?: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

const generateOrderNumber = async (tx: Prisma.TransactionClient) => {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(193674761, 1)`;
  const [result] = await tx.$queryRaw<Array<{ highest: string }>>`
    SELECT COALESCE(
      MAX(SUBSTRING("orderNumber" FROM '^SO-([0-9]+)$')::BIGINT),
      0
    )::TEXT AS highest
    FROM "sales_orders"
  `;

  return `SO-${(BigInt(result.highest) + 1n).toString().padStart(5, '0')}`;
};

export const getAllSalesOrders = async () => {
  return prisma.salesOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true, company: true } },
      sales: { include: { product: { select: { id: true, name: true } } } },
      shipment: true,
      items: true,
    },
  });
};

export const getSalesOrderById = async (id: string) => {
  return prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      sales: { include: { product: { select: { id: true, name: true } } } },
      shipment: true,
      returns: true,
      items: true,
    },
  });
};

// ─── Create Sales Order (atomic: one transaction covers every line item) ──────
export const createSalesOrder = async (input: CreateSalesOrderInput, userId?: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx);
    const order = await tx.salesOrder.create({
      data: {
        orderNumber,
        customerId: input.customerId,
        channel: input.channel ?? 'IN_STORE',
        notes: input.notes,
        status: 'PENDING',
      },
    });

    const touchedProductIds: string[] = [];

    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product ${item.productId} not found.`);
      await recordMovement(tx, item.productId, 'SALE', item.quantity, userId, `Sales Order ${orderNumber}`);

      const updateResult = await tx.product.updateMany({
        where: { id: item.productId, quantity: { gte: item.quantity } },
        data: { quantity: { decrement: item.quantity } },
      });

      if (updateResult.count === 0) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`);
      }

      const totalPrice = product.price     * item.quantity;
      const totalCost  = product.costPrice * item.quantity;
      const profit     = totalPrice - totalCost;

      await tx.sale.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          totalPrice, totalCost, profit,
          salesOrderId: order.id,
        },
      });

      touchedProductIds.push(item.productId);
    }

    return { order, touchedProductIds };
  });

  // Low-stock check happens after commit, same pattern as regular sales
  result.touchedProductIds.forEach((pid) =>
    checkAndAlertForProduct(pid).catch((err) => console.error('Low-stock alert check failed:', err))
  );

  return getSalesOrderById(result.order.id);
};

/**
 * Create a WhatsApp order for staff review.
 * Does not deduct stock or create Sale records.
 */
export const createWhatsAppPendingOrder = async (
  input: CreateWhatsAppOrderInput
) => {
  if (!input.items.length) {
    throw new Error('An order must contain at least one item.');
  }

  if (!input.customerName.trim() || !input.whatsappNumber.trim()) {
    throw new Error('Customer name and WhatsApp number are required.');
  }

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx);
    const snapshots = [];

    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('Item quantities must be positive integers.');
      }

      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product ${item.productId} not found.`);
      }

      snapshots.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: product.price * item.quantity,
      });
    }

    return tx.salesOrder.create({
      data: {
        orderNumber,
        channel: 'WHATSAPP',
        status: 'PENDING_REVIEW',
        customerName: input.customerName.trim(),
        whatsappNumber: input.whatsappNumber.trim(),
        shippingAddress: input.shippingAddress,
        notes: input.notes,
        items: {
          create: snapshots,
        },
      },
    });
  });

  return getSalesOrderById(order.id);
};

export const createConfirmedWhatsAppPendingOrder = async (
  input: CreateConfirmedWhatsAppOrderInput
) => {
  const providerEventId =
    typeof input.providerEventId === 'string' ? input.providerEventId.trim() : '';
  const customerName =
    typeof input.customerName === 'string' ? input.customerName.trim() : '';
  const whatsappNumber =
    typeof input.whatsappNumber === 'string' ? input.whatsappNumber.trim() : '';
  const staffRecipient = process.env.WHATSAPP_STAFF_RECIPIENT?.trim();

  if (input.customerConfirmed !== true) {
    throw new Error('Customer confirmation is required before creating an order.');
  }
  if (!providerEventId) {
    throw new Error('A WhatsApp provider event ID is required.');
  }
  if (!customerName || !/^\+?\d{5,30}$/.test(whatsappNumber)) {
    throw new Error('Verified customer name and WhatsApp number are required.');
  }
  if (!staffRecipient) {
    throw new Error('WhatsApp staff notification recipient is not configured.');
  }
  if (!Array.isArray(input.items) || !input.items.length) {
    throw new Error('An order must contain at least one item.');
  }

  for (const item of input.items) {
    if (typeof item.productId !== 'string' || !item.productId.trim()) {
      throw new Error('A product is required for every order item.');
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Item quantities must be positive integers.');
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingEvent = await tx.whatsAppWebhookEvent.findUnique({
        where: { providerEventId },
        include: { salesOrder: { include: { items: true } } },
      });

      if (existingEvent) {
        if (!existingEvent.salesOrder) {
          throw new Error(
            'WhatsApp confirmation event already exists without an associated order.'
          );
        }
        if (existingEvent.salesOrder.channel !== 'WHATSAPP') {
          throw new Error(
            'WhatsApp confirmation event is associated with an incompatible order.'
          );
        }

        await enqueueStaffReviewNotification(
          tx,
          existingEvent.salesOrder.id,
          staffRecipient,
          existingEvent.salesOrder.orderNumber
        );
        if (!existingEvent.processedAt) {
          await tx.whatsAppWebhookEvent.update({
            where: { id: existingEvent.id },
            data: { processedAt: new Date() },
          });
        }
        return { order: existingEvent.salesOrder, created: false };
      }

      const event = await tx.whatsAppWebhookEvent.create({
        data: {
          providerEventId,
          eventType: 'ORDER_CONFIRMATION',
        },
      });

      const snapshots = [];
      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId.trim() },
        });
        if (!product) {
          throw new Error(`Product ${item.productId} not found.`);
        }
        snapshots.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: product.price * item.quantity,
        });
      }

      const orderNumber = await generateOrderNumber(tx);
      const order = await tx.salesOrder.create({
        data: {
          orderNumber,
          channel: 'WHATSAPP',
          status: 'PENDING_REVIEW',
          customerName,
          whatsappNumber,
          shippingAddress: input.shippingAddress?.trim() || undefined,
          notes: input.notes?.trim() || undefined,
          items: { create: snapshots },
        },
        include: { items: true },
      });

      await enqueueStaffReviewNotification(
        tx,
        order.id,
        staffRecipient,
        order.orderNumber
      );

      await tx.whatsAppWebhookEvent.update({
        where: { id: event.id },
        data: {
          salesOrderId: order.id,
          processedAt: new Date(),
        },
      });

      return { order, created: true };
    });
  } catch (error) {
    if (!isProviderEventIdUniqueViolation(error)) {
      throw error;
    }

    const existingEvent = await prisma.whatsAppWebhookEvent.findUnique({
      where: { providerEventId },
      include: { salesOrder: { include: { items: true } } },
    });
    if (existingEvent?.salesOrder) {
      return { order: existingEvent.salesOrder, created: false };
    }
    throw error;
  }
};

const isProviderEventIdUniqueViolation = (
  error: unknown
): error is Prisma.PrismaClientKnownRequestError => {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }

  const target = error.meta?.target;
  return (
    (Array.isArray(target) && target.length === 1 && target[0] === 'providerEventId') ||
    target === 'providerEventId' ||
    target === 'whatsapp_webhook_events_providerEventId_key'
  );
};

/**
 * Confirm a WhatsApp order atomically.
 * Any stock failure rolls back the entire transaction.
 */
export const confirmWhatsAppOrder = async (
  id: string,
  userId?: string
) => {
  const touchedProductIds = await prisma.$transaction(async (tx) => {
    const transition = await tx.salesOrder.updateMany({
      where: {
        id,
        channel: 'WHATSAPP',
        status: 'PENDING_REVIEW',
      },
      data: { status: 'CONFIRMED' },
    });

    if (transition.count !== 1) {
      throw new Error(
        'Order not found, not a WhatsApp order, or already decided.'
      );
    }

    const order = await tx.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order || order.items.length === 0) {
      throw new Error('Order has no items to confirm.');
    }

    const touched: string[] = [];

    for (const item of order.items) {
      if (!item.productId) {
        throw new Error(
          `Product "${item.productName}" is no longer available.`
        );
      }

      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(
          `Product "${item.productName}" no longer exists.`
        );
      }

      const update = await tx.product.updateMany({
        where: {
          id: item.productId,
          quantity: { gte: item.quantity },
        },
        data: {
          quantity: { decrement: item.quantity },
        },
      });

      if (update.count !== 1) {
        throw new Error(
          `Insufficient stock for "${item.productName}".`
        );
      }

      await recordMovement(
        tx,
        item.productId,
        'SALE',
        item.quantity,
        userId,
        `Sales Order ${order.orderNumber}`
      );

      const totalPrice = item.unitPrice * item.quantity;
      const totalCost = product.costPrice * item.quantity;

      await tx.sale.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          totalPrice,
          totalCost,
          profit: totalPrice - totalCost,
          salesOrderId: order.id,
        },
      });

      touched.push(item.productId);
    }

    return touched;
  });

  for (const productId of touchedProductIds) {
    checkAndAlertForProduct(productId).catch((err) =>
      console.error('Low-stock alert check failed:', err)
    );
  }

  const order = await getSalesOrderById(id);
  if (order?.whatsappNumber) {
    await queueWhatsAppNotification(
      order.id,
      order.whatsappNumber,
      'CONFIRMED',
      order.orderNumber
    );
  }
  return order;
};

/**
 * Reject a WhatsApp order without changing inventory.
 */
export const rejectWhatsAppOrder = async (id: string) => {
  const result = await prisma.salesOrder.updateMany({
    where: {
      id,
      channel: 'WHATSAPP',
      status: 'PENDING_REVIEW',
    },
    data: { status: 'REJECTED' },
  });

  if (result.count !== 1) {
    throw new Error(
      'Order not found, not a WhatsApp order, or already decided.'
    );
  }

  const order = await getSalesOrderById(id);
  if (order?.whatsappNumber) {
    await queueWhatsAppNotification(
      order.id,
      order.whatsappNumber,
      'REJECTED',
      order.orderNumber
    );
  }
  return order;

};

export const updateOrderStatus = async (id: string, status: 'PACKING' | 'SHIPPED' | 'CANCELLED') => {
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) throw new Error('Sales order not found.');
  if (order.channel === 'WHATSAPP' && order.status === 'PENDING_REVIEW') {
    throw new Error(
      'WhatsApp orders pending review must use the dedicated staff confirm/reject workflow.'
    );
  }
  if (order.status === 'CANCELLED') throw new Error('Cannot change status of a cancelled order.');
  return prisma.salesOrder.update({ where: { id }, data: { status } });
};

// ─── Shipment (1:1 with order, marks order SHIPPED) ────────────────────────────
export const createShipment = async (salesOrderId: string, input: CreateShipmentInput) => {
  const order = await prisma.salesOrder.findUnique({ where: { id: salesOrderId } });
  if (!order) throw new Error('Sales order not found.');
  if (order.status === 'CANCELLED') throw new Error('Cannot ship a cancelled order.');

  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.upsert({
      where: { salesOrderId },
      create: {
        salesOrderId,
        carrierName: input.carrierName,
        trackingNumber: input.trackingNumber,
        shipDate: input.shipDate ? new Date(input.shipDate) : new Date(),
        packingSlipNotes: input.packingSlipNotes,
      },
      update: {
        carrierName: input.carrierName,
        trackingNumber: input.trackingNumber,
        shipDate: input.shipDate ? new Date(input.shipDate) : undefined,
        packingSlipNotes: input.packingSlipNotes,
      },
    });

    await tx.salesOrder.update({ where: { id: salesOrderId }, data: { status: 'SHIPPED' } });

    return shipment;
  });
};

// ─── Return / RMA ───────────────────────────────────────────────────────────────
export const createReturn = async (salesOrderId: string, input: CreateReturnInput, userId?: string) => {
  const order = await prisma.salesOrder.findUnique({ where: { id: salesOrderId }, include: { sales: true } });
  if (!order) throw new Error('Sales order not found.');

  if (input.saleId && !order.sales.some((s) => s.id === input.saleId)) {
    throw new Error('That sale does not belong to this order.');
  }

  const disposition = input.disposition ?? 'RESTOCK';

  const result = await prisma.$transaction(async (tx) => {
    const returnRecord = await tx.return.create({
      data: {
        salesOrderId,
        saleId: input.saleId,
        reason: input.reason,
        disposition,
        quantity: input.quantity,
      },
    });

    let touchedProductId: string | null = null;

    if (disposition === 'RESTOCK' && input.saleId) {
      const sale = order.sales.find((s) => s.id === input.saleId)!;
      await tx.product.update({
        where: { id: sale.productId },
        data: { quantity: { increment: input.quantity } },
      });
      touchedProductId = sale.productId;
      await recordMovement(tx, sale.productId, 'RETURN_RESTOCK', input.quantity, userId, `Return on ${order.orderNumber}`);
    }

    return { returnRecord, touchedProductId };
  });

  if (result.touchedProductId) {
    checkAndAlertForProduct(result.touchedProductId).catch((err) =>
      console.error('Low-stock alert check failed:', err)
    );
  }

  return result.returnRecord;
};