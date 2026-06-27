import * as fs from 'fs';
import * as path from 'path';

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface Stylist {
  id: string;
  name: string;
  specialties: string[];
}

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

export const SERVICES: Service[] = [
  { id: 'haircut', name: 'Haircut & Styling', price: 35, durationMinutes: 30 },
  { id: 'coloring', name: 'Hair Coloring', price: 85, durationMinutes: 90 },
  { id: 'manicure', name: 'Manicure', price: 25, durationMinutes: 30 },
  { id: 'pedicure', name: 'Pedicure', price: 40, durationMinutes: 45 },
  { id: 'facial', name: 'Facial & Skin Care', price: 60, durationMinutes: 60 },
];

export const STYLISTS: Stylist[] = [
  { id: 'alice', name: 'Alice Smith', specialties: ['haircut', 'coloring'] },
  { id: 'bob', name: 'Bob Jones', specialties: ['haircut'] },
  { id: 'charlie', name: 'Charlie Brown', specialties: ['manicure', 'pedicure', 'facial'] },
];

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'appointments.json');

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
