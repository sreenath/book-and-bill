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

  it('should find bookings filtering by time', async () => {
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

    // Match with correct time
    const resultMatch = await searchBookings.runAsync({
      args: { date: '2026-07-01', time: '10:00' } as any,
      toolContext: {} as any,
    }) as any;
    expect(resultMatch.status).toBe('success');
    expect(resultMatch.appointments.length).toBe(1);

    // No match with different time
    const resultNoMatch = await searchBookings.runAsync({
      args: { date: '2026-07-01', time: '11:00' } as any,
      toolContext: {} as any,
    }) as any;
    expect(resultNoMatch.status).toBe('success');
    expect(resultNoMatch.appointments.length).toBe(0);
  });

  it('should not pass optional parameters if they are undefined or missing', async () => {
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

    // Pass undefined values explicitly, which should be omitted when calling findAppointments
    const result = await searchBookings.runAsync({
      args: {
        customerName: undefined,
        customerPhone: undefined,
        date: '2026-07-01',
        time: undefined,
      } as any,
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('success');
    expect(result.appointments.length).toBe(1);
  });
});
