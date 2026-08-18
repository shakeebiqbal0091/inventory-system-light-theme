# 📦 Inventory Pro — Full Stack Inventory Management System

A production-ready SaaS inventory management system with JWT authentication, role-based access control, real-time stock tracking, and analytics dashboard.

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend    | Node.js, Express.js, TypeScript     |
| Database   | PostgreSQL + Prisma ORM             |
| Auth       | JWT (JSON Web Tokens) + bcrypt      |

---

## 📁 Project Structure

```
inventory-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        ← Database models
│   │   └── seed.ts              ← Demo data seeder
│   └── src/
│       ├── controllers/         ← Request/response handlers
│       ├── services/            ← Business logic
│       ├── routes/              ← API endpoints
│       ├── middleware/          ← JWT auth + role guard
│       ├── types/               ← TypeScript interfaces
│       ├── prisma.ts            ← Prisma client singleton
│       └── index.ts             ← Express server entry
└── frontend/
    ├── app/
    │   ├── login/               ← Login page
    │   ├── dashboard/           ← Analytics dashboard
    │   ├── products/            ← Product management
    │   ├── sales/               ← Sales recording
    │   └── low-stock/           ← Low stock alerts
    ├── components/
    │   ├── layout/              ← Sidebar, AppLayout
    │   └── ui/                  ← StatCard, etc.
    └── lib/
        ├── api.ts               ← Axios client + interceptors
        └── auth-context.tsx     ← Global auth state
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud: Supabase / Neon / Railway)
- npm or yarn

---

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/inventory_db"
JWT_SECRET="your-random-secret-at-least-32-chars"
JWT_EXPIRES_IN="7d"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

---

### 3. Setup Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed demo data (products + users)
npm run db:seed
```

---

### 4. Configure Frontend Environment

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 5. Run the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → API running on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → App running on http://localhost:3000
```

---

## 🔐 Demo Credentials

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@inventory.com      | admin123  |
| Staff | staff@inventory.com      | staff123  |

### Role Permissions

| Feature           | Admin | Staff |
|-------------------|-------|-------|
| View Dashboard    | ✅    | ✅    |
| View Products     | ✅    | ✅    |
| Add/Edit Products | ✅    | ❌    |
| Delete Products   | ✅    | ❌    |
| Record Sales      | ✅    | ✅    |
| View Sales        | ✅    | ✅    |
| Low Stock Alerts  | ✅    | ✅    |

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register    → Register new user
POST   /api/auth/login       → Login, returns JWT
GET    /api/auth/me          → Get current user (protected)
```

### Products (all protected)
```
GET    /api/products          → List all products
GET    /api/products/low-stock → Low stock products
GET    /api/products/:id      → Single product + last 10 sales
POST   /api/products          → Create (ADMIN only)
PUT    /api/products/:id      → Update (ADMIN only)
DELETE /api/products/:id      → Delete (ADMIN only)
```

### Sales (all protected)
```
GET    /api/sales             → All sales with product info
POST   /api/sales             → Record sale + deduct stock (atomic)
```

### Dashboard (protected)
```
GET    /api/dashboard/stats   → KPIs, charts, recent activity
```

---

## 🚢 Deployment

### Backend → Render / Railway
1. Push code to GitHub
2. Create new Web Service on Render
3. Set root directory to `backend/`
4. Build command: `npm install && npm run build && npx prisma migrate deploy`
5. Start command: `node dist/index.js`
6. Add environment variables

### Frontend → Vercel
1. Import GitHub repo to Vercel
2. Set root directory to `frontend/`
3. Add `NEXT_PUBLIC_API_URL` pointing to your backend URL

### Database → Supabase (recommended free tier)
1. Create project at supabase.com
2. Copy the connection string (Session mode, port 5432)
3. Use as `DATABASE_URL`

---

## 🔮 Next Steps (Future Features)
- [ ] Export to Excel/PDF
- [ ] Barcode scanner integration
- [ ] Email notifications for low stock
- [ ] Purchase orders module
- [ ] Supplier management
- [ ] Multi-tenant (multiple businesses)
- [ ] Mobile app (React Native)

---

## 👨‍💻 Author

**Shakeeb Iqbal Shamsi**  
Full Stack Developer | Digital Solutions Provider

---

*Built with ❤️ for real-world business use*
