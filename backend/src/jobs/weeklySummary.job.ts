import cron from 'node-cron';
import { prisma } from '../prisma';
import { generateWeeklySummary } from '../services/aiSummary.service';
import { sendWeeklySummaryEmail } from '../services/email.service';

export const startWeeklySummaryJob = () => {
  // Every Monday at 8:00 AM server time
  cron.schedule('0 8 * * 1', async () => {
    console.log('Generating weekly AI business summary...');
    try {
      const { text } = await generateWeeklySummary();
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
      await sendWeeklySummaryEmail(admins.map(a => a.email), text);
    } catch (error) {
      console.error('Weekly summary job failed:', error);
    }
  });
};