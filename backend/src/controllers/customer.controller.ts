import { Request, Response } from 'express';
import * as CustomerService from '../services/customer.service';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const customers = await CustomerService.getAllCustomers();
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerService.getCustomerById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found.' });
      return;
    }
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerService.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer, message: 'Customer created.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerService.updateCustomer(req.params.id, req.body);
    res.json({ success: true, data: customer, message: 'Customer updated.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await CustomerService.deleteCustomer(req.params.id);
    res.json({ success: true, message: 'Customer deleted.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};