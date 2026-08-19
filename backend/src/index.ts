// // src/index.ts
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';

// import authRoutes from './routes/auth.routes';
// import productRoutes from './routes/product.routes';
// import saleRoutes from './routes/sale.routes';
// import dashboardRoutes from './routes/dashboard.routes';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT ?? 5000;

// // ─── Middleware ───────────────────────────────────────────────────────────────

// app.use(cors({
//   origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
//   credentials: true,
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ─── Routes ───────────────────────────────────────────────────────────────────

// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/sales', saleRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';                    // ← added
import rateLimit from 'express-rate-limit';      // ← added
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import saleRoutes from './routes/sale.routes';
import dashboardRoutes from './routes/dashboard.routes';

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
});

export default app;
