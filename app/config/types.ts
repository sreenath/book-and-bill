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

export interface BusinessConfig {
  id: string;
  name: string;
  welcomeMessage: string;
  bookingWindowMonths: number;
  operatingDays: number[]; // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  operatingDaysDescription: string; // e.g., "all days" or "weekdays only (Monday to Friday)"
  services: Service[];
  stylists: Stylist[];
}
