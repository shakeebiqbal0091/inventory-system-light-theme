import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { generateWeeklySummary } from '../services/aiSummary.service';
import { sendWeeklySummaryEmail } from '../services/email.service';

export const preview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, data } = await generateWeeklySummary();
    res.json({ success: true, data: { text, stats: data } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendNow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = await generateWeeklySummary();
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
    await sendWeeklySummaryEmail(admins.map(a => a.email), text);
    res.json({ success: true, message: 'Weekly summary sent.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};