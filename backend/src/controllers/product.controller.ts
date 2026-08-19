// src/controllers/product.controller.ts
import { Request, Response } from 'express';
import * as ProductService from '../services/product.service';

// GET /products
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await ProductService.getAllProducts();
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /products/low-stock
export const getLowStock = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await ProductService.getLowStockProducts();
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /products/:id
export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};

// POST /products  (Admin only)
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductService.createProduct(req.body);
    res.status(201).json({ success: true, data: product, message: 'Product created.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PUT /products/:id  (Admin only)
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product, message: 'Product updated.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE /products/:id  (Admin only)
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await ProductService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
