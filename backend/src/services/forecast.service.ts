import { prisma } from '../prisma';

const round = (n: number) => Math.round(n * 100) / 100;
const FORECAST_WINDOW_DAYS = 30;
const DEFAULT_LEAD_TIME_DAYS = 7;

export const getReorderSuggestions = async () => {
  const since = new Date(Date.now() - FORECAST_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [products, sales] = await Promise.all([
    prisma.product.findMany({ include: { supplierRef: { select: { companyName: true, leadTimeDays: true } } } }),
    prisma.sale.findMany({ where: { createdAt: { gte: since } } }),
  ]);

  const unitsSoldByProduct: Record<string, number> = {};
  for (const s of sales) {
    unitsSoldByProduct[s.productId] = (unitsSoldByProduct[s.productId] ?? 0) + s.quantity;
  }

  const actionable: any[] = [];
  const noRecentSales: any[] = [];

  for (const p of products) {
    const unitsSold = unitsSoldByProduct[p.id] ?? 0;
    const avgDailySales = round(unitsSold / FORECAST_WINDOW_DAYS);

    if (avgDailySales <= 0) {
      noRecentSales.push({ productId: p.id, name: p.name, currentStock: p.quantity });
      continue;
    }

    const leadTimeDays = p.supplierRef?.leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS;
    const daysUntilStockout = round(p.quantity / avgDailySales);
    const suggestedReorderQty = Math.max(0, Math.ceil(avgDailySales * FORECAST_WINDOW_DAYS) - p.quantity);

    const urgency =
      daysUntilStockout <= leadTimeDays ? 'critical' :
      daysUntilStockout <= leadTimeDays * 1.5 ? 'warning' : 'ok';

    actionable.push({
      productId: p.id,
      name: p.name,
      currentStock: p.quantity,
      avgDailySales,
      daysUntilStockout,
      leadTimeDays,
      supplierName: p.supplierRef?.companyName ?? null,
      suggestedReorderQty,
      urgency,
    });
  }

  actionable.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

  return { windowDays: FORECAST_WINDOW_DAYS, suggestions: actionable, noRecentSales };
};