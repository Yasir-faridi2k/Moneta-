import { Router } from 'express';
import { z } from 'zod';
import * as budgets from '../services/budget-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const idSchema = z.string().min(1);
const budgetInput = z.object({
  amountPaise: z.number().int().positive().max(2_000_000_000),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2200),
  categoryId: z.string().min(1),
});
const budgetPatch = budgetInput.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.',
});
const budgetFilters = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2200).optional(),
  categoryId: z.string().min(1).optional(),
});

router.get('/', asyncHandler(async (request, response) => {
  response.json(await budgets.listBudgets(budgetFilters.parse(request.query)));
}));

router.get('/:id', asyncHandler(async (request, response) => {
  response.json(await budgets.getBudget(idSchema.parse(request.params.id)));
}));

router.post('/', asyncHandler(async (request, response) => {
  response.status(201).json(await budgets.createBudget(budgetInput.parse(request.body)));
}));

router.patch('/:id', asyncHandler(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  response.json(await budgets.updateBudget(id, budgetPatch.parse(request.body)));
}));

router.delete('/:id', asyncHandler(async (request, response) => {
  await budgets.deleteBudget(idSchema.parse(request.params.id));
  response.status(204).end();
}));

export default router;
