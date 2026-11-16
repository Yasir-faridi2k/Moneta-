import assert from 'node:assert/strict';
import React from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
});

try {
  await Promise.all([
    vite.ssrLoadModule('/src/pages/DashboardPage.tsx'),
    vite.ssrLoadModule('/src/pages/TransactionsPage.tsx'),
    vite.ssrLoadModule('/src/pages/BudgetsPage.tsx'),
    vite.ssrLoadModule('/src/pages/CategoriesPage.tsx'),
    vite.ssrLoadModule('/src/pages/ReportsPage.tsx'),
  ]);
  const { AppRoutes } = await vite.ssrLoadModule('/src/App.tsx');
  const markup = await new Promise((resolve, reject) => {
    const stream = renderToPipeableStream(
      React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(AppRoutes)),
      {
        onAllReady() {
          const output = new PassThrough();
          const chunks = [];
          output.on('data', (chunk) => chunks.push(chunk));
          output.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });

  assert.match(markup, /Overview/);
  assert.match(markup, /Gathering your finances/);
  assert.match(markup, /Transactions/);
  assert.match(markup, /<svg/);
  console.log('React app route render passed: navigation, dashboard heading/loading state, and Lucide SVG rendered.');
} finally {
  await vite.close();
}
