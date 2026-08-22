import { prisma } from '../prisma';

const round = (n: number) => Math.round(n * 100) / 100;

export const getStockMovements = async (productId?: string) => {
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

// ─── Best sellers / slow movers (by units sold) ────────────────────────────────
export const getSalesTurnover = async (days = 90) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [sales, allProducts] = await Promise.all([
    prisma.sale.findMany({ where: { createdAt: { gte: since } }, include: { product: true } }),
    prisma.product.findMany(),
  ]);

  const unitsByProduct: Record<string, { name: string; unitsSold: number; revenue: number }> = {};
  for (const s of sales) {
    if (!unitsByProduct[s.productId]) {
      unitsByProduct[s.productId] = { name: s.product.name, unitsSold: 0, revenue: 0 };
    }
    unitsByProduct[s.productId].unitsSold += s.quantity;
    unitsByProduct[s.productId].revenue += s.totalPrice;
  }

  const bestSellers = Object.entries(unitsByProduct)
    .map(([productId, d]) => ({ productId, ...d, revenue: round(d.revenue) }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);

  // Slow movers: products with stock but little/no sales in the window
  const slowMovers = allProducts
    .filter((p) => p.quantity > 0)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      quantity: p.quantity,
      unitsSoldInWindow: unitsByProduct[p.id]?.unitsSold ?? 0,
    }))
    .sort((a, b) => a.unitsSoldInWindow - b.unitsSoldInWindow)
    .slice(0, 10);

  // Turnover ratio: units sold in window ÷ average stock currently on hand
  const totalUnitsSold = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalStockOnHand = allProducts.reduce((sum, p) => sum + p.quantity, 0);
  const turnoverRatio = totalStockOnHand > 0 ? round(totalUnitsSold / totalStockOnHand) : 0;

  return { days, bestSellers, slowMovers, turnoverRatio, totalUnitsSold };
};

// ─── Inventory Valuation ────────────────────────────────────────────────────────
// IMPORTANT: FIFO/LIFO are computed from actual PO receipt layers where available.
// Products with no purchase-order history fall back to `costPrice` as a flat rate —
// this is an approximation, not a full accounting-grade cost layer, and is labeled as such.
export const getInventoryValuation = async () => {
  const products = await prisma.product.findMany({
    include: {
      purchaseOrderItems: {
        where: { quantityReceived: { gt: 0 } },
        orderBy: { id: 'asc' }, // proxy for receipt order within a PO
        include: { purchaseOrder: { select: { orderDate: true } } },
      },
    },
  });

  const rows = products.map((p) => {
    const layers = p.purchaseOrderItems
      .map((i) => ({ qty: i.quantityReceived, cost: i.unitCost, date: i.purchaseOrder.orderDate }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const hasLayers = layers.length > 0;

    // Weighted Average — always computable
    const totalLayerQty = layers.reduce((s, l) => s + l.qty, 0);
    const totalLayerCost = layers.reduce((s, l) => s + l.qty * l.cost, 0);
    const wac = hasLayers && totalLayerQty > 0 ? totalLayerCost / totalLayerQty : p.costPrice;

    // FIFO: value remaining stock using the oldest layers first
    // LIFO: value remaining stock using the newest layers first
    const valueFromLayers = (orderedLayers: typeof layers) => {
      let remaining = p.quantity;
      let value = 0;
      for (const layer of orderedLayers) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, layer.qty);
        value += take * layer.cost;
        remaining -= take;
      }
      // Any stock not covered by known layers is valued at costPrice (approximation)
      if (remaining > 0) value += remaining * p.costPrice;
      return value;
    };

    const fifoValue = hasLayers ? valueFromLayers(layers) : p.quantity * p.costPrice;
    const lifoValue = hasLayers ? valueFromLayers([...layers].reverse()) : p.quantity * p.costPrice;
    const wacValue = round(p.quantity * wac);

    return {
      productId: p.id,
      name: p.name,
      quantity: p.quantity,
      hasFullCostHistory: hasLayers,
      fifoValue: round(fifoValue),
      lifoValue: round(lifoValue),
      weightedAverageValue: wacValue,
    };
  });

  return {
    products: rows,
    totals: {
      fifo: round(rows.reduce((s, r) => s + r.fifoValue, 0)),
      lifo: round(rows.reduce((s, r) => s + r.lifoValue, 0)),
      weightedAverage: round(rows.reduce((s, r) => s + r.weightedAverageValue, 0)),
    },
  };
};