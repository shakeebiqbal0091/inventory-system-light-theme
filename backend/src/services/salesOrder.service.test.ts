import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma, SalesOrder } from '@prisma/client';
import { prisma } from '../prisma';
import {
  createConfirmedWhatsAppPendingOrder,
  updateOrderStatus,
} from './salesOrder.service';

const salesOrder: SalesOrder = {
  id: 'order-1',
  orderNumber: 'SO-00001',
  customerId: null,
  channel: 'WHATSAPP',
  status: 'PENDING_REVIEW',
  orderDate: new Date('2026-01-01T00:00:00.000Z'),
  notes: null,
  customerName: null,
  whatsappNumber: null,
  shippingAddress: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

type IntakeOrder = {
  id: string;
  orderNumber: string;
  channel: 'WHATSAPP';
  status: 'PENDING_REVIEW';
  customerName: string;
  whatsappNumber: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
};

type IntakeEvent = {
  id: string;
  providerEventId: string;
  eventType: string;
  salesOrderId: string | null;
  processedAt: Date | null;
};

type IntakeState = {
  events: Map<string, IntakeEvent>;
  orders: Map<string, IntakeOrder>;
  products: Map<string, { id: string; name: string; price: number; quantity: number }>;
  messages: Map<string, { recipient: string; messageBody: string; salesOrderId: string }>;
  sales: unknown[];
  stockMovements: unknown[];
};

type IntakeControls = {
  failNotification: (shouldFail: boolean) => void;
  failOrderNumberUnique: (shouldFail: boolean) => void;
};

const createIntakeState = (): IntakeState => ({
  events: new Map(),
  orders: new Map(),
  products: new Map([
    ['product-1', { id: 'product-1', name: 'Widget', price: 12.5, quantity: 8 }],
  ]),
  messages: new Map(),
  sales: [],
  stockMovements: [],
});

const cloneIntakeState = (state: IntakeState): IntakeState => ({
  events: new Map([...state.events].map(([key, value]) => [key, { ...value }])),
  orders: new Map(
    [...state.orders].map(([key, value]) => [
      key,
      { ...value, items: value.items.map((item) => ({ ...item })) },
    ])
  ),
  products: new Map([...state.products].map(([key, value]) => [key, { ...value }])),
  messages: new Map([...state.messages].map(([key, value]) => [key, { ...value }])),
  sales: [...state.sales],
  stockMovements: [...state.stockMovements],
});

const input = {
  providerEventId: 'wamid.order-confirmation-1',
  customerName: 'Test Customer',
  whatsappNumber: '+15555550100',
  customerConfirmed: true,
  items: [{ productId: 'product-1', quantity: 2 }],
};

const withIntakeDatabase = async (
  callback: (state: IntakeState, controls: IntakeControls) => Promise<void>,
  staffRecipient: string | null = '+15555550200'
) => {
  const originalTransaction = Object.getOwnPropertyDescriptor(prisma, '$transaction');
  const originalEventDelegate = Object.getOwnPropertyDescriptor(prisma, 'whatsAppWebhookEvent');
  const state = createIntakeState();
  let transactionTail = Promise.resolve();
  let shouldFailNotification = false;
  let shouldFailOrderNumberUnique = false;
  let nextOrderId = 0;
  let nextEventId = 0;

  const tx = (draft: IntakeState) => ({
    whatsAppWebhookEvent: {
      findUnique: async ({ where }: { where: { providerEventId: string } }) => {
        const event = draft.events.get(where.providerEventId);
        const order = event?.salesOrderId
          ? draft.orders.get(event.salesOrderId) ?? null
          : null;
        return event ? { ...event, salesOrder: order } : null;
      },
      create: async ({ data }: { data: { providerEventId: string; eventType: string } }) => {
        if (draft.events.has(data.providerEventId)) {
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          });
        }
        const event = {
          id: `event-${++nextEventId}`,
          providerEventId: data.providerEventId,
          eventType: data.eventType,
          salesOrderId: null,
          processedAt: null,
        };
        draft.events.set(event.providerEventId, event);
        return event;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { salesOrderId?: string; processedAt?: Date };
      }) => {
        const event = [...draft.events.values()].find((row) => row.id === where.id);
        assert.ok(event);
        Object.assign(event, data);
        return event;
      },
    },
    product: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        draft.products.get(where.id) ?? null,
    },
    salesOrder: {
      create: async ({
        data,
      }: {
        data: {
          orderNumber: string;
          customerName: string;
          whatsappNumber: string;
          items: { create: IntakeOrder['items'] };
        };
      }) => {
        if (shouldFailOrderNumberUnique) {
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
            meta: { target: ['orderNumber'] },
          });
        }
        const order: IntakeOrder = {
          id: `order-${++nextOrderId}`,
          orderNumber: data.orderNumber,
          channel: 'WHATSAPP',
          status: 'PENDING_REVIEW',
          customerName: data.customerName,
          whatsappNumber: data.whatsappNumber,
          items: data.items.create,
        };
        draft.orders.set(order.id, order);
        return order;
      },
    },
    whatsAppOutboxMessage: {
      upsert: async ({
        where,
        create,
      }: {
        where: { deduplicationKey: string };
        create: {
          deduplicationKey: string;
          recipient: string;
          messageBody: string;
          salesOrderId: string;
        };
      }) => {
        if (shouldFailNotification) throw new Error('Outbox write failed.');
        const existing = draft.messages.get(where.deduplicationKey);
        if (existing) return existing;
        draft.messages.set(create.deduplicationKey, create);
        return create;
      },
    },
    $queryRaw: async (query: TemplateStringsArray) => {
      if (query.join('').includes('pg_advisory_xact_lock')) return [];
      const highest = [...draft.orders.values()].reduce((max, order) => {
        const match = /^SO-(\d+)$/.exec(order.orderNumber);
        return match ? (BigInt(match[1]) > max ? BigInt(match[1]) : max) : max;
      }, 0n);
      return [{ highest: highest.toString() }];
    },
  });

  Object.defineProperty(prisma, '$transaction', {
    configurable: true,
    value: async (callback: (client: Prisma.TransactionClient) => Promise<unknown>) => {
      let release: () => void = () => undefined;
      const previous = transactionTail;
      transactionTail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;

      const draft = cloneIntakeState(state);
      try {
        const result = await callback(tx(draft) as unknown as Prisma.TransactionClient);
        state.events = draft.events;
        state.orders = draft.orders;
        state.products = draft.products;
        state.messages = draft.messages;
        state.sales = draft.sales;
        state.stockMovements = draft.stockMovements;
        return result;
      } finally {
        release();
      }
    },
  });

  Object.defineProperty(prisma, 'whatsAppWebhookEvent', {
    configurable: true,
    value: {
      findUnique: async ({ where }: { where: { providerEventId: string } }) => {
        const event = state.events.get(where.providerEventId);
        const order = event?.salesOrderId
          ? state.orders.get(event.salesOrderId) ?? null
          : null;
        return event ? { ...event, salesOrder: order } : null;
      },
    },
  });

  const originalRecipient = process.env.WHATSAPP_STAFF_RECIPIENT;
  if (staffRecipient === null) {
    delete process.env.WHATSAPP_STAFF_RECIPIENT;
  } else {
    process.env.WHATSAPP_STAFF_RECIPIENT = staffRecipient;
  }
  try {
    await callback(state, {
      failNotification: (shouldFail) => {
        shouldFailNotification = shouldFail;
      },
      failOrderNumberUnique: (shouldFail) => {
        shouldFailOrderNumberUnique = shouldFail;
      },
    });
  } finally {
    if (originalRecipient === undefined) {
      delete process.env.WHATSAPP_STAFF_RECIPIENT;
    } else {
      process.env.WHATSAPP_STAFF_RECIPIENT = originalRecipient;
    }
    if (originalTransaction) {
      Object.defineProperty(prisma, '$transaction', originalTransaction);
    } else {
      delete (prisma as unknown as Record<string, unknown>).$transaction;
    }
    if (originalEventDelegate) {
      Object.defineProperty(prisma, 'whatsAppWebhookEvent', originalEventDelegate);
    } else {
      delete (prisma as unknown as Record<string, unknown>).whatsAppWebhookEvent;
    }
  }
};

