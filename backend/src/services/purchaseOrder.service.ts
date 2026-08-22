import { prisma } from '../prisma';
import { CreatePurchaseOrderInput, ReceiveStockInput } from '../types';
import { checkAndAlertForProduct } from './alert.service';
import { incrementStockLocation } from './stockLocation.service';   // ← added

const generatePoNumber = async () => {
  const count = await prisma.purchaseOrder.count();
  return `PO-${String(count + 1).padStart(5, '0')}`;
};

export const getAllPurchaseOrders = async () => {
  return prisma.purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      supplier: { select: { id: true, companyName: true } },
      items: { include: { product: { select: { id: true, name: true } } } },
    },
  });
};

export const getPurchaseOrderById = async (id: string) => {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: { select: { id: true, name: true, quantity: true } } } },
    },
  });
};

export const createPurchaseOrder = async (input: CreatePurchaseOrderInput) => {
  const poNumber = await generatePoNumber();

  return prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: input.supplierId,
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : undefined,
      notes: input.notes,
      status: 'DRAFT',
      items: {
        create: input.items.map((i) => ({
          productId: i.productId,
          quantityOrdered: i.quantityOrdered,
          unitCost: i.unitCost,
        })),
      },
    },
    include: { items: true, supplier: { select: { companyName: true } } },
  });
};

export const updateStatus = async (id: string, status: 'SENT' | 'CANCELLED') => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error('Purchase order not found.');
  if (po.status === 'COMPLETED' || po.status === 'CANCELLED') {
    throw new Error(`Cannot change status of a ${po.status.toLowerCase()} purchase order.`);
  }
  return prisma.purchaseOrder.update({ where: { id }, data: { status } });
};

// ─── Receive Stock (atomic: update items + increment product stock) ───────────
export const receiveStock = async (id: string, input: ReceiveStockInput) => {
  const result = await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
    if (!po) throw new Error('Purchase order not found.');
    if (po.status === 'COMPLETED' || po.status === 'CANCELLED') {
      throw new Error(`Cannot receive stock on a ${po.status.toLowerCase()} purchase order.`);
    }

    const touchedProductIds: string[] = [];

    for (const incoming of input.items) {
      const item = po.items.find((i) => i.id === incoming.itemId);
      if (!item) throw new Error(`Item ${incoming.itemId} does not belong to this purchase order.`);

      const damaged = incoming.damagedCount ?? 0;
      const goodQty = incoming.quantityReceived - damaged;
      if (goodQty < 0) throw new Error('Damaged count cannot exceed quantity received.');

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: {
          quantityReceived: { increment: incoming.quantityReceived },
          damagedCount: { increment: damaged },
          qualityNotes: incoming.qualityNotes ?? item.qualityNotes,
        },
      });

      if (goodQty > 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: goodQty } },
        });
        touchedProductIds.push(item.productId);
      }

      if (goodQty > 0 && incoming.warehouseId) {
        await incrementStockLocation(tx, item.productId, incoming.warehouseId, goodQty);
      }
    }   // ← ADDED: this closes the `for` loop — without it, everything below ran per-item instead of once

    // Recompute PO status from the fresh item state
    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
    const allComplete = updatedItems.every((i) => i.quantityReceived >= i.quantityOrdered);
    const anyReceived = updatedItems.some((i) => i.quantityReceived > 0);

    const newStatus = allComplete ? 'COMPLETED' : anyReceived ? 'PARTIALLY_RECEIVED' : po.status;

    const updatedPO = await tx.purchaseOrder.update({
      where: { id },
      data: { status: newStatus },
      include: { items: true, supplier: { select: { companyName: true } } },
    });

    return { updatedPO, touchedProductIds };
  });


  // Restocking may clear an active low-stock alert — check after commit
  result.touchedProductIds.forEach((pid) =>
    checkAndAlertForProduct(pid).catch((err) => console.error('Low-stock alert check failed:', err))
  );

  return result.updatedPO;
};