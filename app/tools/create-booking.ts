import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import {
  SERVICES,
  STYLISTS,
  getAppointments,
  saveAppointments,
  parseTimeToMinutes,
  formatMinutesToTime,
  Appointment,
} from '../scheduler.js';
import { ACTIVE_CONFIG } from '../config/business-config.js';
import {
  isDateWithinBookingWindow,
  isOperatingDay,
  getNextOperatingDay,
} from '../config/validation.js';

export function bookAppointment(
  customerName: string,
  customerPhone: string,
  serviceId: string,
  stylistId: string,
  date: string,
  time: string
): { success: boolean; appointment?: Appointment; error?: string } {
  const service = SERVICES.find(s => s.id === serviceId);
  const stylist = STYLISTS.find(s => s.id === stylistId);

  if (!service) {
    return { success: false, error: `Service '${serviceId}' not found.` };
  }
  if (!stylist) {
    return { success: false, error: `Stylist '${stylistId}' not found.` };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  if (!isDateWithinBookingWindow(date, ACTIVE_CONFIG.bookingWindowMonths)) {
    return { success: false, error: `Date ${date} is outside the allowed booking window of ${ACTIVE_CONFIG.bookingWindowMonths} month(s).` };
  }

  if (!isOperatingDay(date, ACTIVE_CONFIG.operatingDays)) {
    const nextDay = getNextOperatingDay(date, ACTIVE_CONFIG.operatingDays);
    return { success: false, error: `${date} is not an operating day. The next operating day is ${nextDay}.` };
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return { success: false, error: "Invalid time format. Expected HH:MM." };
  }

  const startMin = parseTimeToMinutes(time);
  const duration = service.durationMinutes;
  const endMin = startMin + duration;

  if (startMin < 9 * 60 || endMin > 18 * 60) {
    return { success: false, error: "Appointment must be within business hours (09:00 - 18:00)." };
  }

  // Check overlap
  const appointments = getAppointments();
  const stylistAppointments = appointments.filter(
    app => app.date === date && app.stylistId === stylistId
  );

  for (const app of stylistAppointments) {
    const appStart = parseTimeToMinutes(app.time);
    const appEnd = appStart + app.durationMinutes;

    if (Math.max(startMin, appStart) < Math.min(endMin, appEnd)) {
      return {
        success: false,
        error: `Stylist ${stylist.name} is already booked from ${app.time} to ${formatMinutesToTime(appEnd)} on ${date}.`,
      };
    }
  }

  const id = `APT-${Math.floor(1000 + Math.random() * 9000)}`;

  const newApp: Appointment = {
    id,
    customerName,
    customerPhone,
    serviceId,
    stylistId,
    date,
    time,
    durationMinutes: duration,
  };

  appointments.push(newApp);
  saveAppointments(appointments);

  return { success: true, appointment: newApp };
}

export const createBooking = new FunctionTool({
  name: 'book_appointment',
  description: 'Books an appointment for a customer for a given service, stylist, date, and start time.',
  parameters: z.object({
    customerName: z.string().describe('The full name of the customer.'),
    customerPhone: z.string().describe('The contact phone number of the customer.'),
    serviceId: z.string().describe('The ID of the service (e.g., "haircut", "coloring", "manicure", "pedicure", "facial").'),
    stylistId: z.string().describe('The ID of the stylist (e.g., "alice", "bob", "charlie").'),
    date: z.string().describe('The date of the appointment in YYYY-MM-DD format.'),
    time: z.string().describe('The start time of the appointment in HH:MM format (e.g., "10:30").'),
  }),
  execute: ({ customerName, customerPhone, serviceId, stylistId, date, time }) => {
    const result = bookAppointment(customerName, customerPhone, serviceId, stylistId, date, time);
    if (result.success) {
      return { status: 'success', appointment: result.appointment };
    } else {
      return { status: 'error', message: result.error };
    }
  },
});
