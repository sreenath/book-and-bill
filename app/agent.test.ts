import { describe, it, expect } from 'vitest';
import { rootAgent, appointmentAgent } from './agent.js';

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
});
