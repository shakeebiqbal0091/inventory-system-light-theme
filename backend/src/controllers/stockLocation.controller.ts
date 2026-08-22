import { Request, Response } from 'express';
import * as StockLocationService from '../services/stockLocation.service';

export const getByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const stock = await StockLocationService.getStockByProduct(req.params.productId);
    res.json({ success: true, data: stock });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getByWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const stock = await StockLocationService.getStockByWarehouse(req.params.warehouseId);
    res.json({ success: true, data: stock });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const transfer = async (req: Request, res: Response): Promise<void> => {
  try {
    await StockLocationService.transferStock(req.body);
    res.json({ success: true, message: 'Stock transferred.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};