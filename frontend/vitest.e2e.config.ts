import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Pruebas de punta a punta (e2e/): separadas de los tests unitarios porque necesitan el backend compilado. */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['e2e/**/*.e2e.test.tsx'],
    css: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
