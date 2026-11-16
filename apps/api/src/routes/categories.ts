import { Router } from 'express';
import { z } from 'zod';
import * as categories from '../services/category-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const idSchema = z.string().min(1);
const categoryInput = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
const categoryPatch = categoryInput.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.',
});

router.get('/', asyncHandler(async (_request, response) => {
  response.json(await categories.listCategories());
}));

router.get('/:id', asyncHandler(async (request, response) => {
  response.json(await categories.getCategory(idSchema.parse(request.params.id)));
}));

router.post('/', asyncHandler(async (request, response) => {
  response.status(201).json(await categories.createCategory(categoryInput.parse(request.body)));
}));

router.patch('/:id', asyncHandler(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  response.json(await categories.updateCategory(id, categoryPatch.parse(request.body)));
}));

router.delete('/:id', asyncHandler(async (request, response) => {
  await categories.deleteCategory(idSchema.parse(request.params.id));
  response.status(204).end();
}));

export default router;
