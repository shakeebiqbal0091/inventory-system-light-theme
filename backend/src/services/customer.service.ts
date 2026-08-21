import { prisma } from '../prisma';
import { CreateCustomerInput, UpdateCustomerInput } from '../types';

export const getAllCustomers = async () => {
  return prisma.customer.findMany({ orderBy: { name: 'asc' } });
};

export const getCustomerById = async (id: string) => {
  return prisma.customer.findUnique({ where: { id } });
};

export const createCustomer = async (input: CreateCustomerInput) => {
  return prisma.customer.create({ data: input });
};

export const updateCustomer = async (id: string, input: UpdateCustomerInput) => {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new Error('Customer not found.');
  return prisma.customer.update({ where: { id }, data: input });
};

export const deleteCustomer = async (id: string) => {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new Error('Customer not found.');
  await prisma.customer.delete({ where: { id } });
};