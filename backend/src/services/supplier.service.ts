import { prisma } from '../prisma';
import { CreateSupplierInput, UpdateSupplierInput } from '../types';

export const getAllSuppliers = async () => {
  return prisma.supplier.findMany({ orderBy: { companyName: 'asc' } });
};

export const getSupplierById = async (id: string) => {
  return prisma.supplier.findUnique({
    where: { id },
    include: { products: { select: { id: true, name: true, quantity: true } } },
  });
};

export const createSupplier = async (input: CreateSupplierInput) => {
  return prisma.supplier.create({ data: input });
};

export const updateSupplier = async (id: string, input: UpdateSupplierInput) => {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw new Error('Supplier not found.');
  return prisma.supplier.update({ where: { id }, data: input });
};

export const deleteSupplier = async (id: string) => {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw new Error('Supplier not found.');
  await prisma.supplier.delete({ where: { id } });
};