import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rescheduleBooking } from './reschedule-booking.js';
import { createBooking } from './create-booking.js';
import { clearDatabase } from '../scheduler.js';
import { setTestConfig } from '../config/business-config.js';
import { business1Config } from '../config/business_1.js';
import { business2Config } from '../config/business_2.js';

describe('rescheduleBooking tool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00'));
    clearDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();
    setTestConfig(business1Config);
  });

  it('should reschedule a booking', async () => {
    const bookResult = await createBooking.runAsync({
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
    const appointmentId = bookResult.appointment.id;

    const rescheduleResult = await rescheduleBooking.runAsync({
      args: {
        appointmentId,
        newDate: '2026-07-01',
        newTime: '11:00',
      },
      toolContext: {} as any,
    }) as any;

    expect(rescheduleResult.status).toBe('success');
    expect(rescheduleResult.appointment.time).toBe('11:00');
  });

  it('should fail rescheduling if date is outside booking window', async () => {
    const bookResult = await createBooking.runAsync({
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
    const appointmentId = bookResult.appointment.id;

    const result = await rescheduleBooking.runAsync({
      args: {
        appointmentId,
        newDate: '2026-09-01',
        newTime: '11:00',
      },
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('error');
    expect(result.message).toContain('outside the allowed booking window');
  });

  it('should fail rescheduling if date is non-operating day and offer next operating day', async () => {
    // We book under Business 1 first
    const bookResult = await createBooking.runAsync({
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
    const appointmentId = bookResult.appointment.id;

    // Switch to Business 2 (weekdays only) for rescheduling.
    // Since Business 2 has different services/stylists, let's update the appointment's service/stylist first so it doesn't fail search validation or we can just mock the config.
    // Wait, Business 2 has 'massage' and 'makeup', but the booking was haircut/alice. To bypass, let's update test config to have haircut/alice temporarily, but operatingDays as weekdays only.
    const customConfig = {
      ...business2Config,
      services: business1Config.services,
      stylists: business1Config.stylists,
    };
    setTestConfig(customConfig);

    const result = await rescheduleBooking.runAsync({
      args: {
        appointmentId,
        newDate: '2026-07-04', // Saturday
        newTime: '11:00',
      },
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('error');
    expect(result.message).toContain('not an operating day');
    expect(result.message).toContain('2026-07-06');
  });
});
