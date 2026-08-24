import Anthropic from '@anthropic-ai/sdk';
import { getAllProducts, getLowStockProducts } from './product.service';
import { getSalesTurnover, getInventoryValuation, getStockMovements } from './report.service';
import { getAllSuppliers } from './supplier.service';
import { getAllCustomers } from './customer.service';
import { getAllPurchaseOrders } from './purchaseOrder.service';
import { getAllSalesOrders } from './salesOrder.service';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: 'get_products',
    description: 'List all products with stock, price, and cost info.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_low_stock_products',
    description: 'List products currently at or below their low-stock threshold.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_sales_turnover',
    description: 'Get best sellers, slow movers, and turnover ratio for a recent window.',
    input_schema: {
      type: 'object',
      properties: { days: { type: 'number', description: 'Lookback window in days, default 90' } },
    },
  },
  {
    name: 'get_inventory_valuation',
    description: 'Get total inventory value (FIFO, LIFO, weighted average) and per-product breakdown.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_suppliers',
    description: 'List all suppliers with contact info and payment terms.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_customers',
    description: 'List all customers.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_purchase_orders',
    description: 'List purchase orders, optionally filtered by status.',
    input_schema: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'] } },
    },
  },
  {
    name: 'get_sales_orders',
    description: 'List sales orders, optionally filtered by status.',
    input_schema: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['PENDING', 'PACKING', 'SHIPPED', 'CANCELLED'] } },
    },
  },
  {
    name: 'get_stock_movements',
    description: 'Get recent stock movement history, optionally for one product.',
    input_schema: {
      type: 'object',
      properties: { productId: { type: 'string' } },
    },
  },
];

const executeTool = async (name: string, input: any): Promise<any> => {
  switch (name) {
    case 'get_products': return getAllProducts();
    case 'get_low_stock_products': return getLowStockProducts();
    case 'get_sales_turnover': return getSalesTurnover(input.days ?? 90);
    case 'get_inventory_valuation': return getInventoryValuation();
    case 'get_suppliers': return getAllSuppliers();
    case 'get_customers': return getAllCustomers();
    case 'get_purchase_orders': {
      const all = await getAllPurchaseOrders();
      return input.status ? all.filter((o: any) => o.status === input.status) : all;
    }
    case 'get_sales_orders': {
      const all = await getAllSalesOrders();
      return input.status ? all.filter((o: any) => o.status === input.status) : all;
    }
    case 'get_stock_movements': return getStockMovements(input.productId);
    default: throw new Error(`Unknown tool: ${name}`);
  }
};

const SYSTEM_PROMPT = `You are an assistant embedded in an inventory management system called Inventory Pro. You answer questions about the business's products, stock, sales, suppliers, customers, purchase orders, and sales orders using the tools available. Be concise and specific with numbers. Never guess or make up data — only state facts backed by tool results. You cannot create, edit, or delete anything — you are read-only and should say so if asked to take an action.`;

export const chatWithAssistant = async (messages: Anthropic.MessageParam[]): Promise<string> => {
  let currentMessages = [...messages];

  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      tools,
      messages: currentMessages,
    });

    if (response.stop_reason !== 'tool_use') {
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
    }

    currentMessages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        try {
          const result = await executeTool(block.name, block.input);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
        } catch (err: any) {
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Error: ${err.message}`, is_error: true });
        }
      }
    }
    currentMessages.push({ role: 'user', content: toolResults });
  }

  return "I wasn't able to finish looking that up — could you rephrase your question?";
};