import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { authenticate, requireRole } from './auth';
import { Role } from '@prisma/client';

const serviceRequestHeader = 'X-Inventory-Service-Request';

export const authenticateProductRead = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceRequestMarker = req.get(serviceRequestHeader);

  if (serviceRequestMarker === undefined) {
    authenticate(req, res, () => {
      requireRole(Role.ADMIN, Role.STAFF)(req, res, next);
    });
    return;
  }

  if (serviceRequestMarker !== 'true') {
    res.status(400).json({
      success: false,
      error: 'Invalid inventory service request marker.',
    });
    return;
  }

  authenticateInventoryService(req, res, () => {
    res.locals.inventoryServiceRequest = true;
    next();
  });
};

export const authenticateInventoryService = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const expectedToken = process.env.INVENTORY_SERVICE_TOKEN;
  const authHeader = req.headers.authorization;

  const configuredToken = expectedToken?.trim();

  if (!configuredToken) {
    res.status(503).json({
      success: false,
      error: 'Inventory service authentication is not configured.',
    });
    return;
  }

  const bearerMatch = authHeader?.match(/^Bearer[ \t]+([^\s]+)$/i);
  if (!bearerMatch) {
    res.status(401).json({
      success: false,
      error: 'Access denied. Invalid or missing service token.',
    });
    return;
  }

  const expected = Buffer.from(configuredToken, 'utf8');
  const supplied = Buffer.from(bearerMatch[1], 'utf8');

  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    res.status(401).json({
      success: false,
      error: 'Access denied. Invalid or missing service token.',
    });
    return;
  }

  next();
};