import { Router } from 'express';
import { z } from 'zod';
import { getDashboardSummary } from '../services/dashboard-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const currentDate = new Date();
const summaryQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2200).default(currentDate.getUTCFullYear()),
  month: z.coerce.number().int().min(1).max(12).default(currentDate.getUTCMonth() + 1),
});

router.get('/summary', asyncHandler(async (request, response) => {
  const { year, month } = summaryQuery.parse(request.query);
  response.json(await getDashboardSummary(year, month));
}));

export default router;
