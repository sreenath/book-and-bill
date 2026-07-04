import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createQuote } from './create-quote.js';
import { clearDatabase, getQuotes } from '../scheduler.js';

describe('createQuote tool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00'));
    clearDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a quote for a service', async () => {
    const quoteResult = await createQuote.runAsync({
      args: {
        customerName: 'John Doe',
        customerPhone: '555-1234',
        serviceId: 'haircut',
      },
      toolContext: {} as any,
    }) as any;

    expect(quoteResult.status).toBe('success');
    expect(quoteResult.quote).toBeDefined();
    expect(quoteResult.quote.customerName).toBe('John Doe');
    expect(quoteResult.quote.price).toBe(35);
    expect(quoteResult.quote.tax).toBe(3.5);
    expect(quoteResult.quote.total).toBe(38.5);
    expect(quoteResult.quote.date).toBe('2026-07-01');

    const quotes = getQuotes();
    expect(quotes.length).toBe(1);
    expect(quotes[0].id).toBe(quoteResult.quote.id);
  });

  it('should return error if service does not exist', async () => {
    const result = await createQuote.runAsync({
      args: {
        customerName: 'John Doe',
        customerPhone: '555-1234',
        serviceId: 'nonexistent',
      },
      toolContext: {} as any,
    }) as any;

    expect(result.status).toBe('error');
    expect(result.message).toContain('not found');
  });
});
