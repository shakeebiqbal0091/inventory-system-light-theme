import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { authenticateProductRead } from '../middleware/serviceAuth';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator';

const router = Router();

// Read-only access for the service agent and authenticated staff.
router.get('/', authenticateProductRead, ProductController.getAll);
router.get('/low-stock', authenticateProductRead, ProductController.getLowStock);
router.get('/:id', authenticateProductRead, ProductController.getOne);

// Write operations remain protected by existing JWT authentication.
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validate(createProductSchema),
  ProductController.create
);

router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(updateProductSchema),
  ProductController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  ProductController.remove
);

export default router;