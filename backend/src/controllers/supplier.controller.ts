import { Request, Response } from 'express';
import * as SupplierService from '../services/supplier.service';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const suppliers = await SupplierService.getAllSuppliers();
    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplier = await SupplierService.getSupplierById(req.params.id);
    if (!supplier) {
      res.status(404).json({ success: false, error: 'Supplier not found.' });
      return;
    }
    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplier = await SupplierService.createSupplier(req.body);
    res.status(201).json({ success: true, data: supplier, message: 'Supplier created.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplier = await SupplierService.updateSupplier(req.params.id, req.body);
    res.json({ success: true, data: supplier, message: 'Supplier updated.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await SupplierService.deleteSupplier(req.params.id);
    res.json({ success: true, message: 'Supplier deleted.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};