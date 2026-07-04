import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import {
  getQuotes,
  saveQuotes,
  SERVICES,
  Quote,
} from '../scheduler.js';

export function makeQuote(
  customerName: string,
  customerPhone: string,
  serviceId: string
): { success: boolean; quote?: Quote; error?: string } {
  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) {
    return { success: false, error: `Service '${serviceId}' not found.` };
  }

  const price = service.price;
  const tax = Math.round(price * 0.1 * 100) / 100; // 10% tax rounded to 2 decimals
  const total = Math.round((price + tax) * 100) / 100;

  const id = `QT-${Math.floor(1000 + Math.random() * 9000)}`;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const newQuote: Quote = {
    id,
    customerName,
    customerPhone,
    serviceId,
    serviceName: service.name,
    price,
    tax,
    total,
    date: dateStr,
  };

  const quotes = getQuotes();
  quotes.push(newQuote);
  saveQuotes(quotes);

  return { success: true, quote: newQuote };
}

export const createQuote = new FunctionTool({
  name: 'create_quote',
  description: 'Creates a price quote for a service, customer name, and customer phone.',
  parameters: z.object({
    customerName: z.string().describe('The full name of the customer.'),
    customerPhone: z.string().describe('The contact phone number of the customer.'),
    serviceId: z.string().describe('The ID of the service (e.g., "haircut", "coloring", "manicure", "pedicure", "facial", "massage", "makeup").'),
  }),
  execute: ({ customerName, customerPhone, serviceId }) => {
    const result = makeQuote(customerName, customerPhone, serviceId);
    if (result.success) {
      return { status: 'success', quote: result.quote };
    } else {
      return { status: 'error', message: result.error };
    }
  },
});
