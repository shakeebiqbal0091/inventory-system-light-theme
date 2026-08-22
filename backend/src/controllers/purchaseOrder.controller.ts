import { Request, Response } from 'express';
import * as PurchaseOrderService from '../services/purchaseOrder.service';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await PurchaseOrderService.getAllPurchaseOrders();
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await PurchaseOrderService.getPurchaseOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Purchase order not found.' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await PurchaseOrderService.createPurchaseOrder(req.body);
    res.status(201).json({ success: true, data: order, message: 'Purchase order created.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await PurchaseOrderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: order, message: 'Status updated.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const receive = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await PurchaseOrderService.receiveStock(req.params.id, req.body, req.user?.userId);
    res.json({ success: true, data: order, message: 'Stock received.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};