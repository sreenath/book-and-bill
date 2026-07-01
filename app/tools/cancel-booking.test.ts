import { describe, it, expect, beforeEach } from 'vitest';
import { cancelBooking } from './cancel-booking.js';
import { createBooking } from './create-booking.js';
import { clearDatabase } from '../scheduler.js';

describe('cancelBooking tool', () => {
  beforeEach(() => {
    clearDatabase();
  });

  it('should cancel a booking', async () => {
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

    const cancelResult = await cancelBooking.runAsync({
      args: { appointmentId },
      toolContext: {} as any,
    }) as any;

    expect(cancelResult.status).toBe('success');
  });
});
