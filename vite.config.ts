import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-orders-api',
      configureServer(server) {
        Object.assign(process.env, loadEnv('development', process.cwd(), ''));
        server.middlewares.use('/api/orders', async (req, res) => {
          try {
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of req) {
              size += chunk.length;
              if (size > 16384) {
                res.writeHead(413);
                res.end();
                return;
              }
              chunks.push(Buffer.from(chunk));
            }
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers))
              if (typeof value === 'string') headers.set(key, value);
            const module = await server.ssrLoadModule(
              '/server/orders-handler.ts',
            );
            const response: Response = await module.handleOrders(
              new Request('http://127.0.0.1:3000/api/orders', {
                method: req.method,
                headers,
                ...(req.method !== 'GET' && req.method !== 'HEAD'
                  ? { body: Buffer.concat(chunks) }
                  : {}),
              }),
            );
            res.writeHead(
              response.status,
              Object.fromEntries(response.headers),
            );
            res.end(await response.text());
          } catch {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                code: 'UNAVAILABLE',
                message: 'Онлайн-замовлення тимчасово недоступні.',
              }),
            );
          }
        });
      },
    },
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  server: { host: '127.0.0.1', port: 3000, strictPort: true },
  preview: { host: '127.0.0.1', port: 3000, strictPort: true },
});
