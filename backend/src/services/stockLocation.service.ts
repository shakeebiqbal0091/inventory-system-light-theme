import { prisma } from '../prisma';
import { TransferStockInput } from '../types';
import { recordMovement } from './stockMovement.service';   // ← add to imports

export const getStockByProduct = async (productId: string) => {
  return prisma.stockLocation.findMany({
    where: { productId },
    include: { warehouse: { select: { id: true, name: true } } },
  });
};

export const getStockByWarehouse = async (warehouseId: string) => {
  return prisma.stockLocation.findMany({
    where: { warehouseId },
    include: { product: { select: { id: true, name: true, quantity: true } } },
  });
};

// Used internally by PO receiving — additive, does not touch Product.quantity
// (that increment already happens in purchaseOrder.service.ts)
export const incrementStockLocation = async (
  tx: any, productId: string, warehouseId: string, quantity: number
) => {
  await tx.stockLocation.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    create: { productId, warehouseId, quantity },
    update: { quantity: { increment: quantity } },
  });
};

// ─── Transfer stock between warehouses (atomic, does not change total) ────────
export const transferStock = async (input: TransferStockInput, userId?: string) => {
  const { productId, fromWarehouseId, toWarehouseId, quantity } = input;

  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.stockLocation.updateMany({
      where: { productId, warehouseId: fromWarehouseId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });

    if (updateResult.count === 0) {
      throw new Error('Insufficient stock at source warehouse for this transfer.');
    }

    await tx.stockLocation.upsert({
      where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
      create: { productId, warehouseId: toWarehouseId, quantity },
      update: { quantity: { increment: quantity } },
    });

    return { success: true };
    await recordMovement(tx, productId, 'TRANSFER_OUT', quantity, userId, `To warehouse ${toWarehouseId}`);
    await recordMovement(tx, productId, 'TRANSFER_IN', quantity, userId, `From warehouse ${fromWarehouseId}`);
  });
};