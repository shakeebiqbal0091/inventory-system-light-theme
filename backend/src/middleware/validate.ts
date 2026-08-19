// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// ─── Generic Validation Middleware ─────────────────────────────────────────────
// Validates req.body against a zod schema, replaces req.body with the
// parsed (and type-coerced) result so downstream code gets clean data.

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.issues[0];
      res.status(400).json({
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      });
      return;
    }

    req.body = result.data;
    next();
  };
};