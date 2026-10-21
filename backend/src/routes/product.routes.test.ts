import test from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response } from 'express';
import { getAll, getLowStock, getOne } from '../controllers/product.controller';
import * as ProductService from '../services/product.service';

const productServiceModule = require('../services/product.service') as {
  getAllProducts: typeof ProductService.getAllProducts;
  getLowStockProducts: typeof ProductService.getLowStockProducts;
  getProductById: typeof ProductService.getProductById;
};

const productWithSensitiveFields: Awaited<
  ReturnType<typeof ProductService.getAllProducts>
>[number] = {
  id: 'product-1',
  name: 'Widget',
  category: 'Tools',
  price: 12.5,
  costPrice: 4.25,
  quantity: 8,
  lowStockThreshold: 10,
  supplier: 'Internal Supplier',
  description: 'Internal description',
  lastAlertedAt: null,
  supplierId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  isLowStock: true,
};

const productWithSensitiveRelations: Awaited<
  ReturnType<typeof ProductService.getProductById>
> = {
  ...productWithSensitiveFields,
  sales: [
    {
      id: 'sale-1',
      productId: 'product-1',
      quantity: 2,
      totalPrice: 25,
      totalCost: 8,
      profit: 17,
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      salesOrderId: null,
    },
  ],
};

const invokeController = async (
  controller: (req: Request, res: Response) => Promise<void>,
  serviceCaller: boolean,
  params: Record<string, string> = {}
) => {
  const req = { params } as unknown as Request;
  const responseState = {
    locals: serviceCaller ? { inventoryServiceRequest: true } : {},
    statusCode: 200,
    body: {} as { data?: unknown },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: { data?: unknown }) {
      this.body = body;
      return this;
    },
  };
  const res = responseState as unknown as Response & typeof responseState;

  await controller(req, res);
  return res;
};

test('service product list responses contain only the approved product fields', async () => {
  const original = productServiceModule.getAllProducts;
  productServiceModule.getAllProducts = async () => [productWithSensitiveFields];

  try {
    const res = await invokeController(getAll, true);
    assert.deepEqual(res.body.data, [
      { id: 'product-1', name: 'Widget', price: 12.5, quantity: 8 },
    ]);
  } finally {
    productServiceModule.getAllProducts = original;
  }
});

test('staff product list responses preserve their existing fields', async () => {
  const original = productServiceModule.getAllProducts;
  productServiceModule.getAllProducts = async () => [productWithSensitiveFields];

  try {
    const res = await invokeController(getAll, false);
    assert.deepEqual(res.body.data, [productWithSensitiveFields]);
  } finally {
    productServiceModule.getAllProducts = original;
  }
});

test('service low-stock and single-product responses use the same whitelist', async () => {
  const originalLowStock = productServiceModule.getLowStockProducts;
  const originalById = productServiceModule.getProductById;
  productServiceModule.getLowStockProducts = async () => [
    productWithSensitiveFields,
  ];
  productServiceModule.getProductById = async () =>
    productWithSensitiveRelations;

  try {
    const lowStockResponse = await invokeController(getLowStock, true);
    const singleProductResponse = await invokeController(
      getOne,
      true,
      { id: 'product-1' }
    );
    const expected = {
      id: 'product-1',
      name: 'Widget',
      price: 12.5,
      quantity: 8,
    };

    assert.deepEqual(lowStockResponse.body.data, [expected]);
    assert.deepEqual(singleProductResponse.body.data, expected);
  } finally {
    productServiceModule.getLowStockProducts = originalLowStock;
    productServiceModule.getProductById = originalById;
  }
});
