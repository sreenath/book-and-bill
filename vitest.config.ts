import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load .env from project root before tests run
config();
process.env.BUSINESS_ID = 'business_1';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'app/**/*.test.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
