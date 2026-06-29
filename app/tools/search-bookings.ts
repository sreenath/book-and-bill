import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { getAppointments, Appointment } from '../scheduler.js';

export function findAppointments(query: {
  customerName?: string;
  customerPhone?: string;
  date?: string;
  time?: string;
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
  if (query.time) {
    apps = apps.filter(app => app.time === query.time);
  }
  return apps;
}

export const searchBookings = new FunctionTool({
  name: 'search_appointments',
  description: 'Searches for appointments based on customer name, phone, date, or time.',
  parameters: z.object({
    customerName: z.string().optional().describe('Filter by customer name.'),
    customerPhone: z.string().optional().describe('Filter by customer phone.'),
    date: z.string().optional().describe('Filter by date in YYYY-MM-DD format.'),
    time: z.string().optional().describe('Filter by time in HH:MM format.'),
  }),
  execute: ({ customerName, customerPhone, date, time }) => {
    const query: {
      customerName?: string;
      customerPhone?: string;
      date?: string;
      time?: string;
    } = {};

    if (customerName !== undefined) query.customerName = customerName;
    if (customerPhone !== undefined) query.customerPhone = customerPhone;
    if (date !== undefined) query.date = date;
    if (time !== undefined) query.time = time;

    const appointments = findAppointments(query);
    return { status: 'success', appointments };
  },
});
