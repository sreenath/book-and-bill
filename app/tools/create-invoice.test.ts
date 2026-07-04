import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createInvoice } from './create-invoice.js';
import { createBooking } from './create-booking.js';
import { clearDatabase, getInvoices } from '../scheduler.js';

describe('createInvoice tool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00'));
    clearDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create an invoice for a booking', async () => {
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

    const invoiceResult = await createInvoice.runAsync({
      args: { appointmentId },
      toolContext: {} as any,
    }) as any;

    expect(invoiceResult.status).toBe('success');
    expect(invoiceResult.invoice).toBeDefined();
    expect(invoiceResult.invoice.customerName).toBe('John Doe');
    expect(invoiceResult.invoice.price).toBe(35);
    expect(invoiceResult.invoice.tax).toBe(3.5);
    expect(invoiceResult.invoice.total).toBe(38.5);

    const invoices = getInvoices();
    expect(invoices.length).toBe(1);
    expect(invoices[0].appointmentId).toBe(appointmentId);
  });

  it('should return error if appointment does not exist', async () => {
    const result = await createInvoice.runAsync({
      args: { appointmentId: 'APT-9999' },
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('error');
    expect(result.message).toContain('not found');
  });
});
