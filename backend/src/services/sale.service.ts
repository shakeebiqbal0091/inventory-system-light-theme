// src/services/sale.service.ts
import { prisma } from '../prisma';
import { CreateSaleInput } from '../types';

const round = (n: number) => Math.round(n * 100) / 100;

// ─── Get All Sales ────────────────────────────────────────────────────────────

export const getAllSales = async () => {
  return prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, name: true, category: true, costPrice: true, price: true } },
    },
  });
};

// ─── Create Sale (atomic: deduct stock + calculate profit) ────────────────────

export const createSale = async (input: CreateSaleInput) => {
  const { productId, quantity } = input;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found.');
    if (product.quantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`);
    }

    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantity } },
    });

    const totalPrice = product.price     * quantity;  // Revenue
    const totalCost  = product.costPrice * quantity;  // What it cost us
    const profit     = totalPrice - totalCost;        // Gross profit

    const sale = await tx.sale.create({
      data: { productId, quantity, totalPrice, totalCost, profit },
      include: { product: { select: { id: true, name: true, category: true } } },
    });

    return { sale, updatedProduct };
  });
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const [totalProducts, totalSales, aggregates, allProducts, recentSales, allSales] =
    await Promise.all([
      prisma.product.count(),
      prisma.sale.count(),
      prisma.sale.aggregate({
        _sum: { totalPrice: true, totalCost: true, profit: true },
      }),
      prisma.product.findMany(),
      prisma.sale.findMany({
        take: 7,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, category: true } } },
      }),
      prisma.sale.findMany({
        include: { product: { select: { name: true, category: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

  // ── Core KPIs ──────────────────────────────────────────────────────────────
  const totalRevenue    = round(aggregates._sum.totalPrice ?? 0);
  const totalCost       = round(aggregates._sum.totalCost  ?? 0);
  const totalProfit     = round(aggregates._sum.profit     ?? 0);
  const profitMarginPct = totalRevenue > 0
    ? round((totalProfit / totalRevenue) * 100) : 0;

  // ── Low stock ──────────────────────────────────────────────────────────────
  const lowStockProducts = allProducts.filter(p => p.quantity <= p.lowStockThreshold);

  // ── Category breakdown ─────────────────────────────────────────────────────
  const catMap: Record<string, { revenue: number; profit: number; cost: number }> = {};
  for (const s of allSales) {
    const cat = s.product.category;
    if (!catMap[cat]) catMap[cat] = { revenue: 0, profit: 0, cost: 0 };
    catMap[cat].revenue += s.totalPrice;
    catMap[cat].profit  += s.profit;
    catMap[cat].cost    += s.totalCost;
  }
  const categoryData = Object.entries(catMap).map(([category, d]) => ({
    category,
    revenue: round(d.revenue),
    profit:  round(d.profit),
    cost:    round(d.cost),
    margin:  d.revenue > 0 ? round((d.profit / d.revenue) * 100) : 0,
  }));

  // ── Monthly revenue + profit (for charts) ─────────────────────────────────
  const monthMap: Record<string, { revenue: number; profit: number; cost: number }> = {};
  for (const s of allSales) {
    const key = (s.createdAt as Date).toISOString().slice(0, 7);
    if (!monthMap[key]) monthMap[key] = { revenue: 0, profit: 0, cost: 0 };
    monthMap[key].revenue += s.totalPrice;
    monthMap[key].profit  += s.profit;
    monthMap[key].cost    += s.totalCost;
  }
  const monthlySales = Object.entries(monthMap).map(([month, d]) => ({
    month,
    revenue: round(d.revenue),
    profit:  round(d.profit),
    cost:    round(d.cost),
  }));

  // ── Top profitable products ────────────────────────────────────────────────
  const prodMap: Record<string, { name: string; category: string; revenue: number; profit: number; unitsSold: number }> = {};
  for (const s of allSales) {
    const pid = s.productId;
    if (!prodMap[pid]) prodMap[pid] = {
      name: s.product.name, category: s.product.category,
      revenue: 0, profit: 0, unitsSold: 0,
    };
    prodMap[pid].revenue  += s.totalPrice;
    prodMap[pid].profit   += s.profit;
    prodMap[pid].unitsSold += s.quantity;
  }
  const topProfitableProducts = Object.values(prodMap)
    .map(p => ({
      ...p,
      revenue: round(p.revenue),
      profit:  round(p.profit),
      margin:  p.revenue > 0 ? round((p.profit / p.revenue) * 100) : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  return {
    totalProducts, totalSales,
    totalRevenue, totalCost, totalProfit, profitMarginPct,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 5),
    recentSales,
    categoryData,
    monthlySales,
    topProfitableProducts,
  };
};
