import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
}

export function formatDate(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    return 'Invalid date';
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
}

export function getMonthYear(date: string | Date): string {
  return formatDate(date, 'MMMM yyyy');
}
