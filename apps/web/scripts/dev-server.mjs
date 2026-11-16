import { preview } from 'vite';

const server = await preview({
  configFile: false,
  preview: { host: '0.0.0.0', port: 5173, strictPort: true },
});

server.printUrls();
