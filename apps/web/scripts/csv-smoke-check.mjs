import assert from 'node:assert/strict';
import { transactionsToCsv } from '../src/utils/csv.js';

const csv = transactionsToCsv([
  { date: '2026-11-14T12:00:00.000Z', title: 'Cafe, "Central"', type: 'EXPENSE', amountPaise: 12345, category: { name: 'Food' } },
]);

assert.ok(csv.startsWith('\uFEFF"Date","Title","Type","Category","Amount (INR)","Amount (paise)"'));
assert.ok(csv.includes('"2026-11-14","Cafe, ""Central""","EXPENSE","Food","123.45","12345"'));
console.log('CSV export passed header, UTF-8 BOM, quoted delimiter/quotes, INR, and exact paise checks.');
