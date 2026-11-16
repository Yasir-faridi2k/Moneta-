const baseUrl = process.env.API_URL ?? 'http://localhost:3001/api';
const year = new Date().getUTCFullYear();
const month = new Date().getUTCMonth() + 1;
let categoryId;
let transactionId;
let budgetId;

async function request(path, { method = 'GET', body, expected = 200 } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status !== expected) {
    const detail = await response.text();
    throw new Error(`${method} ${path}: expected ${expected}, received ${response.status}: ${detail}`);
  }
  if (response.status === 204) return undefined;
  return response.json();
}

try {
  const category = await request('/categories', {
    method: 'POST',
    expected: 201,
    body: { name: `API verification ${Date.now()}`, color: '#123456' },
  });
  categoryId = category.id;
  const categoryDetails = await request(`/categories/${categoryId}`);
  if (categoryDetails.name !== category.name) throw new Error('Category read did not match the created category.');
  await request(`/categories/${categoryId}`, { method: 'PATCH', body: { name: `${category.name} updated` } });
  await request(`/categories?unused=ok`);

  const transaction = await request('/transactions', {
    method: 'POST',
    expected: 201,
    body: {
      title: 'API verification expense',
      amountPaise: 125,
      type: 'EXPENSE',
      date: new Date().toISOString(),
      categoryId,
    },
  });
  transactionId = transaction.id;
  await request(`/transactions/${transactionId}`);
  const filtered = await request('/transactions?type=EXPENSE&q=verification');
  if (!filtered.some((item) => item.id === transactionId)) throw new Error('Transaction filter did not return the created record.');
  await request(`/transactions/${transactionId}`, { method: 'PATCH', body: { amountPaise: 200 } });
  const invalid = await request('/transactions', {
    method: 'POST', expected: 400,
    body: { title: '', amountPaise: 0, type: 'EXPENSE', date: 'bad-date', categoryId },
  });
  if (!invalid.error) throw new Error('Invalid transaction response did not include an error.');

  const budget = await request('/budgets', {
    method: 'POST', expected: 201,
    body: { amountPaise: 150, month, year, categoryId },
  });
  budgetId = budget.id;
  if (budget.spentPaise !== 200 || budget.warning !== 'exceeded') throw new Error('Budget progress or warning was incorrect.');
  await request(`/budgets/${budgetId}`);
  await request(`/budgets/${budgetId}`, { method: 'PATCH', body: { amountPaise: 300 } });
  const budgetList = await request(`/budgets?year=${year}&month=${month}`);
  if (!budgetList.some((item) => item.id === budgetId)) throw new Error('Budget filters did not return the created budget.');

  const summary = await request(`/dashboard/summary?year=${year}&month=${month}`);
  if (summary.period.year !== year || !summary.recentTransactions || !summary.monthlyTotals) {
    throw new Error('Dashboard summary is missing database-backed fields.');
  }
  const categoryExpense = summary.expenseByCategory.find((item) => item.categoryId === categoryId);
  if (!categoryExpense || categoryExpense.amountPaise !== 200) throw new Error('Dashboard category totals did not reflect the transaction update.');

  await request(`/budgets/${budgetId}`, { method: 'DELETE', expected: 204 });
  budgetId = undefined;
  await request(`/transactions/${transactionId}`, { method: 'DELETE', expected: 204 });
  transactionId = undefined;
  await request(`/categories/${categoryId}`, { method: 'DELETE', expected: 204 });
  categoryId = undefined;
  console.log('API workflow passed: categories, transaction CRUD/filter/validation, budget CRUD/progress, dashboard summary, and cleanup.');
} finally {
  if (budgetId) await request(`/budgets/${budgetId}`, { method: 'DELETE', expected: 204 }).catch(() => {});
  if (transactionId) await request(`/transactions/${transactionId}`, { method: 'DELETE', expected: 204 }).catch(() => {});
  if (categoryId) await request(`/categories/${categoryId}`, { method: 'DELETE', expected: 204 }).catch(() => {});
}
