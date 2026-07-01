import { describe, it, expect } from 'vitest';
import {
  isDateWithinBookingWindow,
  isOperatingDay,
  getNextOperatingDay,
} from './validation.js';

describe('Validation Helpers', () => {
  describe('isDateWithinBookingWindow', () => {
    it('should validate dates within the booking window', () => {
      // Let's pass a fixed anchor date: 2026-07-01
      const anchorDate = new Date('2026-07-01T00:00:00');

      // 1 month window
      expect(isDateWithinBookingWindow('2026-07-15', 1, anchorDate)).toBe(true);
      expect(isDateWithinBookingWindow('2026-08-01', 1, anchorDate)).toBe(true);
      expect(isDateWithinBookingWindow('2026-08-02', 1, anchorDate)).toBe(false);

      // 6 months window
      expect(isDateWithinBookingWindow('2026-12-15', 6, anchorDate)).toBe(true);
      expect(isDateWithinBookingWindow('2027-01-01', 6, anchorDate)).toBe(true);
      expect(isDateWithinBookingWindow('2027-01-02', 6, anchorDate)).toBe(false);
    });
  });

  describe('isOperatingDay', () => {
    it('should return true for operating days and false for non-operating days', () => {
      const weekdaysOnly = [1, 2, 3, 4, 5];

      // 2026-07-01 is Wednesday (operating)
      expect(isOperatingDay('2026-07-01', weekdaysOnly)).toBe(true);
      // 2026-07-04 is Saturday (non-operating)
      expect(isOperatingDay('2026-07-04', weekdaysOnly)).toBe(false);
      // 2026-07-05 is Sunday (non-operating)
      expect(isOperatingDay('2026-07-05', weekdaysOnly)).toBe(false);
      // 2026-07-06 is Monday (operating)
      expect(isOperatingDay('2026-07-06', weekdaysOnly)).toBe(true);
    });
  });

  describe('getNextOperatingDay', () => {
    it('should find the next operating day correctly', () => {
      const weekdaysOnly = [1, 2, 3, 4, 5];

      // Saturday 2026-07-04 -> Next is Monday 2026-07-06
      expect(getNextOperatingDay('2026-07-04', weekdaysOnly)).toBe('2026-07-06');

      // Sunday 2026-07-05 -> Next is Monday 2026-07-06
      expect(getNextOperatingDay('2026-07-05', weekdaysOnly)).toBe('2026-07-06');
    });
  });
});
