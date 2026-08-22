// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import saleRoutes from './routes/sale.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { startLowStockAlertJob } from './jobs/lowStockAlert.job';
import supplierRoutes from './routes/supplier.routes'; 
import customerRoutes from './routes/customer.routes';
import settingsRoutes from './routes/settings.routes';
import purchaseOrderRoutes from './routes/purchaseOrder.routes';
import salesOrderRoutes from './routes/salesOrder.routes';   // ← add with other imports
import warehouseRoutes from './routes/warehouse.routes';
import stockLocationRoutes from './routes/stockLocation.routes';
import reportRoutes from './routes/report.routes';
import aiSummaryRoutes from './routes/aiSummary.routes';
import { startWeeklySummaryJob } from './jobs/weeklySummary.job';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());   // ← added: sets security headers (X-Frame-Options, CSP baseline, etc.)

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ──────────────────────────────────────────────────────────── ← added block
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                     // 10 attempts per IP per window
  message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,                    // generous general ceiling — catches scraping/abuse, not real usage
  message: { success: false, error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);   // ← tightest limit on login/register
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/sales', apiLimiter, saleRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/suppliers', apiLimiter, supplierRoutes);
app.use('/api/customers', apiLimiter, customerRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/purchase-orders', apiLimiter, purchaseOrderRoutes);
app.use('/api/sales-orders', apiLimiter, salesOrderRoutes);   // ← add with other app.use lines
app.use('/api/warehouses', apiLimiter, warehouseRoutes);
app.use('/api/stock-locations', apiLimiter, stockLocationRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);
app.use('/api/ai-summary', apiLimiter, aiSummaryRoutes);


// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Inventory API is running 🚀', timestamp: new Date() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
  startLowStockAlertJob();   // ← moved here: after env vars loaded and server is actually up
  startWeeklySummaryJob();
});

export default app;
