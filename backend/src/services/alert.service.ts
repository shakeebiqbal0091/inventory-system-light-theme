// src/services/alert.service.ts
import { prisma } from '../prisma';
import { sendLowStockAlert } from './email.service';

// Checks a single product after a change; sends an alert if it just crossed
// into low-stock territory and hasn't already been alerted.
export const checkAndAlertForProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const isLow = product.quantity <= product.lowStockThreshold;

  if (isLow && !product.lastAlertedAt) {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    });

    await sendLowStockAlert(
      admins.map((a) => a.email),
      [{ name: product.name, quantity: product.quantity, lowStockThreshold: product.lowStockThreshold }]
    );

    await prisma.product.update({
      where: { id: productId },
      data: { lastAlertedAt: new Date() },
    });
  } else if (!isLow && product.lastAlertedAt) {
    // Restocked above threshold — clear the alert flag so a future dip re-alerts
    await prisma.product.update({
      where: { id: productId },
      data: { lastAlertedAt: null },
    });
  }
};

// Daily digest: catches anything low that wasn't caught by the per-sale check
// (e.g. manual quantity edits), batched into a single email.
export const runLowStockDigest = async () => {
  const lowStockProducts = await prisma.product.findMany({
    where: { lastAlertedAt: null },
  });

  const trulyLow = lowStockProducts.filter((p) => p.quantity <= p.lowStockThreshold);
  if (trulyLow.length === 0) return;

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true },
  });

  await sendLowStockAlert(
    admins.map((a) => a.email),
    trulyLow.map((p) => ({ name: p.name, quantity: p.quantity, lowStockThreshold: p.lowStockThreshold }))
  );

  await prisma.product.updateMany({
    where: { id: { in: trulyLow.map((p) => p.id) } },
    data: { lastAlertedAt: new Date() },
  });
};