// src/routes/product.routes.ts
import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All product routes require authentication
router.use(authenticate);

router.get('/', ProductController.getAll);
router.get('/low-stock', ProductController.getLowStock);
router.get('/:id', ProductController.getOne);

// Only ADMIN can create, update, delete products
router.post('/', requireRole('ADMIN'), ProductController.create);
router.put('/:id', requireRole('ADMIN'), ProductController.update);
router.delete('/:id', requireRole('ADMIN'), ProductController.remove);

export default router;
