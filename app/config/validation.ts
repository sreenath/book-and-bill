export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function isDateWithinBookingWindow(dateStr: string, windowMonths: number, today: Date = new Date()): boolean {
  const requestedDate = parseLocalDate(dateStr);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const maxDate = new Date(todayMidnight.getFullYear(), todayMidnight.getMonth() + windowMonths, todayMidnight.getDate(), 0, 0, 0, 0);
  return requestedDate >= todayMidnight && requestedDate <= maxDate;
}

export function isOperatingDay(dateStr: string, operatingDays: number[]): boolean {
  const requestedDate = parseLocalDate(dateStr);
  return operatingDays.includes(requestedDate.getDay());
}

export function getNextOperatingDay(dateStr: string, operatingDays: number[]): string {
  const requestedDate = parseLocalDate(dateStr);
  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate() + i, 0, 0, 0, 0);
    if (operatingDays.includes(nextDate.getDay())) {
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return dateStr;
}
