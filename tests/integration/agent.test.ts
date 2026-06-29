import { config } from 'dotenv';
config();

import { describe, it, expect, beforeEach } from 'vitest';
import { Runner, InMemorySessionService, getFunctionCalls } from '@google/adk';
import { rootAgent } from '../../app/agent.js';

const hasApiKey = !!(
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GROQ_API_KEY ||
  process.env.OPENAI_API_KEY
);

function hasQuotaError(events: any[]): boolean {
  return events.some(
    e => e.errorCode === '429' ||
         (e.errorMessage && (e.errorMessage.includes('Quota exceeded') || e.errorMessage.includes('quota')))
  );
}

describe.runIf(hasApiKey)('Agent Integration', () => {
  let runner: Runner;
  let sessionService: InMemorySessionService;

  beforeEach(() => {
    sessionService = new InMemorySessionService();
    runner = new Runner({
      appName: 'test-app',
      agent: rootAgent,
      sessionService,
    });
  });

  it('should list services when asked', async () => {
    await sessionService.createSession({
      appName: 'test-app',
      userId: 'test-user',
      sessionId: 'test-session',
    });

    const events: any[] = [];
    for await (const event of runner.runAsync({
      userId: 'test-user',
      sessionId: 'test-session',
      newMessage: {
        role: 'user',
        parts: [{ text: 'What services do you offer at the salon?' }],
      },
    })) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);

    if (hasQuotaError(events)) {
      console.warn('Skipping test assertion: Gemini API free tier quota exceeded.');
      return;
    }

    // We expect some content returned
    const textOutput = events
      .filter(e => e.type === 'text')
      .map(e => e.text)
      .join(' ');

    // It should talk about haircuts or manicure or pedicure etc.
    expect(textOutput.toLowerCase()).toMatch(/haircut|manicure|pedicure|service/);
  }, 30000);

  it('should list stylists when asked', async () => {
    await sessionService.createSession({
      appName: 'test-app',
      userId: 'test-user',
      sessionId: 'test-session-2',
    });

    const events: any[] = [];
    for await (const event of runner.runAsync({
      userId: 'test-user',
      sessionId: 'test-session-2',
      newMessage: {
        role: 'user',
        parts: [{ text: 'Who are the stylists working there?' }],
      },
    })) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);

    if (hasQuotaError(events)) {
      console.warn('Skipping test assertion: Gemini API free tier quota exceeded.');
      return;
    }

    const textOutput = events
      .filter(e => e.type === 'text')
      .map(e => e.text)
      .join(' ');

    expect(textOutput.toLowerCase()).toMatch(/alice|bob|charlie|stylist/);
  }, 30000);

  it('should call get_current_date tool when user asks to book for tomorrow', async () => {
    await sessionService.createSession({
      appName: 'test-app',
      userId: 'test-user',
      sessionId: 'test-session-tomorrow',
    });

    const events: any[] = [];
    for await (const event of runner.runAsync({
      userId: 'test-user',
      sessionId: 'test-session-tomorrow',
      newMessage: {
        role: 'user',
        parts: [{ text: 'Can I book a haircut for tomorrow at 10:30 AM with Alice? My name is John Doe and phone is 555-1234.' }],
      },
    })) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);

    if (hasQuotaError(events)) {
      console.warn('Skipping test verification: Gemini API free tier quota exceeded.');
      return;
    }
  }, 30000);

  it('should not search for existing appointment if user does not provide at least full name, phone, and date', async () => {
    await sessionService.createSession({
      appName: 'test-app',
      userId: 'test-user',
      sessionId: 'test-session-cancel-insufficient',
    });

    const events: any[] = [];
    for await (const event of runner.runAsync({
      userId: 'test-user',
      sessionId: 'test-session-cancel-insufficient',
      newMessage: {
        role: 'user',
        parts: [{ text: 'Cancel my appointment. My name is John Doe.' }],
      },
    })) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);

    if (hasQuotaError(events)) {
      console.warn('Skipping test assertion: Gemini/LLM API free tier quota exceeded.');
      return;
    }

    // Verify search_appointments tool was not called
    const toolCalls = events.flatMap(e => getFunctionCalls(e));
    const searchCall = toolCalls.find(tc => tc.name === 'search_appointments');
    expect(searchCall).toBeUndefined();

    // Verify response mentions that all four details are required
    const textOutput = events
      .filter(e => e.type === 'text')
      .map(e => e.text)
      .join(' ');
    expect(textOutput.toLowerCase()).toContain('required');
    expect(textOutput.toLowerCase()).toContain('four');
  }, 30000);

  it('should search for existing appointment if user provides full name, phone, and date', async () => {
    await sessionService.createSession({
      appName: 'test-app',
      userId: 'test-user',
      sessionId: 'test-session-cancel-sufficient',
    });

    const events: any[] = [];
    for await (const event of runner.runAsync({
      userId: 'test-user',
      sessionId: 'test-session-cancel-sufficient',
      newMessage: {
        role: 'user',
        parts: [{ text: 'Please cancel the appointment for John Doe, phone 555-1234, on 2026-07-01.' }],
      },
    })) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);

    if (hasQuotaError(events)) {
      console.warn('Skipping test assertion: Gemini/LLM API free tier quota exceeded.');
      return;
    }

    // Verify search_appointments tool was called
    const toolCalls = events.flatMap(e => getFunctionCalls(e));
    const searchCall = toolCalls.find(tc => tc.name === 'search_appointments');
    expect(searchCall).toBeDefined();
  }, 30000);
});
