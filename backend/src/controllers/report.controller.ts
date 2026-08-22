import { Request, Response } from 'express';
import * as ReportService from '../services/report.service';

export const stockMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await ReportService.getStockMovements(req.query.productId as string | undefined);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const salesTurnover = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = req.query.days ? Number(req.query.days) : 90;
    const data = await ReportService.getSalesTurnover(days);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const valuation = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await ReportService.getInventoryValuation();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};