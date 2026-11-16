import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { requireCategory } from './category-service.js';

type BudgetInput = { amountPaise: number; month: number; year: number; categoryId: string };

function monthRange(year: number, month: number) {
  return { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) };
}

async function addProgress(budget: {
  id: string;
  amountPaise: number;
  month: number;
  year: number;
  categoryId: string;
  category: { id: string; name: string; color: string };
  createdAt: Date;
  updatedAt: Date;
}) {
  const spent = await prisma.transaction.aggregate({
    where: {
      categoryId: budget.categoryId,
      type: 'EXPENSE',
      date: monthRange(budget.year, budget.month),
    },
    _sum: { amountPaise: true },
  });
  const spentPaise = spent._sum.amountPaise ?? 0;
  const percentUsed = budget.amountPaise === 0 ? 0 : Math.round((spentPaise / budget.amountPaise) * 100);
  return {
    ...budget,
    spentPaise,
    remainingPaise: budget.amountPaise - spentPaise,
    percentUsed,
    warning: percentUsed >= 100 ? 'exceeded' : percentUsed >= 80 ? 'near-limit' : null,
  };
}

export async function listBudgets(filters: { year?: number; month?: number; categoryId?: string }) {
  const budgets = await prisma.budget.findMany({
    where: {
      ...(filters.year ? { year: filters.year } : {}),
      ...(filters.month ? { month: filters.month } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    },
    include: { category: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { category: { name: 'asc' } }],
  });
  return Promise.all(budgets.map(addProgress));
}

export async function getBudget(id: string) {
  const budget = await prisma.budget.findUnique({ where: { id }, include: { category: true } });
  if (!budget) throw new HttpError(404, 'Budget not found.');
  return addProgress(budget);
}

export async function createBudget(input: BudgetInput) {
  await requireCategory(input.categoryId);
  const budget = await prisma.budget.create({ data: input, include: { category: true } });
  return addProgress(budget);
}

export async function updateBudget(id: string, input: Partial<BudgetInput>) {
  await getBudget(id);
  if (input.categoryId) await requireCategory(input.categoryId);
  const budget = await prisma.budget.update({ where: { id }, data: input, include: { category: true } });
  return addProgress(budget);
}

export async function deleteBudget(id: string) {
  await getBudget(id);
  await prisma.budget.delete({ where: { id } });
}
