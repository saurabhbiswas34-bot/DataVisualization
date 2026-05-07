import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react() as any],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'src/__tests__/integration/**',
      '**/node_modules/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test-utils/**',
        'src/__mocks__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/__tests__/**',
        // App.tsx is routing config (lazy imports); covered indirectly by page tests
        'src/App.tsx',
        // types/index.ts is pure TypeScript type declarations (no runtime code)
        'src/types/index.ts',
      ],
      thresholds: {
        lines: 92,
        functions: 85,
        branches: 80,
        statements: 92,
      },
    },
  },
});
