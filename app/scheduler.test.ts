import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SERVICES,
  STYLISTS,
  getAppointments,
  clearDatabase,
} from './scheduler.js';
import { getAvailableSlots } from './tools/check-availability.js';
import { bookAppointment } from './tools/create-booking.js';
import { cancelAppointment } from './tools/cancel-booking.js';
import { rescheduleAppointment } from './tools/reschedule-booking.js';
import { findAppointments } from './tools/search-bookings.js';

describe('Saloon Scheduler Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00'));
    clearDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should list services and stylists correctly', () => {
    expect(SERVICES.length).toBe(5);
    expect(STYLISTS.length).toBe(3);
  });

  it('should return all available slots when no bookings exist', () => {
    // Haircut takes 30 mins.
    // Business hours 09:00 - 18:00 (18 slots total: 09:00 to 17:30)
    const slots = getAvailableSlots('2026-07-01', 'haircut', 'alice');
    expect(slots.length).toBe(18);
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('17:30');
  });

  it('should filter slots when a booking exists', () => {
    // Book Alice for haircut (30 mins) on 2026-07-01 at 09:00
    const booking = bookAppointment(
      'John Doe',
      '555-0192',
      'haircut',
      'alice',
      '2026-07-01',
      '09:00'
    );
    expect(booking.success).toBe(true);

    const slots = getAvailableSlots('2026-07-01', 'haircut', 'alice');
    // 09:00 should be booked, so 17 slots left (09:30 to 17:30)
    expect(slots.length).toBe(17);
    expect(slots.includes('09:00')).toBe(false);
    expect(slots[0]).toBe('09:30');
  });

  it('should prevent overlapping bookings', () => {
    // Book Alice for haircut (30 mins) at 10:00
    const res1 = bookAppointment(
      'Customer A',
      '555-1111',
      'haircut',
      'alice',
      '2026-07-01',
      '10:00'
    );
    expect(res1.success).toBe(true);

    // Book Alice for haircut again at 10:00 - should fail
    const res2 = bookAppointment(
      'Customer B',
      '555-2222',
      'haircut',
      'alice',
      '2026-07-01',
      '10:00'
    );
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('already booked');
  });

  it('should cancel appointments', () => {
    const res = bookAppointment(
      'Customer A',
      '555-1111',
      'haircut',
      'alice',
      '2026-07-01',
      '10:00'
    );
    const appointmentId = res.appointment!.id;

    // Cancel appointment
    const cancelRes = cancelAppointment(appointmentId);
    expect(cancelRes.success).toBe(true);

    const appointments = getAppointments();
    expect(appointments.length).toBe(0);
  });

  it('should reschedule appointments', () => {
    const res = bookAppointment(
      'Customer A',
      '555-1111',
      'haircut',
      'alice',
      '2026-07-01',
      '10:00'
    );
    const appointmentId = res.appointment!.id;

    // Reschedule to 11:30
    const rescheduleRes = rescheduleAppointment(appointmentId, '2026-07-01', '11:30');
    expect(rescheduleRes.success).toBe(true);
    expect(rescheduleRes.appointment!.time).toBe('11:30');

    // Verify 10:00 is now free
    const slots = getAvailableSlots('2026-07-01', 'haircut', 'alice');
    expect(slots.includes('10:00')).toBe(true);
    expect(slots.includes('11:30')).toBe(false);
  });
});
