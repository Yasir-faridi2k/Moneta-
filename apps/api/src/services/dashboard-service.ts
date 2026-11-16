import { prisma } from '../lib/prisma.js';

function monthRange(year: number, month: number) {
  return { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) };
}

export async function getDashboardSummary(year: number, month: number) {
  const currentMonth = monthRange(year, month);
  const sixMonthStart = new Date(Date.UTC(year, month - 6, 1));

  const [allTime, monthly, budgetTotal, recentTransactions, monthlyExpenses, trendTransactions] = await Promise.all([
    prisma.transaction.groupBy({ by: ['type'], _sum: { amountPaise: true } }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { date: currentMonth },
      _sum: { amountPaise: true },
    }),
    prisma.budget.aggregate({
      where: { year, month },
      _sum: { amountPaise: true },
    }),
    prisma.transaction.findMany({
      take: 5,
      include: { category: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.transaction.findMany({
      where: { type: 'EXPENSE', date: currentMonth },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { date: { gte: sixMonthStart, lt: new Date(Date.UTC(year, month, 1)) } },
      select: { amountPaise: true, type: true, date: true },
    }),
  ]);

  const sumFor = (rows: typeof allTime, type: string) =>
    rows.find((row) => row.type === type)?._sum.amountPaise ?? 0;
  const incomePaise = sumFor(monthly, 'INCOME');
  const expensesPaise = sumFor(monthly, 'EXPENSE');
  const totalIncomePaise = sumFor(allTime, 'INCOME');
  const totalExpensesPaise = sumFor(allTime, 'EXPENSE');
  const expenseByCategory = new Map<string, { categoryId: string; name: string; color: string; amountPaise: number }>();
  for (const transaction of monthlyExpenses) {
    const current = expenseByCategory.get(transaction.categoryId) ?? {
      categoryId: transaction.categoryId,
      name: transaction.category.name,
      color: transaction.category.color,
      amountPaise: 0,
    };
    current.amountPaise += transaction.amountPaise;
    expenseByCategory.set(transaction.categoryId, current);
  }

  const monthlyTotals = new Map<string, { month: string; incomePaise: number; expensesPaise: number }>();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    monthlyTotals.set(key, { month: key, incomePaise: 0, expensesPaise: 0 });
  }
  for (const transaction of trendTransactions) {
    const key = `${transaction.date.getUTCFullYear()}-${String(transaction.date.getUTCMonth() + 1).padStart(2, '0')}`;
    const total = monthlyTotals.get(key);
    if (total) {
      if (transaction.type === 'INCOME') total.incomePaise += transaction.amountPaise;
      if (transaction.type === 'EXPENSE') total.expensesPaise += transaction.amountPaise;
    }
  }

  const budgetPaise = budgetTotal._sum.amountPaise ?? 0;
  return {
    period: { year, month },
    balancePaise: totalIncomePaise - totalExpensesPaise,
    totalIncomePaise: incomePaise,
    totalExpensesPaise: expensesPaise,
    budgetPaise,
    remainingBudgetPaise: budgetPaise - expensesPaise,
    recentTransactions,
    expenseByCategory: [...expenseByCategory.values()].sort((a, b) => b.amountPaise - a.amountPaise),
    monthlyTotals: [...monthlyTotals.values()],
  };
}
