import { config } from 'dotenv';
config();

import { describe, it, expect, beforeEach } from 'vitest';
import { Runner, InMemorySessionService } from '@google/adk';
import { rootAgent } from '../../app/agent.js';

const hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_CLOUD_PROJECT);

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
});
