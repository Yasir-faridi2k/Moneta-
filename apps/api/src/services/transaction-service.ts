import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { requireCategory } from './category-service.js';

const transactionWithCategory = { category: true } satisfies Prisma.TransactionInclude;

export type TransactionInput = {
  title: string;
  amountPaise: number;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  categoryId: string;
};

export async function listTransactions(filters: {
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  q?: string;
}) {
  return prisma.transaction.findMany({
    where: {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.q ? { title: { contains: filters.q } } : {}),
    },
    include: transactionWithCategory,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getTransaction(id: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: transactionWithCategory,
  });
  if (!transaction) throw new HttpError(404, 'Transaction not found.');
  return transaction;
}

export async function createTransaction(input: TransactionInput) {
  await requireCategory(input.categoryId);
  return prisma.transaction.create({ data: input, include: transactionWithCategory });
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>) {
  await getTransaction(id);
  if (input.categoryId) await requireCategory(input.categoryId);
  return prisma.transaction.update({ where: { id }, data: input, include: transactionWithCategory });
}

export async function deleteTransaction(id: string) {
  await getTransaction(id);
  await prisma.transaction.delete({ where: { id } });
}
