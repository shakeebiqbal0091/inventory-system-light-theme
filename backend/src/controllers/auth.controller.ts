// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';

// POST /auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;   // ← removed `role`

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      return;
    }

    const result = await AuthService.registerUser({ name, email, password }); // ← no role passed

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const result = await AuthService.loginUser({ email, password });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful.',
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
};

// GET /auth/me  (protected)
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await AuthService.getUserProfile(req.user!.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};
