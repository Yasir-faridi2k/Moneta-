import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    response.status(400).json({ error: 'Request body must contain valid JSON.' });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({ error: 'Invalid request', details: error.flatten() });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ error: 'A record with those unique values already exists.' });
      return;
    }
    if (error.code === 'P2003') {
      response.status(409).json({ error: 'This record is still in use and cannot be deleted.' });
      return;
    }
    if (error.code === 'P2025') {
      response.status(404).json({ error: 'Record not found.' });
      return;
    }
  }

  console.error(error);
  response.status(500).json({ error: 'An unexpected server error occurred.' });
};
