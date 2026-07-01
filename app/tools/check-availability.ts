import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import {
  SERVICES,
  STYLISTS,
  getAppointments,
  parseTimeToMinutes,
  formatMinutesToTime,
} from '../scheduler.js';
import { ACTIVE_CONFIG } from '../config/business-config.js';
import {
  isDateWithinBookingWindow,
  isOperatingDay,
  getNextOperatingDay,
} from '../config/validation.js';

export function getAvailableSlots(date: string, serviceId: string, stylistId: string): string[] {
  const service = SERVICES.find(s => s.id === serviceId);
  const stylist = STYLISTS.find(s => s.id === stylistId);
  if (!service || !stylist) {
    return [];
  }

  const appointments = getAppointments().filter(
    app => app.date === date && app.stylistId === stylistId
  );

  const startMin = 9 * 60; // 09:00
  const endMin = 18 * 60; // 18:00
  const duration = service.durationMinutes;

  const available: string[] = [];

  // Generate slots every 30 mins
  for (let mins = startMin; mins + duration <= endMin; mins += 30) {
    const slotStart = mins;
    const slotEnd = mins + duration;

    // Check overlap
    let overlap = false;
    for (const app of appointments) {
      const appStart = parseTimeToMinutes(app.time);
      const appEnd = appStart + app.durationMinutes;

      // Overlap condition: max(start1, start2) < min(end1, end2)
      if (Math.max(slotStart, appStart) < Math.min(slotEnd, appEnd)) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      available.push(formatMinutesToTime(slotStart));
    }
  }

  return available;
}

export const checkAvailability = new FunctionTool({
  name: 'check_availability',
  description: 'Checks for available start times (HH:MM) for a specific date, service, and stylist.',
  parameters: z.object({
    date: z.string().describe('The date in YYYY-MM-DD format (e.g., "2026-07-01").'),
    serviceId: z.string().describe('The ID of the service (e.g., "haircut", "coloring", "manicure", "pedicure", "facial").'),
    stylistId: z.string().describe('The ID of the stylist (e.g., "alice", "bob", "charlie").'),
  }),
  execute: ({ date, serviceId, stylistId }) => {
    if (!isDateWithinBookingWindow(date, ACTIVE_CONFIG.bookingWindowMonths)) {
      return {
        status: 'error',
        message: `Date ${date} is outside the allowed booking window of ${ACTIVE_CONFIG.bookingWindowMonths} month(s).`,
      };
    }
    if (!isOperatingDay(date, ACTIVE_CONFIG.operatingDays)) {
      const nextDay = getNextOperatingDay(date, ACTIVE_CONFIG.operatingDays);
      return {
        status: 'error',
        message: `${date} is not an operating day. The next operating day is ${nextDay}.`,
        nextOperatingDay: nextDay,
      };
    }
    const slots = getAvailableSlots(date, serviceId, stylistId);
    return { status: 'success', date, serviceId, stylistId, availableSlots: slots };
  },
});