test('confirmed WhatsApp intake creates a pending order, snapshots, and staff notification without stock effects', async () => {
  await withIntakeDatabase(async (state) => {
    const result = await createConfirmedWhatsAppPendingOrder(input);

    assert.equal(result.created, true);
    assert.equal(result.order.status, 'PENDING_REVIEW');
    assert.equal(result.order.channel, 'WHATSAPP');
    assert.deepEqual(result.order.items, [{
      productId: 'product-1',
      productName: 'Widget',
      quantity: 2,
      unitPrice: 12.5,
      totalPrice: 25,
    }]);
    assert.equal(state.events.get(input.providerEventId)?.salesOrderId, result.order.id);
    assert.ok(state.events.get(input.providerEventId)?.processedAt);
    assert.equal(state.products.get('product-1')?.quantity, 8);
    assert.equal(state.sales.length, 0);
    assert.equal(state.stockMovements.length, 0);
    assert.equal(state.messages.size, 1);
    assert.equal([...state.messages.values()][0].recipient, '+15555550200');
  });
});

test('repeated WhatsApp event delivery returns the original order without duplicates', async () => {
  await withIntakeDatabase(async (state) => {
    const first = await createConfirmedWhatsAppPendingOrder(input);
    const duplicate = await createConfirmedWhatsAppPendingOrder(input);

    assert.equal(first.created, true);
    assert.equal(duplicate.created, false);
    assert.equal(duplicate.order.id, first.order.id);
    assert.equal(state.events.size, 1);
    assert.equal(state.orders.size, 1);
    assert.equal(state.messages.size, 1);
  });
});

