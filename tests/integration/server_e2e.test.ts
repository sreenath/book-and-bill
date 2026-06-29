import { config, parse } from 'dotenv';
config();

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../..');

// Load .env vars to pass explicitly to the server subprocess
let dotenvVars: Record<string, string> = {};
try {
  dotenvVars = parse(readFileSync(resolve(rootDir, '.env')));
} catch {
  // .env not present (e.g. CI environment) — env vars are set directly
}

async function waitForServer(url: string, maxRetries = 180): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Wait until apps are loaded
        if (Array.isArray(data) && data.length > 0) {
          return true;
        }
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

const hasApiKey = !!(
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GROQ_API_KEY ||
  process.env.OPENAI_API_KEY ||
  dotenvVars.GEMINI_API_KEY ||
  dotenvVars.GOOGLE_API_KEY ||
  dotenvVars.GOOGLE_GENAI_API_KEY ||
  dotenvVars.GROQ_API_KEY ||
  dotenvVars.OPENAI_API_KEY
);

describe.runIf(hasApiKey)('Server E2E', () => {
  let serverProcess: ChildProcess;
  const baseUrl = 'http://localhost:8000';
  const testSessionId = `s_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  beforeAll(async () => {
    // Pass agent.ts directly to avoid bundling test dependencies
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    serverProcess = spawn(npxCmd, ['@google/adk-devtools', 'api_server', 'app/agent.ts', '--port', '8000'], {
      cwd: rootDir,
      env: { ...process.env, ...dotenvVars },
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });

    // Capture server output for debugging
    const serverOutput: string[] = [];
    serverProcess.stdout?.on('data', (data: Buffer) => serverOutput.push(data.toString()));
    serverProcess.stderr?.on('data', (data: Buffer) => serverOutput.push(data.toString()));
    serverProcess.on('exit', (code: number | null) => {
      if (code !== null && code !== 0) {
        console.log('Server exited with code:', code);
        console.log('Server output:', serverOutput.join(''));
      }
    });

    // Wait for server to be ready with retries
    const ready = await waitForServer(`${baseUrl}/list-apps`);
    if (!ready) {
      console.log('Server output:', serverOutput.join(''));
      throw new Error('Server failed to start');
    }
  }, 90000);

  afterAll(() => {
    serverProcess?.kill();
  });

  it('should create a session', async () => {
    // App name is "agent" (filename without extension)
    const response = await fetch(
      `${baseUrl}/apps/agent/users/u_123/sessions/${testSessionId}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
    );
    if (!response.ok) {
      console.log('Session creation failed:', response.status, await response.text());
    }
    expect(response.ok).toBe(true);
  });

  it('should run agent via /run endpoint', async () => {
    const response = await fetch(`${baseUrl}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: 'agent',
        userId: 'u_123',
        sessionId: testSessionId,
        newMessage: {
          role: 'user',
          parts: [{ text: 'What services do you offer?' }],
        },
      }),
    });
    if (!response.ok) {
      console.log('Run endpoint failed:', response.status, await response.text());
    }
    expect(response.ok).toBe(true);
    const events = await response.json();
    expect(events.length).toBeGreaterThan(0);
  }, 30000);
});
