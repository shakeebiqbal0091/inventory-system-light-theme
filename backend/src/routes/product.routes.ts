// src/routes/product.routes.ts
import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticate);

router.get('/', ProductController.getAll);
router.get('/low-stock', ProductController.getLowStock);
router.get('/:id', ProductController.getOne);

router.post('/', requireRole('ADMIN'), validate(createProductSchema), ProductController.create);
router.put('/:id', requireRole('ADMIN'), validate(updateProductSchema), ProductController.update);
router.delete('/:id', requireRole('ADMIN'), ProductController.remove);

export default router;