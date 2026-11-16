function escapeCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function transactionsToCsv(transactions) {
  const rows = [
    ['Date', 'Title', 'Type', 'Category', 'Amount (INR)', 'Amount (paise)'],
    ...transactions.map((item) => [
      item.date.slice(0, 10),
      item.title,
      item.type,
      item.category.name,
      (item.amountPaise / 100).toFixed(2),
      String(item.amountPaise),
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')}`;
}
