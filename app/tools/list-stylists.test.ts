import { describe, it, expect } from 'vitest';
import { listStylists } from './list-stylists.js';

describe('listStylists tool', () => {
  it('should return all stylists', async () => {
    const result = await listStylists.runAsync({
      args: {},
      toolContext: {} as any,
    }) as any;
    expect(result.status).toBe('success');
    expect(result.stylists.length).toBeGreaterThan(0);
  });
});
