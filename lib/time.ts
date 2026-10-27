/**
 * Utilidades de fecha y hora para Argentina (UTC-3, sin horario de verano).
 * Todas las fechas se guardan en UTC y se muestran siempre en hora local.
 */

export const ART_OFFSET_MIN = -180;
const MS_MIN = 60_000;
const MS_DAY = 86_400_000;

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Descompone un instante en partes de fecha/hora de Argentina. */
export function artParts(date: Date): DateParts {
  const shifted = new Date(date.getTime() + ART_OFFSET_MIN * MS_MIN);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** Construye un instante UTC a partir de una fecha/hora de Argentina. */
export function artDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - ART_OFFSET_MIN * MS_MIN);
}

/** "YYYY-MM-DD" en hora Argentina. */
export function dateKey(date: Date): string {
  const p = artParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return artDate(year, month, day);
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function monthKeyOf(date: Date): string {
  const p = artParts(date);
  return `${p.year}-${pad(p.month)}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

export function isValidMonthKey(key: string | undefined | null): key is string {
  return !!key && /^\d{4}-(0[1-9]|1[0-2])$/.test(key);
}

export function monthLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  const name = MESES[month - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export function monthShortLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  return `${MESES[month - 1]?.slice(0, 3)} ${year}`;
}

export function shiftMonthKey(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function daysInMonth(key: string): number {
  const { year, month } = parseMonthKey(key);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Todas las claves "YYYY-MM-DD" del mes. */
export function monthDays(key: string): string[] {
  const { year, month } = parseMonthKey(key);
  const total = daysInMonth(key);
  return Array.from({ length: total }, (_, i) =>
    `${year}-${pad(month)}-${pad(i + 1)}`,
  );
}

export function monthRange(key: string): { start: Date; endExclusive: Date } {
  const { year, month } = parseMonthKey(key);
  return {
    start: artDate(year, month, 1),
    endExclusive: artDate(year, month + 1, 1),
  };
}

export function addDaysKey(key: string, days: number): string {
  const date = dateFromKey(key);
  return dateKey(new Date(date.getTime() + days * MS_DAY));
}

export function weekdayOfKey(key: string): number {
  return artParts(dateFromKey(key)).weekday;
}

/** Lunes de la semana a la que pertenece la fecha. */
export function startOfWeekKey(key: string): string {
  const weekday = weekdayOfKey(key);
  const diff = (weekday + 6) % 7;
  return addDaysKey(key, -diff);
}

export function formatTime(date: Date | null | undefined): string {
  if (!date) return "—";
  const p = artParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatDateNumeric(date: Date): string {
  const p = artParts(date);
  return `${pad(p.day)}/${pad(p.month)}/${p.year}`;
}

export function formatDateShort(date: Date): string {
  const p = artParts(date);
  return `${DIAS_CORTOS[p.weekday]} ${pad(p.day)}/${pad(p.month)}`;
}

export function formatDateKeyShort(key: string): string {
  return formatDateShort(dateFromKey(key));
}

export function formatDateKeyLong(key: string): string {
  const p = artParts(dateFromKey(key));
  const day = DIAS[p.weekday] ?? "";
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${p.day} de ${MESES[p.month - 1]} de ${p.year}`;
}

export function weekdayShort(weekday: number): string {
  return DIAS_CORTOS[weekday] ?? "";
}

export function weekdayName(weekday: number): string {
  return DIAS[weekday] ?? "";
}

export function isWeekendKey(key: string): boolean {
  const w = weekdayOfKey(key);
  return w === 0 || w === 6;
}

/** "09:30" -> minutos desde las 00:00. */
export function parseHM(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToHM(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

/** Combina una fecha "YYYY-MM-DD" con una hora "HH:MM" en hora Argentina. */
export function combineDateAndTime(key: string, time: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return artDate(year, month, day, hour, minute);
}

export function nowTime(): string {
  return formatTime(new Date());
}

export function greeting(): string {
  const hour = artParts(new Date()).hour;
  if (hour < 12) return "Buen día";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}
