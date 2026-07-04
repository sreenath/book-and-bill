import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generatePdf } from './generate-pdf.js';
import { createInvoice } from './create-invoice.js';
import { createQuote } from './create-quote.js';
import { createBooking } from './create-booking.js';
import { clearDatabase } from '../scheduler.js';
import * as fs from 'fs';

describe('generatePdf tool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00'));
    clearDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a PDF for an invoice', async () => {
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
    const invoiceId = invoiceResult.invoice.id;

    const pdfResult = await generatePdf.runAsync({
      args: { invoiceId },
      toolContext: {} as any,
    }) as any;

    expect(pdfResult.status).toBe('success');
    expect(pdfResult.filePath).toBeDefined();

    // Verify file actually exists
    const pathString = pdfResult.filePath.replace('file:///', '');
    expect(fs.existsSync(pathString)).toBe(true);

    // Clean up file
    fs.unlinkSync(pathString);
  });

  it('should generate a PDF for a quote', async () => {
    const quoteResult = await createQuote.runAsync({
      args: {
        customerName: 'John Doe',
        customerPhone: '555-1234',
        serviceId: 'haircut',
      },
      toolContext: {} as any,
    }) as any;
    const quoteId = quoteResult.quote.id;

    const pdfResult = await generatePdf.runAsync({
      args: { quoteId },
      toolContext: {} as any,
    }) as any;

    expect(pdfResult.status).toBe('success');
    expect(pdfResult.filePath).toBeDefined();

    const pathString = pdfResult.filePath.replace('file:///', '');
    expect(fs.existsSync(pathString)).toBe(true);

    fs.unlinkSync(pathString);
  });

  it('should return error if neither invoiceId nor quoteId is provided', async () => {
    const result = await generatePdf.runAsync({
      args: {},
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('error');
    expect(result.message).toContain('must provide either');
  });
});
