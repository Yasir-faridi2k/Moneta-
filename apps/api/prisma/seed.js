import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = {};
  for (const [name, color] of [
    ['Food', '#e7a96b'],
    ['Housing', '#7391b8'],
    ['Travel', '#72a99a'],
    ['Salary', '#6b8f71'],
  ]) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: { color },
      create: { name, color },
    });
  }

  const transactions = [
    { id: 'demo-income-nov-2026', title: 'Monthly salary', amountPaise: 8500000, type: 'INCOME', date: new Date('2026-11-01T00:00:00.000Z'), categoryId: categories.Salary.id },
    { id: 'demo-food-nov-2026-01', title: 'Weekly groceries', amountPaise: 84500, type: 'EXPENSE', date: new Date('2026-11-05T00:00:00.000Z'), categoryId: categories.Food.id },
    { id: 'demo-travel-nov-2026', title: 'Metro pass', amountPaise: 12000, type: 'EXPENSE', date: new Date('2026-11-08T00:00:00.000Z'), categoryId: categories.Travel.id },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.upsert({
      where: { id: transaction.id },
      update: transaction,
      create: transaction,
    });
  }

  await prisma.budget.upsert({
    where: {
      categoryId_year_month: { categoryId: categories.Food.id, year: 2026, month: 11 },
    },
    update: { amountPaise: 500000 },
    create: { categoryId: categories.Food.id, year: 2026, month: 11, amountPaise: 500000 },
  });

  console.log(`Seeded ${transactions.length} transactions, ${Object.keys(categories).length} categories, and 1 budget.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
