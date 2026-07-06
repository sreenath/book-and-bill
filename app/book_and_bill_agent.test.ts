import { describe, it, expect } from 'vitest';
import { rootAgent, appointmentAgent, invoiceQuoteAgent } from './book_and_bill_agent.js';

describe('Agent system instructions cleanup', () => {
  it('should not contain single quotes around tool names to prevent parser/model confusion', () => {
    const instruction = appointmentAgent.instruction as string;

    // The instruction should refer to tools without surrounding single quotes
    expect(instruction).not.toContain("'list_services'");
    expect(instruction).not.toContain("'list_stylists'");
    expect(instruction).not.toContain("'check_availability'");
    expect(instruction).not.toContain("'search_appointments'");
    expect(instruction).not.toContain("'cancel_appointment'");
    expect(instruction).not.toContain("'get_current_date'");

    // It should refer to them as tools directly or without single quotes
    expect(instruction).toContain('use the list_services tool');
    expect(instruction).toContain('the list_stylists tool');
    expect(instruction).toContain('Use the check_availability tool');
    expect(instruction).toContain('the search_appointments tool');
    expect(instruction).toContain('call the cancel_appointment tool');
    expect(instruction).toContain('use the get_current_date tool');
  });

  it('should explicitly instruct the agent to confirm booking details and not auto-book unavailable/unconfirmed slots', () => {
    const instruction = (appointmentAgent.instruction as string).toLowerCase();

    // Check for explicit confirmation requirement
    expect(instruction).toContain('explicit confirmation');

    // Check that booking is not called without confirmation or if slot is unavailable
    expect(instruction).toContain('do not book');
    expect(instruction).toContain('alternative');
    expect(instruction).toContain('suggest');
  });

  it('should instruct the agent on the rescheduling verification and search constraints', () => {
    const instruction = (appointmentAgent.instruction as string).toLowerCase();

    // Check that rescheduling instructions are present and mirror cancellation rules
    expect(instruction).toContain('reschedule');
    expect(instruction).toContain('customer\'s full name');
    expect(instruction).toContain('phone number');
    expect(instruction).toContain('date and time');
    expect(instruction).toContain('only search for an existing appointment');
    expect(instruction).toContain('search_appointments');
    expect(instruction).toContain('provided at least the customer\'s full name, phone number, and the date');
    expect(instruction).toContain('do not perform the search');
    expect(instruction).toContain('all four details');
    expect(instruction).toContain('required to proceed');
    expect(instruction).toContain('verify that the details provided match');
    expect(instruction).toContain('do not reschedule');
  });

  it('should instruct the agent on year-less date resolution rules', () => {
    const instruction = (appointmentAgent.instruction as string).toLowerCase();

    expect(instruction).toContain('without a year');
    expect(instruction).toContain('get_current_date');
    expect(instruction).toContain('booking window');
    expect(instruction).toContain('confirm');
    expect(instruction).toContain('not in the past');
  });

  it('should instruct the agent to be highly concise and omit unnecessary service/stylist options', () => {
    const instruction = (appointmentAgent.instruction as string).toLowerCase();

    expect(instruction).toContain('concise');
    expect(instruction).toContain('explain');
    expect(instruction).toContain('internal validation');
    expect(instruction).toContain('only');
  });

  it('should instruct the agent to strictly follow security and privacy rules for appointment lookups', () => {
    const appointmentInstruction = (appointmentAgent.instruction as string).toLowerCase();
    const invoiceInstruction = (invoiceQuoteAgent.instruction as string).toLowerCase();

    // Check appointment specialist instructions
    expect(appointmentInstruction).toContain('security');
    expect(appointmentInstruction).toContain('privacy');
    expect(appointmentInstruction).toContain('never disclose');
    expect(appointmentInstruction).toContain('trick');
    expect(appointmentInstruction).toContain('full name, phone number, and the date');

    // Check invoice/quote specialist instructions
    expect(invoiceInstruction).toContain('never disclose');
    expect(invoiceInstruction).toContain('full name, phone number, and appointment date');
  });
});

describe('Agent session greeting', () => {
  it('should prepopulate the session with a greeting event from book_and_bill_agent on session creation', async () => {
    const { InMemorySessionService } = await import('@google/adk');
    const { ACTIVE_CONFIG } = await import('./config/business-config.js');
    const sessionService = new InMemorySessionService();
    const session = await sessionService.createSession({
      appName: 'book_and_bill',
      userId: 'test-user-greeting',
    });

    expect(session.events).toHaveLength(1);
    const greetingEvent = session.events[0];
    expect(greetingEvent).toBeDefined();
    expect(greetingEvent?.author).toBe('book_and_bill_agent');
    expect(greetingEvent?.content?.parts?.[0]?.text).toBe(ACTIVE_CONFIG.welcomeMessage);
  });
});
