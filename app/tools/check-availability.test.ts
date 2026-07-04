import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkAvailability } from './check-availability.js';
import { setTestConfig } from '../config/business-config.js';
import { business1Config } from '../config/business_1.js';
import { business2Config } from '../config/business_2.js';

describe('checkAvailability tool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    setTestConfig(business1Config);
  });

  it('should check slot availability', async () => {
    const result = await checkAvailability.runAsync({
      args: { date: '2026-07-01', serviceId: 'haircut', stylistId: 'alice' },
      toolContext: {} as any,
    }) as any;
    expect(result.status).toBe('success');
    expect(result.availableSlots).toBeDefined();
  });

  it('should return error if date is outside the booking window', async () => {
    const result = await checkAvailability.runAsync({
      args: { date: '2026-09-01', serviceId: 'haircut', stylistId: 'alice' },
      toolContext: {} as any,
    }) as any;
    
    expect(result.status).toBe('error');
    expect(result.message).toContain('outside the allowed booking window');
  });

  it('should return error if date is a non-operating day and offer next operating day', async () => {
    setTestConfig(business2Config);

    const result = await checkAvailability.runAsync({
      args: { date: '2026-07-04', serviceId: 'massage', stylistId: 'david' },
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('error');
    expect(result.message).toContain('not an operating day');
    expect(result.message).toContain('2026-07-06');
    expect(result.nextOperatingDay).toBe('2026-07-06');
  });
});
