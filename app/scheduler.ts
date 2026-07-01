import * as fs from 'fs';
import * as path from 'path';
import { SERVICES as configServices, STYLISTS as configStylists, ACTIVE_CONFIG } from './config/business-config.js';
import { Service, Stylist } from './config/types.js';

export { Service, Stylist };

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  stylistId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
}

export const SERVICES: Service[] = configServices;
export const STYLISTS: Stylist[] = configStylists;

const DB_DIR = path.resolve(process.cwd(), 'data');
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
const suffix = isTest ? '_test' : '';
const DB_FILE = path.join(DB_DIR, `appointments_${ACTIVE_CONFIG.id}${suffix}.json`);

function ensureDbExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAppointments(): Appointment[] {
  ensureDbExists();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as Appointment[];
  } catch (err) {
    console.error('Failed to read appointments:', err);
    return [];
  }
}

export const DB_FILE_PATH = DB_FILE;

export function clearDatabase(): void {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
}

export function saveAppointments(appointments: Appointment[]): void {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(appointments, null, 2), 'utf-8');
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
