import { BusinessConfig } from './types.js';

export const business2Config: BusinessConfig = {
  id: 'business_2',
  name: "Ray's saloon",
  welcomeMessage: "Welcome to Ray's saloon. How can I help you?",
  bookingWindowMonths: 6,
  operatingDays: [1, 2, 3, 4, 5], // Weekdays only
  operatingDaysDescription: 'weekdays only (Monday to Friday)',
  services: [
    { id: 'massage', name: 'Full Body Massage', price: 100, durationMinutes: 60 },
    { id: 'makeup', name: 'Professional Makeup', price: 75, durationMinutes: 45 },
  ],
  stylists: [
    { id: 'david', name: 'David Miller', specialties: ['massage'] },
    { id: 'eva', name: 'Eva Green', specialties: ['makeup'] },
  ],
};