test('an existing orphan event is not used to create a second order', async () => {
  await withIntakeDatabase(async (state) => {
    state.events.set(input.providerEventId, {
      id: 'event-orphan',
      providerEventId: input.providerEventId,
      eventType: 'ORDER_CONFIRMATION',
      salesOrderId: null,
      processedAt: null,
    });

    await assert.rejects(
      createConfirmedWhatsAppPendingOrder(input),
      /already exists without an associated order/
    );
    assert.equal(state.events.size, 1);
    assert.equal(state.orders.size, 0);
    assert.equal(state.messages.size, 0);
  });
});

test('an existing unprocessed event returns its order, marks it processed, and deduplicates its notice', async () => {
  await withIntakeDatabase(async (state) => {
    const existingOrder: IntakeOrder = {
      id: 'order-existing',
      orderNumber: 'SO-00017',
      channel: 'WHATSAPP',
      status: 'PENDING_REVIEW',
      customerName: 'Existing Customer',
      whatsappNumber: '+15555550100',
      items: [{
        productId: 'product-1',
        productName: 'Widget',
        quantity: 1,
        unitPrice: 12.5,
        totalPrice: 12.5,
      }],
    };
    state.orders.set(existingOrder.id, existingOrder);
    state.events.set(input.providerEventId, {
      id: 'event-unprocessed',
      providerEventId: input.providerEventId,
      eventType: 'ORDER_CONFIRMATION',
      salesOrderId: existingOrder.id,
      processedAt: null,
    });
    state.messages.set(`whatsapp-staff-review-${existingOrder.id}`, {
      recipient: '+15555550200',
      messageBody: 'Existing review notification.',
      salesOrderId: existingOrder.id,
    });

    const result = await createConfirmedWhatsAppPendingOrder(input);

    assert.equal(result.created, false);
    assert.equal(result.order.id, existingOrder.id);
    assert.ok(state.events.get(input.providerEventId)?.processedAt);
    assert.equal(state.orders.size, 1);
    assert.equal(state.messages.size, 1);
    assert.equal(
      state.messages.get(`whatsapp-staff-review-${existingOrder.id}`)?.messageBody,
      'Existing review notification.'
    );
  });
});

test('concurrent duplicate WhatsApp event deliveries create one order and notification', async () => {
  await withIntakeDatabase(async (state) => {
    const results = await Promise.all([
      createConfirmedWhatsAppPendingOrder(input),
      createConfirmedWhatsAppPendingOrder(input),
    ]);

    assert.equal(results.filter((result) => result.created).length, 1);
    assert.equal(new Set(results.map((result) => result.order.id)).size, 1);
    assert.equal(state.events.size, 1);
    assert.equal(state.orders.size, 1);
    assert.equal(state.messages.size, 1);
  });
});

test('distinct WhatsApp events receive distinct order numbers in the serialized mock', async () => {
  await withIntakeDatabase(async (state) => {
    const results = await Promise.all([
      createConfirmedWhatsAppPendingOrder(input),
      createConfirmedWhatsAppPendingOrder({
        ...input,
        providerEventId: 'wamid.order-confirmation-2',
      }),
    ]);

    assert.deepEqual(
      results.map((result) => result.order.orderNumber).sort(),
      ['SO-00001', 'SO-00002']
    );
    assert.equal(state.orders.size, 2);
    assert.equal(state.events.size, 2);
    assert.equal(state.messages.size, 2);
  });
});

