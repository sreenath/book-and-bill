import { describe, it, expect } from 'vitest';
import { listServices } from './list-services.js';

describe('listServices tool', () => {
  it('should return all services', async () => {
    const result = await listServices.runAsync({
      args: {},
      toolContext: {} as any,
    }) as any;
    expect(result.status).toBe('success');
    expect(result.services.length).toBeGreaterThan(0);
  });
});
