import { Request, Response } from 'express';
import * as SalesOrderService from '../services/salesOrder.service';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await SalesOrderService.getAllSalesOrders();
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await SalesOrderService.getSalesOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Sales order not found.' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await SalesOrderService.createSalesOrder(req.body);
    res.status(201).json({ success: true, data: order, message: 'Sales order created.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await SalesOrderService.updateOrderStatus(req.params.id, req.body.status);
    res.json({ success: true, data: order, message: 'Status updated.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const shipOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const shipment = await SalesOrderService.createShipment(req.params.id, req.body);
    res.status(201).json({ success: true, data: shipment, message: 'Shipment recorded.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const createReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const returnRecord = await SalesOrderService.createReturn(req.params.id, req.body);
    res.status(201).json({ success: true, data: returnRecord, message: 'Return recorded.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};