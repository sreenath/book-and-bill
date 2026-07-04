import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import {
  getAppointments,
  getInvoices,
  saveInvoices,
  SERVICES,
  Invoice,
} from '../scheduler.js';

export function makeInvoice(
  appointmentId: string
): { success: boolean; invoice?: Invoice; error?: string } {
  const appointments = getAppointments();
  const appointment = appointments.find(app => app.id === appointmentId);

  if (!appointment) {
    return { success: false, error: `Appointment '${appointmentId}' not found.` };
  }

  // Check if invoice already exists for this appointment
  const invoices = getInvoices();
  const existingInvoice = invoices.find(inv => inv.appointmentId === appointmentId);
  if (existingInvoice) {
    return { success: true, invoice: existingInvoice };
  }

  const service = SERVICES.find(s => s.id === appointment.serviceId);
  if (!service) {
    return { success: false, error: `Service '${appointment.serviceId}' not found.` };
  }

  const price = service.price;
  const tax = Math.round(price * 0.1 * 100) / 100; // 10% tax rounded to 2 decimals
  const total = Math.round((price + tax) * 100) / 100;

  const id = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

  const newInvoice: Invoice = {
    id,
    appointmentId,
    customerName: appointment.customerName,
    customerPhone: appointment.customerPhone,
    serviceId: appointment.serviceId,
    serviceName: service.name,
    price,
    tax,
    total,
    date: appointment.date,
  };

  invoices.push(newInvoice);
  saveInvoices(invoices);

  return { success: true, invoice: newInvoice };
}

export const createInvoice = new FunctionTool({
  name: 'create_invoice',
  description: 'Creates an invoice for a completed booking or a given appointment ID.',
  parameters: z.object({
    appointmentId: z.string().describe('The ID of the appointment (e.g. "APT-1234").'),
  }),
  execute: ({ appointmentId }) => {
    const result = makeInvoice(appointmentId);
    if (result.success) {
      return { status: 'success', invoice: result.invoice };
    } else {
      return { status: 'error', message: result.error };
    }
  },
});
