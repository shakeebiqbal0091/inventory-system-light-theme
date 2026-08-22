// src/services/product.service.ts
import { prisma } from '../prisma';
import { CreateProductInput, UpdateProductInput } from '../types';

// ─── Get All Products ─────────────────────────────────────────────────────────

export const getAllProducts = async () => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Annotate each product with low stock flag
  return products.map((p) => ({
    ...p,
    isLowStock: p.quantity <= p.lowStockThreshold,
  }));
};

// ─── Get Single Product ───────────────────────────────────────────────────────

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { createdAt: 'desc' },
        take: 10, // last 10 sales for this product
      },
    },
  });

  if (!product) throw new Error('Product not found.');

  return {
    ...product,
    isLowStock: product.quantity <= product.lowStockThreshold,
  };
};

// ─── Create Product ───────────────────────────────────────────────────────────

export const createProduct = async (input: CreateProductInput) => {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      category: input.category,
      price: input.price,
      costPrice: input.costPrice ?? 0,   // ← added (defaults to 0 if omitted, same as schema default)
      quantity: input.quantity,
      lowStockThreshold: input.lowStockThreshold ?? 10,
      supplier: input.supplier,
      description: input.description,
    },
  });

  return { ...product, isLowStock: product.quantity <= product.lowStockThreshold };
};


// ─── Update Product ───────────────────────────────────────────────────────────

import { checkAndAlertForProduct } from './alert.service';   // ← add import
import { recordMovement } from './stockMovement.service';

export const updateProduct = async (id: string, input: UpdateProductInput, userId?: string) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error('Product not found.');

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({ where: { id }, data: input });
    if (input.quantity !== undefined && input.quantity !== existing.quantity) {
      await recordMovement(tx, id, 'MANUAL_ADJUSTMENT', input.quantity - existing.quantity, userId, 'Manual product edit');
    }
    return updated;
  });

  if (input.quantity !== undefined) {
    checkAndAlertForProduct(id).catch((err) =>
      console.error('Low-stock alert check failed:', err)
    );
  }

  return { ...product, isLowStock: product.quantity <= product.lowStockThreshold };
};

// ─── Delete Product ───────────────────────────────────────────────────────────

export const deleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error('Product not found.');

  await prisma.product.delete({ where: { id } });
  return { id };
};

// ─── Get Low Stock Products ───────────────────────────────────────────────────

export const getLowStockProducts = async () => {
  const products = await prisma.product.findMany({
    orderBy: { quantity: 'asc' },
  });

  return products
    .filter((p) => p.quantity <= p.lowStockThreshold)
    .map((p) => ({ ...p, isLowStock: true }));
};
