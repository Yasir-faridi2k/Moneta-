import { Router } from 'express';
import { z } from 'zod';
import * as transactions from '../services/transaction-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const idSchema = z.string().min(1);
const transactionInput = z.object({
  title: z.string().trim().min(1).max(120),
  amountPaise: z.number().int().positive().max(2_000_000_000),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.coerce.date(),
  categoryId: z.string().min(1),
});
const transactionPatch = transactionInput.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.',
});
const transactionFilters = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId: z.string().min(1).optional(),
  q: z.string().trim().max(120).optional(),
});

router.get('/', asyncHandler(async (request, response) => {
  const filters = transactionFilters.parse(request.query);
  response.json(await transactions.listTransactions(filters));
}));

router.get('/:id', asyncHandler(async (request, response) => {
  response.json(await transactions.getTransaction(idSchema.parse(request.params.id)));
}));

router.post('/', asyncHandler(async (request, response) => {
  const input = transactionInput.parse(request.body);
  response.status(201).json(await transactions.createTransaction(input));
}));

router.patch('/:id', asyncHandler(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const input = transactionPatch.parse(request.body);
  response.json(await transactions.updateTransaction(id, input));
}));

router.delete('/:id', asyncHandler(async (request, response) => {
  await transactions.deleteTransaction(idSchema.parse(request.params.id));
  response.status(204).end();
}));

export default router;
