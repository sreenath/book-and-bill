import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { getAppointments, Appointment } from '../scheduler.js';

export function findAppointments(query: {
  customerName?: string;
  customerPhone?: string;
  date?: string;
}): Appointment[] {
  let apps = getAppointments();
  if (query.customerName) {
    const nameLower = query.customerName.toLowerCase();
    apps = apps.filter(app => app.customerName.toLowerCase().includes(nameLower));
  }
  if (query.customerPhone) {
    apps = apps.filter(app => app.customerPhone.includes(query.customerPhone!));
  }
  if (query.date) {
    apps = apps.filter(app => app.date === query.date);
  }
  return apps;
}

export const searchBookings = new FunctionTool({
  name: 'search_appointments',
  description: 'Searches for appointments based on customer name, phone, or date.',
  parameters: z.object({
    customerName: z.string().optional().describe('Filter by customer name.'),
    customerPhone: z.string().optional().describe('Filter by customer phone.'),
    date: z.string().optional().describe('Filter by date in YYYY-MM-DD format.'),
  }),
  execute: ({ customerName, customerPhone, date }) => {
    const appointments = findAppointments({ customerName, customerPhone, date });
    return { status: 'success', appointments };
  },
});
