# 🧠 CLAUDE.md

## Inventory Management Dashboard — AI Development Guide

---

## 📌 Project Overview

This project is a **full-stack Inventory Management Dashboard** designed to help businesses manage:

* Products
* Stock levels
* Sales tracking
* Low stock alerts
* Reports & analytics

The system is built as a **scalable SaaS-ready application** using modern technologies.

---

## 🎯 Project Goals

* Build a **real-world, client-ready system**
* Follow **clean architecture and best practices**
* Enable **easy feature expansion**
* Maintain **readable and maintainable code**
* Support **AI-assisted development workflows**

---

## 🛠 Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Axios
* Recharts (for analytics)

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* PostgreSQL
* Prisma ORM

### Dev Tools

* Nodemon
* ts-node
* ESLint (optional)
* Prettier (optional)

---

## 📁 Project Structure

```
inventory-system/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── prisma.ts
│   │   └── index.ts
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── styles/
│
├── prisma/
├── README.md
├── CLAUDE.md
```

---

## 🧩 Core Modules

### 1. Product Management

* Add / Edit / Delete products
* Track stock quantity
* Assign category and supplier

### 2. Sales System

* Record product sales
* Auto-calculate total price
* Deduct stock in real-time

### 3. Stock Management

* Track inventory levels
* Prevent negative stock
* Maintain accurate counts

### 4. Low Stock Alerts

* Trigger alert when:

  ```
  quantity <= lowStockThreshold
  ```
* Highlight in dashboard UI

### 5. Dashboard Analytics

* Total products
* Total sales
* Revenue
* Low stock items
* Charts & graphs

---

## 🗄 Database Models

### Product

* id
* name
* category
* price
* quantity
* lowStockThreshold
* supplier
* createdAt

### Sale

* id
* productId
* quantity
* totalPrice
* createdAt

---

## 🔌 API Design

### Product Routes

* GET /products
* POST /products
* DELETE /products/:id

### Sales Routes

* GET /sales
* POST /sales

### Dashboard

* GET /dashboard/stats

---

## ⚙️ Development Guidelines

### Code Style

* Use **TypeScript everywhere**
* Keep functions small and reusable
* Use async/await (no callbacks)
* Follow consistent naming conventions

### Folder Responsibility

* controllers → handle request/response
* services → business logic (important for scaling)
* routes → API endpoints
* prisma → database access

---

## 🤖 AI Development Rules (Important)

When working with AI tools (like Claude or ChatGPT):

### ALWAYS:

* Follow existing folder structure
* Reuse existing patterns before creating new ones
* Keep code modular and reusable
* Use TypeScript types strictly

### NEVER:

* Break existing architecture
* Mix frontend and backend logic
* Add unnecessary libraries
* Write overly complex logic

---

## 🚀 Future Enhancements

* Authentication (JWT / NextAuth)
* Role-based access (Admin / Staff)
* Barcode scanner integration
* Supplier management system
* Purchase orders module
* Export to Excel / PDF
* Notifications system
* Multi-tenant SaaS support

---

## 💰 Business Use Cases

This system can be sold to:

* Retail shops
* Warehouses
* Restaurants
* E-commerce sellers
* Small businesses

---

## 📦 Deployment Plan

### Frontend

* Vercel

### Backend

* Render / Railway

### Database

* Supabase / Neon / Railway

---

## 🧠 Vision

This project is not just a practice app — it is intended to become:

> A **production-ready SaaS product** or **client solution**

---

## 👨‍💻 Author

**Shakeeb Iqbal Shamsi**
Full Stack Developer | UI/UX Designer | Digital Solutions Provider

---

## 📌 Final Notes

* Focus on **clean UI + solid backend**
* Prioritize **real-world usability**
* Build with **scalability in mind**
* Think like a **product owner, not just a developer**

---
