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

export function rescheduleAppointment(
  id: string,
  newDate: string,
  newTime: string
): { success: boolean; appointment?: Appointment; error?: string } {
  const appointments = getAppointments();
  const appIndex = appointments.findIndex(app => app.id.toUpperCase() === id.toUpperCase());
  if (appIndex === -1) {
    return { success: false, error: `Appointment ID '${id}' not found.` };
  }

  const app = appointments[appIndex];
  const service = SERVICES.find(s => s.id === app.serviceId)!;
  const stylist = STYLISTS.find(s => s.id === app.stylistId)!;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    return { success: false, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  if (!isDateWithinBookingWindow(newDate, ACTIVE_CONFIG.bookingWindowMonths)) {
    return { success: false, error: `Date ${newDate} is outside the allowed booking window of ${ACTIVE_CONFIG.bookingWindowMonths} month(s).` };
  }

  if (!isOperatingDay(newDate, ACTIVE_CONFIG.operatingDays)) {
    const nextDay = getNextOperatingDay(newDate, ACTIVE_CONFIG.operatingDays);
    return { success: false, error: `${newDate} is not an operating day. The next operating day is ${nextDay}.` };
  }

  if (!/^\d{2}:\d{2}$/.test(newTime)) {
    return { success: false, error: "Invalid time format. Expected HH:MM." };
  }

  const startMin = parseTimeToMinutes(newTime);
  const duration = service.durationMinutes;
  const endMin = startMin + duration;

  if (startMin < 9 * 60 || endMin > 18 * 60) {
    return { success: false, error: "Appointment must be within business hours (09:00 - 18:00)." };
  }

  // Check overlap (excluding current appointment)
  const otherAppointments = appointments.filter(
    (a, idx) => idx !== appIndex && a.date === newDate && a.stylistId === app.stylistId
  );

  for (const otherApp of otherAppointments) {
    const appStart = parseTimeToMinutes(otherApp.time);
    const appEnd = appStart + otherApp.durationMinutes;

    if (Math.max(startMin, appStart) < Math.min(endMin, appEnd)) {
      return {
        success: false,
        error: `Stylist ${stylist.name} is already booked from ${otherApp.time} to ${formatMinutesToTime(appEnd)} on ${newDate}.`,
      };
    }
  }

  app.date = newDate;
  app.time = newTime;

  saveAppointments(appointments);

  return { success: true, appointment: app };
}

export const rescheduleBooking = new FunctionTool({
  name: 'reschedule_appointment',
  description: 'Reschedules an existing appointment to a new date and time.',
  parameters: z.object({
    appointmentId: z.string().describe('The appointment ID to reschedule (e.g., "APT-1234").'),
    newDate: z.string().describe('The new date in YYYY-MM-DD format.'),
    newTime: z.string().describe('The new start time in HH:MM format.'),
  }),
  execute: ({ appointmentId, newDate, newTime }) => {
    const result = rescheduleAppointment(appointmentId, newDate, newTime);
    if (result.success) {
      return { status: 'success', appointment: result.appointment };
    } else {
      return { status: 'error', message: result.error };
    }
  },
});
