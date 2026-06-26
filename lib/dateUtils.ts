/**
 * Validates if a date string is in DD/MM/YYYY format
 */
export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateStr)) return false;

  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Validates a batch date with specific error messages for formats and logical limits
 */
export function validateBatchDate(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr) return { isValid: false, error: 'Date is required' };
  
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(regex);
  if (!match) return { isValid: false, error: 'Invalid date format' };

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);

  if (month < 1 || month > 12) return { isValid: false, error: 'Invalid date' };
  if (year < 1) return { isValid: false, error: 'Invalid date' };

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (isLeapYear) daysInMonth[1] = 29;

  if (day < 1 || day > daysInMonth[month - 1]) return { isValid: false, error: 'Invalid date' };

  return { isValid: true };
}

/**
 * Converts YYYY-MM-DD to DD/MM/YYYY
 */
export function formatToDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  // If it's already DD/MM/YYYY, return it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Converts DD/MM/YYYY to ISO string for storage
 */
export function parseToISODate(dateStr: string): string {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toISOString();
}

/**
 * Formats a date object or ISO string to DD/MM/YYYY
 */
export function formatDDMMYYYY(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Checks if first date is before or equal to second date
 * Dates are in DD/MM/YYYY format
 */
export function isBeforeOrEqual(dateStr1: string, dateStr2: string): boolean {
  const [d1, m1, y1] = dateStr1.split('/').map(Number);
  const [d2, m2, y2] = dateStr2.split('/').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  return date1 <= date2;
}
