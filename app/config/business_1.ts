import { BusinessConfig } from './types.js';

export const business1Config: BusinessConfig = {
  id: 'business_1',
  name: 'Tony & Guy Saloon',
  welcomeMessage: 'Welcome to Tony & Guy Saloon',
  bookingWindowMonths: 1,
  operatingDays: [0, 1, 2, 3, 4, 5, 6], // All days
  operatingDaysDescription: 'all days (Sunday to Saturday)',
  services: [
    { id: 'haircut', name: 'Haircut & Styling', price: 35, durationMinutes: 30 },
    { id: 'coloring', name: 'Hair Coloring', price: 85, durationMinutes: 90 },
    { id: 'manicure', name: 'Manicure', price: 25, durationMinutes: 30 },
    { id: 'pedicure', name: 'Pedicure', price: 40, durationMinutes: 45 },
    { id: 'facial', name: 'Facial & Skin Care', price: 60, durationMinutes: 60 },
  ],
  stylists: [
    { id: 'alice', name: 'Alice Smith', specialties: ['haircut', 'coloring'] },
    { id: 'bob', name: 'Bob Jones', specialties: ['haircut'] },
    { id: 'charlie', name: 'Charlie Brown', specialties: ['manicure', 'pedicure', 'facial'] },
  ],
};
