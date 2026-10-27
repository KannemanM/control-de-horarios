import {
  formatDateKeyShort,
  isWeekendKey,
  monthDays,
  parseHM,
  startOfWeekKey,
  todayKey,
  weekdayOfKey,
} from "./time";

export type PlanillaShift = {
  entrada: string;
  salida: string;
  minutes: number;
};

export type PlanillaOperator = {
  id: number;
  nombre: string;
  shifts: Record<string, PlanillaShift>;
};

export type PlanillaDay = {
  key: string;
  label: string;
  weekday: number;
  isWeekend: boolean;
  isToday: boolean;
};

export type PlanillaWeek = {
  key: string;
  label: string;
  days: PlanillaDay[];
};

/** Minutos entre dos horas "HH:MM". Si la salida es menor, cuenta como turno nocturno. */
export function minutesBetweenTimes(
  entrada: string,
  salida: string,
): number | null {
  const start = parseHM(entrada);
  const end = parseHM(salida);
  if (start === null || end === null) return null;
  if (start === end) return 0;
  return end > start ? end - start : end + 1440 - start;
}

/**
 * Acepta 9, 09, 900, 0900, 9:00, 09:00 y devuelve siempre "HH:MM".
 * Devuelve "" si está vacío y null si el valor no es una hora válida.
 */
export function normalizeTimeInput(value: string): string | null {
  const raw = value.trim();
  if (!raw) return "";

  const cleaned = raw.replace(/[^\d:]/g, "");
  if (!cleaned) return null;

  let hours: number;
  let minutes: number;

  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    if (parts.length > 2) return null;
    const [hourPart, minutePart = "0"] = parts;
    if (!/^\d{1,2}$/.test(hourPart) || !/^\d{0,2}$/.test(minutePart)) {
      return null;
    }
    hours = Number(hourPart);
    minutes = Number(minutePart || "0");
  } else {
    if (!/^\d{1,4}$/.test(cleaned)) return null;
    if (cleaned.length <= 2) {
      hours = Number(cleaned);
      minutes = 0;
    } else {
      hours = Number(cleaned.slice(0, cleaned.length - 2));
      minutes = Number(cleaned.slice(-2));
    }
  }

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Formato de planilla: 8:00, 40:00, 143:30. */
export function formatHours(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

export function buildPlanillaDays(monthKey: string): PlanillaDay[] {
  const today = todayKey();
  return monthDays(monthKey)
    .filter((key) => weekdayOfKey(key) !== 0)
    .map((key) => ({
      key,
      label: formatDateKeyShort(key),
      weekday: weekdayOfKey(key),
      isWeekend: isWeekendKey(key),
      isToday: key === today,
    }));
}

export function buildPlanillaWeeks(days: PlanillaDay[]): PlanillaWeek[] {
  const weeks: PlanillaWeek[] = [];
  const byStart = new Map<string, PlanillaWeek>();

  for (const day of days) {
    const weekStart = startOfWeekKey(day.key);
    let week = byStart.get(weekStart);
    if (!week) {
      week = { key: weekStart, label: "", days: [] };
      byStart.set(weekStart, week);
      weeks.push(week);
    }
    week.days.push(day);
  }

  weeks.forEach((week, index) => {
    const first = week.days[0];
    const last = week.days[week.days.length - 1];
    if (!first || !last) return;
    const month = first.key.slice(5, 7);
    const from = first.key.slice(8);
    const to = last.key.slice(8);
    const range = from === to ? `${from}/${month}` : `${from}–${to}/${month}`;
    week.label = `Semana ${index + 1} · ${range}`;
  });

  return weeks;
}

export function totalForWeek(
  shifts: Record<string, PlanillaShift>,
  week: PlanillaWeek,
): number {
  return week.days.reduce(
    (acc, day) => acc + (shifts[day.key]?.minutes ?? 0),
    0,
  );
}

export function totalForOperator(shifts: Record<string, PlanillaShift>): number {
  return Object.values(shifts).reduce((acc, shift) => acc + shift.minutes, 0);
}

export function countShifts(shifts: Record<string, PlanillaShift>): number {
  return Object.keys(shifts).length;
}
