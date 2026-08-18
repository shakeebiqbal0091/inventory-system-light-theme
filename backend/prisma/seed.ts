// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@inventory.com', password: adminPassword, role: Role.ADMIN },
  });

  const staffPassword = await bcrypt.hash('staff123', 12);
  await prisma.user.upsert({
    where: { email: 'staff@inventory.com' },
    update: {},
    create: { name: 'Staff User', email: 'staff@inventory.com', password: staffPassword, role: Role.STAFF },
  });

  const products = [
    { id: 'prod_001', name: 'Wireless Mouse',      category: 'Electronics', costPrice: 12.00,  price: 25.99,  quantity: 150, lowStockThreshold: 20, supplier: 'TechSupply Co.' },
    { id: 'prod_002', name: 'USB-C Hub',           category: 'Electronics', costPrice: 20.00,  price: 45.99,  quantity: 8,   lowStockThreshold: 10, supplier: 'TechSupply Co.' },
    { id: 'prod_003', name: 'Office Chair',        category: 'Furniture',   costPrice: 150.00, price: 299.99, quantity: 25,  lowStockThreshold: 5,  supplier: 'FurniPro Ltd.' },
    { id: 'prod_004', name: 'Notebook A4',         category: 'Stationery',  costPrice: 1.50,   price: 4.99,   quantity: 5,   lowStockThreshold: 50, supplier: 'Paper World' },
    { id: 'prod_005', name: 'Mechanical Keyboard', category: 'Electronics', costPrice: 40.00,  price: 89.99,  quantity: 42,  lowStockThreshold: 15, supplier: 'TechSupply Co.' },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  const salesData = [
    { productId: 'prod_001', quantity: 5  },
    { productId: 'prod_001', quantity: 10 },
    { productId: 'prod_002', quantity: 2  },
    { productId: 'prod_003', quantity: 1  },
    { productId: 'prod_005', quantity: 3  },
    { productId: 'prod_001', quantity: 7  },
    { productId: 'prod_005', quantity: 2  },
  ];

  for (const s of salesData) {
    const product = productMap[s.productId];
    const totalPrice = product.price     * s.quantity;
    const totalCost  = product.costPrice * s.quantity;
    await prisma.sale.create({
      data: { productId: s.productId, quantity: s.quantity, totalPrice, totalCost, profit: totalPrice - totalCost },
    });
  }

  console.log('✅ Done. Admin: admin@inventory.com / admin123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
