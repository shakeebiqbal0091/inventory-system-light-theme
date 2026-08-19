// src/jobs/lowStockAlert.job.ts
import cron from 'node-cron';
import { runLowStockDigest } from '../services/alert.service';

export const startLowStockAlertJob = () => {
  // Runs every day at 8:00 AM server time
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily low-stock digest...');
    try {
      await runLowStockDigest();
    } catch (error) {
      console.error('Low-stock digest job failed:', error);
    }
  });
};