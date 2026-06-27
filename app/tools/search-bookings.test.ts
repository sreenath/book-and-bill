import { describe, it, expect, beforeEach } from 'vitest';
import { searchBookings } from './search-bookings.js';
import { createBooking } from './create-booking.js';
import * as fs from 'fs';
import * as path from 'path';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'appointments.json');

describe('searchBookings tool', () => {
  beforeEach(() => {
    if (fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  });

  it('should find bookings', async () => {
    await createBooking.runAsync({
      args: {
        customerName: 'John Doe',
        customerPhone: '555-1234',
        serviceId: 'haircut',
        stylistId: 'alice',
        date: '2026-07-01',
        time: '10:00',
      },
      toolContext: {} as any,
    });

    const result = await searchBookings.runAsync({
      args: { customerName: 'John' },
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('success');
    expect(result.appointments.length).toBe(1);
    expect(result.appointments[0].customerName).toBe('John Doe');
  });
});
