import test from 'node:test';
import assert from 'node:assert/strict';
import { createWhatsAppOrderSchema } from './whatsapp.validator';

const validOrder = {
  providerEventId: 'wamid.order-confirmation-1',
  customerConfirmed: true,
  customerName: 'Test Customer',
  whatsappNumber: '+15555550100',
  shippingAddress: '123 Example Street',
  items: [{ productId: 'product-1', quantity: 2 }],
};

test('WhatsApp order validation requires explicit confirmation and a provider event ID', () => {
  assert.equal(createWhatsAppOrderSchema.safeParse(validOrder).success, true);
  assert.equal(
    createWhatsAppOrderSchema.safeParse({
      ...validOrder,
      customerConfirmed: false,
    }).success,
    false
  );
  assert.equal(
    createWhatsAppOrderSchema.safeParse({
      ...validOrder,
      providerEventId: ' ',
    }).success,
    false
  );
});

test('WhatsApp order validation rejects malformed customer and item details', () => {
  assert.equal(
    createWhatsAppOrderSchema.safeParse({
      ...validOrder,
      whatsappNumber: 'not-a-number',
    }).success,
    false
  );
  assert.equal(
    createWhatsAppOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: 'product-1', quantity: 0 }],
    }).success,
    false
  );
});
