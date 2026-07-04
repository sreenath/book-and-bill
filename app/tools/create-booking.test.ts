import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBooking } from './create-booking.js';
import { clearDatabase } from '../scheduler.js';
import { setTestConfig } from '../config/business-config.js';
import { business1Config } from '../config/business_1.js';
import { business2Config } from '../config/business_2.js';

describe('createBooking tool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00'));
    clearDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();
    setTestConfig(business1Config);
  });

  it('should book an appointment', async () => {
    const result = await createBooking.runAsync({
      args: {
        customerName: 'John Doe',
        customerPhone: '555-1234',
        serviceId: 'haircut',
        stylistId: 'alice',
        date: '2026-07-01',
        time: '10:00',
      },
      toolContext: {} as any,
    }) as any;
    expect(result.status).toBe('success');
    expect(result.appointment).toBeDefined();
    expect(result.appointment.customerName).toBe('John Doe');
  });

  it('should fail booking if date is outside booking window', async () => {
    const result = await createBooking.runAsync({
      args: {
        customerName: 'John Doe',
        customerPhone: '555-1234',
        serviceId: 'haircut',
        stylistId: 'alice',
        date: '2026-09-01',
        time: '10:00',
      },
      toolContext: {} as any,
    }) as any;
    expect(result.status).toBe('error');
    expect(result.message).toContain('outside the allowed booking window');
  });

  it('should fail booking if date is non-operating day and offer next operating day', async () => {
    setTestConfig(business2Config);

    const result = await createBooking.runAsync({
      args: {
        customerName: 'Ray Customer',
        customerPhone: '555-4321',
        serviceId: 'massage',
        stylistId: 'david',
        date: '2026-07-04', // Saturday
        time: '10:00',
      },
      toolContext: {} as any,
    }) as any;
    expect(result.status).toBe('error');
    expect(result.message).toContain('not an operating day');
    expect(result.message).toContain('2026-07-06');
  });
});
