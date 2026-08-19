// src/controllers/sale.controller.ts
import { Request, Response } from 'express';
import * as SaleService from '../services/sale.service';

// GET /sales
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sales = await SaleService.getAllSales();
    res.status(200).json({ success: true, data: sales });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /sales
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await SaleService.createSale(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Sale recorded and stock updated.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
// GET /dashboard/stats
export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await SaleService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
