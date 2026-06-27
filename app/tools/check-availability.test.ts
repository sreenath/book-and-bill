import { describe, it, expect } from 'vitest';
import { checkAvailability } from './check-availability.js';

describe('checkAvailability tool', () => {
  it('should check slot availability', async () => {
    const result = await checkAvailability.runAsync({
      args: { date: '2026-07-01', serviceId: 'haircut', stylistId: 'alice' },
      toolContext: {} as any,
    }) as any;
    expect(result.status).toBe('success');
    expect(result.availableSlots).toBeDefined();
  });
});
