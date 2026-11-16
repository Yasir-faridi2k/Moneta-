import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const verificationId = 'phase2-roundtrip-verification';

try {
  const food = await prisma.category.findUniqueOrThrow({ where: { name: 'Food' } });
  const before = await prisma.transaction.count();

  await prisma.transaction.upsert({
    where: { id: verificationId },
    update: {
      title: 'SQLite round-trip check',
      amountPaise: 12345,
      type: 'EXPENSE',
      date: new Date('2026-11-14T00:00:00.000Z'),
      categoryId: food.id,
    },
    create: {
      id: verificationId,
      title: 'SQLite round-trip check',
      amountPaise: 12345,
      type: 'EXPENSE',
      date: new Date('2026-11-14T00:00:00.000Z'),
      categoryId: food.id,
    },
  });

  const saved = await prisma.transaction.findUniqueOrThrow({
    where: { id: verificationId },
    include: { category: true },
  });
  if (saved.amountPaise !== 12345 || saved.category.name !== 'Food') {
    throw new Error('SQLite round-trip returned unexpected transaction values.');
  }
  console.log(`SQLite round trip passed: inserted and retrieved ${saved.title}; ${before} seeded transactions were present.`);
} finally {
  await prisma.transaction.deleteMany({ where: { id: verificationId } });
  await prisma.$disconnect();
}
