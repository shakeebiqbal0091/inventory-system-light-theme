import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { authenticateProductRead } from './serviceAuth';

const originalServiceToken = process.env.INVENTORY_SERVICE_TOKEN;
const originalJwtSecret = process.env.JWT_SECRET;

const invoke = (headers: Record<string, string>) => {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  const req = {
    headers: normalizedHeaders,
    get(name: string) {
      return normalizedHeaders[name.toLowerCase()];
    },
  } as unknown as Request;
  const responseState = {
    locals: {} as Record<string, unknown>,
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  const res = responseState as unknown as Response & typeof responseState;
  let nextCalled = false;

  authenticateProductRead(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
};

const staffToken = (role: string) =>
  jwt.sign({ userId: 'test-user', role }, process.env.JWT_SECRET as string);

test.before(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
});

test.after(() => {
  if (originalServiceToken === undefined) {
    delete process.env.INVENTORY_SERVICE_TOKEN;
  } else {
    process.env.INVENTORY_SERVICE_TOKEN = originalServiceToken;
  }
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('accepts a valid marked service request and identifies it as a service caller', () => {
  process.env.INVENTORY_SERVICE_TOKEN = 'expected-service-token';

  const { res, nextCalled } = invoke({
    'X-Inventory-Service-Request': 'true',
    authorization: 'Bearer expected-service-token',
  });

  assert.equal(nextCalled, true);
  assert.equal(res.locals.inventoryServiceRequest, true);
});

test('rejects marked service requests when the service token is missing or blank', () => {
  for (const configuredToken of [undefined, '   ']) {
    if (configuredToken === undefined) {
      delete process.env.INVENTORY_SERVICE_TOKEN;
    } else {
      process.env.INVENTORY_SERVICE_TOKEN = configuredToken;
    }

    const { res, nextCalled } = invoke({
      'X-Inventory-Service-Request': 'true',
      authorization: `Bearer ${staffToken('STAFF')}`,
    });

    assert.equal(res.statusCode, 503);
    assert.equal(nextCalled, false);
  }
});

test('rejects missing, malformed, and incorrect service bearer tokens with 401', () => {
  process.env.INVENTORY_SERVICE_TOKEN = 'expected-service-token';

  for (const authorization of [
    undefined,
    'Basic expected-service-token',
    'Bearer',
    'Bearer wrong-service-token',
  ]) {
    const headers: Record<string, string> = {
      'X-Inventory-Service-Request': 'true',
    };
    if (authorization !== undefined) headers.authorization = authorization;

    const { res, nextCalled } = invoke(headers);
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  }
});

test('does not downgrade a failed marked service request to a valid staff JWT', () => {
  process.env.INVENTORY_SERVICE_TOKEN = 'expected-service-token';

  const { res, nextCalled } = invoke({
    'X-Inventory-Service-Request': 'true',
    authorization: `Bearer ${staffToken('STAFF')}`,
  });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('allows staff and admins through JWT auth without a configured service token', () => {
  delete process.env.INVENTORY_SERVICE_TOKEN;

  for (const role of ['STAFF', 'ADMIN']) {
    const { res, nextCalled } = invoke({
      authorization: `Bearer ${staffToken(role)}`,
    });

    assert.equal(res.statusCode, 200);
    assert.equal(nextCalled, true);
    assert.equal(res.locals.inventoryServiceRequest, undefined);
  }
});

test('rejects invalid JWTs and valid JWTs with unauthorized roles', () => {
  delete process.env.INVENTORY_SERVICE_TOKEN;

  const invalidJwt = invoke({ authorization: 'Bearer invalid-token' });
  assert.equal(invalidJwt.res.statusCode, 401);
  assert.equal(invalidJwt.nextCalled, false);

  const unauthorizedRole = invoke({
    authorization: `Bearer ${staffToken('CUSTOMER')}`,
  });
  assert.equal(unauthorizedRole.res.statusCode, 403);
  assert.equal(unauthorizedRole.nextCalled, false);
});

test('rejects an invalid marker without falling through to JWT authentication', () => {
  const { res, nextCalled } = invoke({
    'X-Inventory-Service-Request': 'false',
    authorization: `Bearer ${staffToken('STAFF')}`,
  });

  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
});
