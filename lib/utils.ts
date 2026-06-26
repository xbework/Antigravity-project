export function formatDateToUI(dateString: string | undefined): string {
  if (!dateString) return '';
  // Handle ISO or YYYY-MM-DD
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatDOBToPassword(dobString: string | undefined): string {
  if (!dobString) return '';
  // Expected YYYY-MM-DD from storage
  const parts = dobString.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  return `${d}${m}${y}`;
}

export function parseUIDateToISO(uiDate: string | undefined): string {
  if (!uiDate) return '';
  const separator = uiDate.includes('-') ? '-' : '/';
  const parts = uiDate.split(separator);
  if (parts.length !== 3) return uiDate;
  const [d, m, y] = parts;
  return `${y}-${m}-${d}`;
}

export function validateDOB(dob: string): { isValid: boolean; error?: string } {
  if (!dob) return { isValid: false, error: 'Date of birth is required' };
  
  // Format check: DD-MM-YYYY
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dob.match(regex);
  
  if (!match) {
    return { isValid: false, error: 'Invalid date format (use DD-MM-YYYY)' };
  }

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month (must be between 1 and 12)' };
  }

  if (year < 1900 || year > new Date().getFullYear()) {
    return { isValid: false, error: 'Invalid year' };
  }

  // Day validation based on month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Leap year logic
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (isLeapYear) {
    daysInMonth[1] = 29;
  }

  if (day < 1 || day > daysInMonth[month - 1]) {
    if (month === 2 && !isLeapYear && day === 29) {
      return { isValid: false, error: 'February cannot have more than 28 days in this year' };
    }
    if (month === 2 && isLeapYear && day > 29) {
      return { isValid: false, error: 'Invalid leap year date' };
    }
    return { isValid: false, error: 'Invalid day for the selected month' };
  }

  return { isValid: true };
}

export function validateDateStrict(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr) return { isValid: false, error: 'Date is required' };
  
  // Format check: DD-MM-YYYY
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.match(regex);
  
  if (!match) {
    return { isValid: false, error: 'Invalid date format' };
  }

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid date' };
  }

  if (year < 1) {
    return { isValid: false, error: 'Invalid date' };
  }

  // Day validation based on month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Leap year logic
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (isLeapYear) {
    daysInMonth[1] = 29;
  }

  if (day < 1 || day > daysInMonth[month - 1]) {
    return { isValid: false, error: 'Invalid date' };
  }

  // Future date check
  const inputDate = new Date(year, month - 1, day);
  const now = new Date();
  // Reset time for strict date comparison
  now.setHours(0, 0, 0, 0);
  if (inputDate > now) {
    return { isValid: false, error: 'Future dates not allowed' };
  }

  return { isValid: true };
}

export function parseUIDateTimeToISO(uiDateTime: string | undefined): string {
  if (!uiDateTime) return '';
  const [datePart, timePart] = uiDateTime.split(' ');
  if (!datePart) return uiDateTime;
  const isoDate = parseUIDateToISO(datePart);
  return timePart ? `${isoDate}T${timePart}` : isoDate;
}
