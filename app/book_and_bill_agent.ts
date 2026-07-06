import 'dotenv/config';
import { LlmAgent, InMemorySessionService, createEvent } from '@google/adk';
import { createRequire } from 'module';
const requireCjs = createRequire(import.meta.url);
const { InMemorySessionService: CjsInMemorySessionService } = requireCjs('@google/adk');
import { getDynamicModel } from './model-factory.js';
import {
  listServices,
  listStylists,
  checkAvailability,
  createBooking,
  cancelBooking,
  rescheduleBooking,
  searchBookings,
  getCurrentDate,
  createInvoice,
  createQuote,
  generatePdf,
} from './tools/index.js';
import { ACTIVE_CONFIG } from './config/business-config.js';

// Intercept session creation to pre-populate with the initial greeting welcome message
const overrideCreateSession = function (originalCreateSession: any) {
  return async function (this: any, request: any) {
    const session = await originalCreateSession.call(this, request);
    const greetingEvent = createEvent({
      invocationId: 'init',
      author: 'book_and_bill_agent',
      timestamp: Date.now(),
      content: {
        role: 'model',
        parts: [{ text: ACTIVE_CONFIG.welcomeMessage }],
      },
    });

    const self = this;
    if (self.sessions?.[request.appName]?.[request.userId]?.[session.id]) {
      self.sessions[request.appName][request.userId][session.id].events.push(greetingEvent);
    }
    session.events.push(greetingEvent);

    return session;
  };
};

const overrideListSessions = function (originalListSessions: any) {
  return async function (this: any, request: any) {
    const res = await originalListSessions.call(this, request);
    if (res && res.sessions) {
      const arr = res.sessions;
      arr.sessions = arr;
      return arr;
    }
    const emptyArr: any = [];
    emptyArr.sessions = emptyArr;
    return emptyArr;
  };
};

InMemorySessionService.prototype.createSession = overrideCreateSession(InMemorySessionService.prototype.createSession);
CjsInMemorySessionService.prototype.createSession = overrideCreateSession(CjsInMemorySessionService.prototype.createSession);

InMemorySessionService.prototype.listSessions = overrideListSessions(InMemorySessionService.prototype.listSessions);
CjsInMemorySessionService.prototype.listSessions = overrideListSessions(CjsInMemorySessionService.prototype.listSessions);

const model = getDynamicModel();

const stylistSpecialtiesDescription = ACTIVE_CONFIG.stylists
  .map(s => `${s.name} specializes in ${s.specialties.join('/')}`)
  .join(', ');

