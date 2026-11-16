import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';

export async function listCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { transactions: true, budgets: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true, budgets: true } } },
  });
  if (!category) throw new HttpError(404, 'Category not found.');
  return category;
}

export async function requireCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) throw new HttpError(404, 'Category not found.');
  return category;
}

export function createCategory(input: { name: string; color?: string }) {
  return prisma.category.create({ data: input });
}

export async function updateCategory(id: string, input: { name?: string; color?: string }) {
  await getCategory(id);
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: string) {
  await getCategory(id);
  await prisma.category.delete({ where: { id } });
}
