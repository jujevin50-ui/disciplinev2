export function today(): string {
  const d = new Date();
  return formatDate(d);
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateFromStr(s: string): Date {
  return new Date(s + 'T00:00:00');
}

export function addDays(dateStr: string, n: number): string {
  const d = dateFromStr(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

// Returns 0=Mon, 1=Tue, ..., 6=Sun
export function getDow(dateStr: string): number {
  const d = dateFromStr(dateStr);
  return (d.getDay() + 6) % 7;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// First day of month: 0=Mon offset
export function getMonthStartDow(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKDAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function getMonthName(month: number): string {
  return MONTHS_FR[month];
}

export function getDayShort(dow: number): string {
  return DAYS_SHORT[dow];
}

export function getDayFull(dow: number): string {
  return WEEKDAYS_FR[dow];
}

export function formatDisplayDate(dateStr: string): string {
  const d = dateFromStr(dateStr);
  const dow = DAYS_FR[(d.getDay() + 6) % 7];
  return `${dow} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS_FR[month]} ${year}`;
}

export function uid(): string {
  return crypto.randomUUID();
}