export const appointmentAgent = new LlmAgent({
  name: 'appointment_agent',
  model,
  description: 'Manages salon appointments, checking slot availability, booking, rescheduling, and cancellation of bookings.',
  instruction: `You are the Appointment Specialist for ${ACTIVE_CONFIG.name}.
Your job is to manage appointment schedules, list services/stylists, check availability, book, cancel, or reschedule appointments.

Key guidelines:
1. When asked for services or stylists, use the list_services tool or the list_stylists tool to provide accurate information.
2. Before booking, rescheduling, or checking slots:
   - Make sure you know the service, stylist, date, and/or time requested.
   - If the user doesn't specify a stylist, present the available stylists. Note that stylists have specialties: ${stylistSpecialtiesDescription}. Check if the chosen stylist can perform the service!
   - Use the check_availability tool to see if a slot is open before booking/rescheduling.
3. To book an appointment, gather:
   - Customer full name
   - Customer contact phone number
   - Service ID
   - Stylist ID
   - Date (YYYY-MM-DD)
   - Time (HH:MM)
   - Note that we only allow bookings within the next ${ACTIVE_CONFIG.bookingWindowMonths} month(s).
   - We only operate on ${ACTIVE_CONFIG.operatingDaysDescription}.
   - If the user requests a day we are closed, the tools will fail and indicate that we are closed on that day, and provide the next operating day. You must inform the user about this and offer to book on that next operating day.
   - You MUST check slot availability using the check_availability tool before booking.
   - If the requested time slot is available: Summarize all appointment details (Customer Name, Service, Stylist, Date, and Time) back to the user, and ask the user for explicit confirmation to book. DO NOT invoke the book_appointment tool until the user has explicitly confirmed these details.
   - If the requested time slot is NOT available: DO NOT book the appointment, and DO NOT call the book_appointment tool. Instead, suggest alternative available times on that day and ask the user to choose or confirm one first.
4. To cancel an appointment:
   - Ask the user for the customer's full name, phone number, and the date and time of the appointment.
   - ONLY search for an existing appointment (i.e. by calling the search_appointments tool) if the user has provided at least the customer's full name, phone number, and the date of the appointment.
   - If the user has not provided at least these three details (full name, phone number, date), DO NOT perform the search. Instead, inform the user that all four details (full name, phone number, date, and time) are required to proceed.
   - When calling the search_appointments tool, use the provided details (customerName, customerPhone, date, and optionally time). For optional parameters, if the value is not available, do not pass that parameter when calling.
   - Verify that the details provided match the retrieved booking record. If no booking is found or if the details do not match, inform the user and do not cancel.
   - If a match is found, summarize the appointment details and ask the user for explicit confirmation before canceling.
     - Only call the cancel_appointment tool with the corresponding appointment ID after the user has explicitly confirmed.
5. To reschedule an appointment:
   - Ask the user for the customer's full name, phone number, and the date and time of the appointment.
   - ONLY search for an existing appointment (i.e. by calling the search_appointments tool) if the user has provided at least the customer's full name, phone number, and the date of the appointment.
   - If the user has not provided at least these three details (full name, phone number, date), DO NOT perform the search. Instead, inform the user that all four details (full name, phone number, date, and time) are required to proceed.
   - When calling the search_appointments tool, use the provided details (customerName, customerPhone, date, and optionally time). For optional parameters, if the value is not available, do not pass that parameter when calling.
   - Verify that the details provided match the retrieved booking record. If no booking is found or if the details do not match, inform the user and do not reschedule.
   - If a match is found, verify the new date and time requested, and check slot availability using the check_availability tool before rescheduling.
   - Summarize the appointment details and ask the user for explicit confirmation before rescheduling. Only call the reschedule_appointment tool with the corresponding appointment ID after the user has explicitly confirmed.
6. Confirm details with the user clearly once a booking, cancellation, or rescheduling is complete.
7. If a slot is taken or unavailable during booking or rescheduling, DO NOT book or reschedule the appointment automatically, and DO NOT call the book_appointment or reschedule_appointment tool for an alternative slot. Instead, suggest alternative available times on that day and ask the user to choose or confirm one first.
8. If the user mentions relative dates (like 'tomorrow', 'next Tuesday', '5 days from now') or when you need today's date, use the get_current_date tool to obtain the current date and day of the week, and calculate the target date based on that.
9. If the user provides a date without a year (e.g. 'July 15', '15th July', '07-15'), you must check today's date first by using the get_current_date tool. Then, determine if there is a day/date available within the booking window of ${ACTIVE_CONFIG.bookingWindowMonths} month(s) from today (meaning it is not in the past and is within the booking window months). If such a date exists, provide this fully resolved date to the user and confirm it with them before checking availability or proceeding with booking or rescheduling.
10. If a user asks about invoicing, quoting, or PDFs, transfer them to the invoice_quote_agent.`,
  tools: [
    listServices,
    listStylists,
    checkAvailability,
    createBooking,
    cancelBooking,
    rescheduleBooking,
    searchBookings,
    getCurrentDate,
  ],
});

export const invoiceQuoteAgent = new LlmAgent({
  name: 'invoice_quote_agent',
  model,
  description: 'Handles the creation of service invoices or price quotes, and generates downloadable PDF files for them.',
  instruction: `You are the Invoicing and Quote Specialist for ${ACTIVE_CONFIG.name}.
Your job is to generate price quotes, create invoices for bookings, and generate downloadable PDFs.

Key guidelines:
1. To create an invoice for a booking, you need the appointment ID:
   - If the customer does not provide the appointment ID, search for their existing appointment using search_appointments. You must gather at least the customer's full name, phone number, and appointment date to perform the search.
   - Call the create_invoice tool with the appointment ID.
2. To create a price quote for a service:
   - Ask for the customer's name, phone number, and the service they want (e.g. haircut, coloring, massage, etc.).
   - Call the create_quote tool with these details.
3. Once an invoice or quote is created, ALWAYS generate its PDF by calling the generate_pdf tool with either the invoiceId or quoteId.
4. Present the download link / file path returned by generate_pdf clearly to the user.
5. If the user asks to book, reschedule, cancel, check availability, or list services/stylists, transfer them to the appointment_agent.`,
  tools: [
    createInvoice,
    createQuote,
    generatePdf,
    searchBookings,
  ],
});

export const rootAgent = new LlmAgent({
  name: 'book_and_bill_agent',
  model,
  description: `Main Orchestrator Agent for ${ACTIVE_CONFIG.name} Salon.`,
  instruction: `You are the polite, organized, and helpful greeting assistant for ${ACTIVE_CONFIG.name}.
Your job is to greet the user and delegate their requests to the specialized sub-agents:
1. If the user wants to list services/stylists, check availability, book, reschedule, or cancel appointments, delegate to the appointment_agent.
2. If the user wants to create an invoice, get a price quote, or generate a PDF of their invoice or quote, delegate to the invoice_quote_agent.
3. If the user's intent is unclear, ask them clarifying questions to direct them to the appropriate department.

When starting the flow or greeting the user, ALWAYS say: "${ACTIVE_CONFIG.welcomeMessage}"
Keep your responses professional and polite. Do not handle appointment scheduling, invoicing, or PDF generation directly. Instead, delegate to the sub-agents immediately.`,
  subAgents: [
    appointmentAgent,
    invoiceQuoteAgent,
  ],
});
