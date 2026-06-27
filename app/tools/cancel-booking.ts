import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { getAppointments, saveAppointments } from '../scheduler.js';

export function cancelAppointment(id: string): { success: boolean; error?: string } {
  const appointments = getAppointments();
  const index = appointments.findIndex(app => app.id.toUpperCase() === id.toUpperCase());
  if (index === -1) {
    return { success: false, error: `Appointment ID '${id}' not found.` };
  }
  appointments.splice(index, 1);
  saveAppointments(appointments);
  return { success: true };
}

export const cancelBooking = new FunctionTool({
  name: 'cancel_appointment',
  description: 'Cancels an existing appointment using the appointment ID.',
  parameters: z.object({
    appointmentId: z.string().describe('The appointment ID to cancel (e.g., "APT-1234").'),
  }),
  execute: ({ appointmentId }) => {
    const result = cancelAppointment(appointmentId);
    if (result.success) {
      return { status: 'success', message: `Appointment ${appointmentId} was successfully cancelled.` };
    } else {
      return { status: 'error', message: result.error };
    }
  },
});
