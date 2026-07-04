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

export interface Invoice {
  id: string; // INV-XXXX
  appointmentId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  price: number;
  tax: number;
  total: number;
  date: string;
}

export interface Quote {
  id: string; // QT-XXXX
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  price: number;
  tax: number;
  total: number;
  date: string;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
const suffix = isTest ? '_test' : '';
const DB_FILE = path.join(DB_DIR, `appointments_${ACTIVE_CONFIG.id}${suffix}.json`);
const INV_FILE = path.join(DB_DIR, `invoices_${ACTIVE_CONFIG.id}${suffix}.json`);
const QT_FILE = path.join(DB_DIR, `quotes_${ACTIVE_CONFIG.id}${suffix}.json`);

function ensureFileExists(filePath: string) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
  }
}

function ensureDbExists() {
  ensureFileExists(DB_FILE);
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
  fs.writeFileSync(INV_FILE, JSON.stringify([], null, 2), 'utf-8');
  fs.writeFileSync(QT_FILE, JSON.stringify([], null, 2), 'utf-8');
}

export function saveAppointments(appointments: Appointment[]): void {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(appointments, null, 2), 'utf-8');
}

export function getInvoices(): Invoice[] {
  ensureFileExists(INV_FILE);
  try {
    const data = fs.readFileSync(INV_FILE, 'utf-8');
    return JSON.parse(data) as Invoice[];
  } catch (err) {
    console.error('Failed to read invoices:', err);
    return [];
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  ensureFileExists(INV_FILE);
  fs.writeFileSync(INV_FILE, JSON.stringify(invoices, null, 2), 'utf-8');
}

export function getQuotes(): Quote[] {
  ensureFileExists(QT_FILE);
  try {
    const data = fs.readFileSync(QT_FILE, 'utf-8');
    return JSON.parse(data) as Quote[];
  } catch (err) {
    console.error('Failed to read quotes:', err);
    return [];
  }
}

export function saveQuotes(quotes: Quote[]): void {
  ensureFileExists(QT_FILE);
  fs.writeFileSync(QT_FILE, JSON.stringify(quotes, null, 2), 'utf-8');
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
