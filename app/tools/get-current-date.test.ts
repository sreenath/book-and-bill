import { describe, it, expect } from 'vitest';
import { getCurrentDate } from './get-current-date.js';

describe('getCurrentDate tool', () => {
  it('should return current date components', async () => {
    const result = await getCurrentDate.runAsync({
      args: {},
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('success');
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    expect(result.dayOfWeek).toMatch(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/);
  });
});
