import { describe, it, expect, beforeEach } from 'vitest';
import { cancelBooking } from './cancel-booking.js';
import { createBooking } from './create-booking.js';
import * as fs from 'fs';
import * as path from 'path';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'appointments.json');

describe('cancelBooking tool', () => {
  beforeEach(() => {
    if (fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
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
