import { prisma } from '../prisma';
import { CreateSalesOrderInput, CreateShipmentInput, CreateReturnInput } from '../types';
import { checkAndAlertForProduct } from './alert.service';
import { recordMovement } from './stockMovement.service';   // ← add to imports

const generateOrderNumber = async () => {
  const count = await prisma.salesOrder.count();
  return `SO-${String(count + 1).padStart(5, '0')}`;
};

export const getAllSalesOrders = async () => {
  return prisma.salesOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true, company: true } },
      sales: { include: { product: { select: { id: true, name: true } } } },
      shipment: true,
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
    },
  });
};

// ─── Create Sales Order (atomic: one transaction covers every line item) ──────
export const createSalesOrder = async (input: CreateSalesOrderInput, userId?: string) => {
  const orderNumber = await generateOrderNumber();

  const result = await prisma.$transaction(async (tx) => {
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

export const updateOrderStatus = async (id: string, status: 'PACKING' | 'SHIPPED' | 'CANCELLED') => {
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) throw new Error('Sales order not found.');
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