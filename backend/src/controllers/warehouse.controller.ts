import { Request, Response } from 'express';
import * as WarehouseService from '../services/warehouse.service';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouses = await WarehouseService.getAllWarehouses();
    res.json({ success: true, data: warehouses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await WarehouseService.getWarehouseById(req.params.id);
    if (!warehouse) {
      res.status(404).json({ success: false, error: 'Warehouse not found.' });
      return;
    }
    res.json({ success: true, data: warehouse });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await WarehouseService.createWarehouse(req.body);
    res.status(201).json({ success: true, data: warehouse, message: 'Warehouse created.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await WarehouseService.updateWarehouse(req.params.id, req.body);
    res.json({ success: true, data: warehouse, message: 'Warehouse updated.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await WarehouseService.deleteWarehouse(req.params.id);
    res.json({ success: true, message: 'Warehouse deleted.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};