test('invalid confirmation and order details fail before creating database records', async () => {
  await withIntakeDatabase(async (state) => {
    const invalidInputs = [
      { ...input, customerConfirmed: false },
      { ...input, providerEventId: '   ' },
      { ...input, customerName: '   ' },
      { ...input, whatsappNumber: 'not-a-phone' },
      { ...input, items: [{ productId: 'product-1', quantity: 0 }] },
      { ...input, items: [{ productId: 'product-1', quantity: 1.5 }] },
    ];

    for (const invalidInput of invalidInputs) {
      await assert.rejects(
        createConfirmedWhatsAppPendingOrder(invalidInput),
      );
    }

    assert.equal(state.events.size, 0);
    assert.equal(state.orders.size, 0);
    assert.equal(state.messages.size, 0);
  });
});

test('unknown product IDs roll back the event and create no order or notification', async () => {
  await withIntakeDatabase(async (state) => {
    await assert.rejects(
      createConfirmedWhatsAppPendingOrder({
        ...input,
        items: [{ productId: 'missing-product', quantity: 1 }],
      }),
      /Product missing-product not found/
    );

    assert.equal(state.events.size, 0);
    assert.equal(state.orders.size, 0);
    assert.equal(state.messages.size, 0);
  });
});

test('WhatsApp intake rolls back event and order if staff notification enqueueing fails', async () => {
  await withIntakeDatabase(async (state, controls) => {
    controls.failNotification(true);

    await assert.rejects(
      createConfirmedWhatsAppPendingOrder(input),
      /Outbox write failed/
    );

    assert.equal(state.events.size, 0);
    assert.equal(state.orders.size, 0);
    assert.equal(state.messages.size, 0);
  });
});

test('order-number unique failures are not treated as duplicate provider events', async () => {
  await withIntakeDatabase(async (state, controls) => {
    controls.failOrderNumberUnique(true);

    await assert.rejects(
      createConfirmedWhatsAppPendingOrder(input),
      (error: unknown) =>
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta.target[0] === 'orderNumber'
    );

    assert.equal(state.events.size, 0);
    assert.equal(state.orders.size, 0);
    assert.equal(state.messages.size, 0);
  });
});

test('WhatsApp intake fails without a staff recipient configuration', async () => {
  await withIntakeDatabase(async (state) => {
    await assert.rejects(
      createConfirmedWhatsAppPendingOrder(input),
      /staff notification recipient is not configured/
    );

    assert.equal(state.events.size, 0);
    assert.equal(state.orders.size, 0);
    assert.equal(state.messages.size, 0);
  }, null);
});

test('generic status updates reject WhatsApp orders pending staff review', async () => {
  const originalDelegate = prisma.salesOrder;
  let findUniqueCalls = 0;
  let updateCalls = 0;
  Object.defineProperty(prisma, 'salesOrder', {
    configurable: true,
    value: {
      findUnique: async () => {
        findUniqueCalls += 1;
        return salesOrder;
      },
      update: async () => {
        updateCalls += 1;
        return salesOrder;
      },
    },
  });

  try {
    await assert.rejects(
      updateOrderStatus(salesOrder.id, 'PACKING'),
      /dedicated staff confirm\/reject workflow/
    );

    assert.equal(findUniqueCalls, 1);
    assert.equal(updateCalls, 0);
  } finally {
    Object.defineProperty(prisma, 'salesOrder', {
      configurable: true,
      value: originalDelegate,
    });
  }
});

test('generic status updates preserve behavior for non-WhatsApp orders', async () => {
  const nonWhatsAppOrder = {
    ...salesOrder,
    channel: 'IN_STORE' as const,
    status: 'PENDING' as const,
  };
  const updatedOrder = { ...nonWhatsAppOrder, status: 'PACKING' as const };
  const originalDelegate = prisma.salesOrder;
  let findUniqueCalls = 0;
  const updateCalls: unknown[] = [];
  Object.defineProperty(prisma, 'salesOrder', {
    configurable: true,
    value: {
      findUnique: async () => {
        findUniqueCalls += 1;
        return nonWhatsAppOrder;
      },
      update: async (args: unknown) => {
        updateCalls.push(args);
        return updatedOrder;
      },
    },
  });

  try {
    assert.deepEqual(
      await updateOrderStatus(nonWhatsAppOrder.id, 'PACKING'),
      updatedOrder
    );
    assert.equal(findUniqueCalls, 1);
    assert.equal(updateCalls.length, 1);
    assert.deepEqual(updateCalls[0], {
      where: { id: nonWhatsAppOrder.id },
      data: { status: 'PACKING' },
    });
  } finally {
    Object.defineProperty(prisma, 'salesOrder', {
      configurable: true,
      value: originalDelegate,
    });
  }
});
