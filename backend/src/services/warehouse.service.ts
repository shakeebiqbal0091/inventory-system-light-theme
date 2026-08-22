import { prisma } from '../prisma';
import { CreateWarehouseInput, UpdateWarehouseInput } from '../types';

export const getAllWarehouses = async () => {
  return prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
};

export const getWarehouseById = async (id: string) => {
  return prisma.warehouse.findUnique({
    where: { id },
    include: { stockLocations: { include: { product: { select: { id: true, name: true } } } } },
  });
};

export const createWarehouse = async (input: CreateWarehouseInput) => {
  return prisma.warehouse.create({ data: input });
};

export const updateWarehouse = async (id: string, input: UpdateWarehouseInput) => {
  const existing = await prisma.warehouse.findUnique({ where: { id } });
  if (!existing) throw new Error('Warehouse not found.');
  return prisma.warehouse.update({ where: { id }, data: input });
};

export const deleteWarehouse = async (id: string) => {
  const existing = await prisma.warehouse.findUnique({ where: { id } });
  if (!existing) throw new Error('Warehouse not found.');
  await prisma.warehouse.delete({ where: { id } });
};