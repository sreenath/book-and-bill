import { describe, it, expect, beforeEach } from 'vitest';
import { rescheduleBooking } from './reschedule-booking.js';
import { createBooking } from './create-booking.js';
import * as fs from 'fs';
import * as path from 'path';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'appointments.json');

describe('rescheduleBooking tool', () => {
  beforeEach(() => {
    if (fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
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
});
