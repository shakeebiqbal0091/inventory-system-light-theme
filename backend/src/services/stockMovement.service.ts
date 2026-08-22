import { prisma } from '../prisma';
import { MovementType } from '@prisma/client';

// tx is `any` so this can be called from inside any existing $transaction block
export const recordMovement = async (
  tx: any, productId: string, type: MovementType, quantity: number, userId?: string, note?: string
) => {
  await tx.stockMovement.create({
    data: { productId, type, quantity, userId, note },
  });
};

export const getMovements = async (productId?: string) => {
  return prisma.stockMovement.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
    take: 200,
  });
};