import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import budgetRouter from './routes/budgets.js';
import categoryRouter from './routes/categories.js';
import dashboardRouter from './routes/dashboard.js';
import transactionRouter from './routes/transactions.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', name: 'MONETA API' });
});

app.use('/api/transactions', transactionRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/dashboard', dashboardRouter);

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found.' });
});

app.use(errorHandler);
