import { Request, Response } from 'express';
import { chatWithAssistant } from '../services/aiAssistant.service';

export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, error: 'messages array is required.' });
      return;
    }
    const reply = await chatWithAssistant(messages);
    res.json({ success: true, data: { reply } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};