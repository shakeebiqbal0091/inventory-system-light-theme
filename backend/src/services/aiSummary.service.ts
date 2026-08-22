import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../prisma';
import { getSalesTurnover } from './report.service';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const round = (n: number) => Math.round(n * 100) / 100;

// ─── Gather real numbers for the past 7 days ───────────────────────────────────
const gatherWeeklyData = async () => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [sales, lowStockCount, newPOs, receivedPOs] = await Promise.all([
    prisma.sale.findMany({ where: { createdAt: { gte: since } }, include: { product: true } }),
    prisma.product.count({ where: { quantity: { lte: prisma.product.fields.lowStockThreshold } } }).catch(() => 0),
    prisma.purchaseOrder.count({ where: { orderDate: { gte: since } } }),
    prisma.purchaseOrder.count({ where: { status: 'COMPLETED', updatedAt: { gte: since } } }),
  ]);

  const revenue = round(sales.reduce((s, x) => s + x.totalPrice, 0));
  const profit  = round(sales.reduce((s, x) => s + x.profit, 0));
  const turnover = await getSalesTurnover(7);

  // Low stock count via a safe query (the .fields trick above isn't valid Prisma — replaced below)
  const allProducts = await prisma.product.findMany();
  const lowStock = allProducts.filter(p => p.quantity <= p.lowStockThreshold);

  return {
    revenue, profit,
    unitsSold: turnover.totalUnitsSold,
    bestSellers: turnover.bestSellers.slice(0, 3),
    slowMovers: turnover.slowMovers.slice(0, 3),
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.slice(0, 5).map(p => p.name),
    newPurchaseOrders: newPOs,
    completedPurchaseOrders: receivedPOs,
  };
};

// ─── Ask Claude to turn the numbers into a short, plain-English summary ────────
export const generateWeeklySummary = async (): Promise<{ text: string; data: Awaited<ReturnType<typeof gatherWeeklyData>> }> => {
  const data = await gatherWeeklyData();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are writing a short weekly business summary email for a small business owner using an inventory management system. Write 3 short paragraphs in plain, friendly English — no headers, no bullet points, no markdown formatting. Be specific with the numbers given. Flag anything concerning (low stock, slow movers) constructively, not alarmingly.

This week's data:
- Revenue: $${data.revenue}
- Profit: $${data.profit}
- Units sold: ${data.unitsSold}
- Best sellers: ${data.bestSellers.map(p => `${p.name} (${p.unitsSold} units)`).join(', ') || 'none'}
- Slow movers (little/no sales despite stock on hand): ${data.slowMovers.map(p => p.name).join(', ') || 'none'}
- Products currently low on stock: ${data.lowStockCount} (${data.lowStockProducts.join(', ') || 'none'})
- New purchase orders placed: ${data.newPurchaseOrders}
- Purchase orders completed/received: ${data.completedPurchaseOrders}`,
    }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n\n');

  return { text, data };
};