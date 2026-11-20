import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const DEFAULT_BACKEND_URL = 'http://localhost:3000';

/**
 * El frontend llama a la API con el prefijo /api, que el proxy quita antes de reenviar al backend.
 * Así las rutas del SPA (/customers/:id) no chocan con las de la API y no hace falta CORS.
 * BACKEND_URL (en el entorno o en frontend/.env) permite apuntar a otro puerto si se cambia el del backend.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxy = {
    '/api': {
      target: env.BACKEND_URL || DEFAULT_BACKEND_URL,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  };

  return {
    plugins: [react()],
    server: { port: 5173, proxy: apiProxy },
    preview: { port: 4173, proxy: apiProxy },
    test: {
      // Solo tests unitarios: los de punta a punta (e2e/) tienen su propia configuración.
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      css: false,
    },
  };
});
