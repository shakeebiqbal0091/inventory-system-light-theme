# Inventory Pro — End-to-End Test Plan

Run this in order — later steps depend on data created by earlier ones. Use two browser sessions (or one normal + one incognito) to test Admin and Staff roles side by side.

---

## 0. Setup (do this first)

- [ ] `backend/.env` has real values for: `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `ANTHROPIC_API_KEY`
- [ ] `cd backend && npm run db:generate && npm run db:migrate`
- [ ] `npm run db:seed` (or manually create one ADMIN and one STAFF user)
- [ ] Backend running (`npm run dev`), frontend running (`npm run dev`)
- [ ] `npx tsc --noEmit` clean in both `backend/` and `frontend/`

---

## 1. Auth & Roles
- [ ] Register a new user → confirm it's created as STAFF (not admin), even if you try to pass `role` in the request body
- [ ] Login as Admin, login as Staff (separate sessions)
- [ ] Staff cannot see Add/Edit/Delete buttons on Products, Suppliers, Warehouses, Purchase Orders
- [ ] Staff CAN record sales, ship orders, process returns (per your permissions table)
- [ ] Rate limiting: try 11+ failed logins in a row → should get blocked temporarily

## 2. Contact Management
- [ ] Create a Supplier (with `leadTimeDays` and `paymentTerms` filled in — needed for later steps)
- [ ] Create a Customer
- [ ] Edit and delete a contact as Admin; confirm Staff can't

## 3. Products
- [ ] Create a product with `costPrice`, `price`, `quantity`, `lowStockThreshold`, and assign the Supplier from step 2
- [ ] Confirm `costPrice` actually saves (this was a real bug earlier — verify it round-trips)
- [ ] Edit a product's quantity manually → check it triggers a `MANUAL_ADJUSTMENT` stock movement (Reports tab, step 9)

## 4. Warehouses & Stock Locations
- [ ] Create two warehouses
- [ ] View Stock by Location for your product (should show "unallocated" since nothing's been received into a location yet)
- [ ] Skip transfer for now — no stock allocated to any warehouse yet (do this after step 5)

## 5. Procurement (Purchase Orders)
- [ ] Create a PO for your product/supplier, quantity ~50
- [ ] Mark it Sent
- [ ] Receive partial stock (e.g. 30 of 50) — with a warehouse selected — confirm:
  - [ ] Status becomes `PARTIALLY_RECEIVED`
  - [ ] Product's total `quantity` increased by 30
  - [ ] Stock Location page now shows 30 allocated to that warehouse
- [ ] Receive the remaining 20 → status becomes `COMPLETED`
- [ ] Try receiving again → should be blocked ("cannot receive on a completed order")

## 6. Multi-Warehouse Transfer
- [ ] Transfer 10 units from warehouse A to warehouse B
- [ ] Confirm total product quantity is unchanged, only the location split moved
- [ ] Try transferring more than available at source → should fail cleanly

## 7. Sales (both paths)
- [ ] Record a simple single-item sale via `/sales`
- [ ] Create a multi-item Sales Order via `/sales-orders` (2+ products, one order)
- [ ] Confirm stock decremented correctly for every item in the order
- [ ] Try to oversell (quantity > stock) → should be rejected, stock unchanged
- [ ] Mark order Packing → Ship it (add carrier/tracking) → status becomes `SHIPPED`
- [ ] Process a Return on that order — try both `RESTOCK` (confirm stock goes back up) and `WRITE_OFF` (confirm stock does NOT change) on two different items/orders

## 8. Low Stock Alerts
- [ ] Sell/adjust a product down to at or below its `lowStockThreshold`
- [ ] Confirm an email arrives
- [ ] Sell more of the same already-low product → confirm you do **NOT** get a duplicate email
- [ ] Restock it above threshold, then drop it low again → confirm a **new** email fires

## 9. Reports & Analytics
- [ ] Stock Movements tab shows entries for: the sale, the PO receipt, both transfer legs, the return, and the manual adjustment from step 3 — each with the correct `userId` (not blank)
- [ ] Sales & Turnover tab shows your sale(s) in Best Sellers
- [ ] Valuation tab shows your product tagged "Full History" (since it has PO receipt data) — create one product with NO purchase order history and confirm it's tagged "Approximated"
- [ ] Reorder Suggestions tab shows your product with a sensible days-until-stockout and urgency badge

## 10. Settings
- [ ] Update profile name/email
- [ ] Update business info
- [ ] Toggle notification preferences
- [ ] Change password → log out → log back in with the new password

## 11. AI Features
- [ ] `/assistant` — ask "What products are low on stock?" and "Which supplier is fastest?" — confirm real data comes back, not hallucinated numbers
- [ ] Try asking the assistant to delete or change something → confirm it refuses (read-only guarantee)
- [ ] Manually trigger the weekly AI summary (`POST /api/ai-summary/send` as Admin) → confirm the email arrives and the numbers in it match what you just tested

## 12. Cross-Cutting
- [ ] Full page reload on every route — no console errors
- [ ] Log out / log back in — session persists correctly, protected routes redirect to login when logged out
- [ ] Sidebar nav — click every single link, confirm nothing 404s
- [ ] Mobile/narrow browser width — sidebar and header don't break

---

## If something fails
Note: which step, what you expected vs. what happened, and any error message/console output. Bring that back here and I'll trace it to the exact file.
