import { prisma } from "./db";
import {
  dateKey,
  monthRange,
  weekdayOfKey,
} from "./time";
import {
  buildDayData,
  buildPlanillaDays,
  buildPlanillaWeeks,
  type PlanillaDay,
  type PlanillaOperator,
  type PlanillaWeek,
} from "./planilla";

type TurnoInput = Parameters<typeof buildDayData>[0][number];

export type PlanillaMonthData = {
  month: string;
  days: PlanillaDay[];
  weeks: PlanillaWeek[];
  operators: PlanillaOperator[];
};

/**
 * Carga todo lo necesario para mostrar o exportar un mes de la planilla.
 * Los domingos se descartan, igual que en la pantalla y la impresión.
 */
export async function getPlanillaMonth(
  mes: string,
): Promise<PlanillaMonthData> {
  const { start, endExclusive } = monthRange(mes);

  const [operarios, turnos, observaciones] = await Promise.all([
    prisma.operario.findMany({
      where: {
        AND: [
          { OR: [{ fechaAlta: null }, { fechaAlta: { lt: endExclusive } }] },
          { OR: [{ fechaBaja: null }, { fechaBaja: { gte: start } }] },
        ],
      },
    }),
    prisma.turno.findMany({
      where: { fecha: { gte: start, lt: endExclusive } },
      orderBy: [
        { operarioId: "asc" },
        { fecha: "asc" },
        { secuencia: "asc" },
      ],
    }),
    prisma.observacionDia.findMany({
      where: { fecha: { gte: start, lt: endExclusive } },
    }),
  ]);

  // Agrupar turnos por operario y fecha
  const shiftsByOperario = new Map<number, Map<string, TurnoInput[]>>();
  for (const operario of operarios) {
    shiftsByOperario.set(operario.id, new Map());
  }

  for (const turno of turnos) {
    const key = dateKey(turno.fecha);
    if (weekdayOfKey(key) === 0) continue;

    const byFecha = shiftsByOperario.get(turno.operarioId);
    if (!byFecha) continue;

    const lista = byFecha.get(key) ?? [];
    lista.push(turno);
    byFecha.set(key, lista);
  }

  // Observaciones por operario y fecha (pueden existir sin turnos cargados)
  const observacionesByOperario = new Map<number, Map<string, string>>();
  for (const observacion of observaciones) {
    const key = dateKey(observacion.fecha);
    if (weekdayOfKey(key) === 0) continue;

    let byFecha = observacionesByOperario.get(observacion.operarioId);
    if (!byFecha) {
      byFecha = new Map();
      observacionesByOperario.set(observacion.operarioId, byFecha);
    }
    byFecha.set(key, observacion.texto);
  }

  const operators: PlanillaOperator[] = operarios
    .map((operario) => {
      const byFecha = shiftsByOperario.get(operario.id) ?? new Map();
      const obsByFecha = observacionesByOperario.get(operario.id) ?? new Map();
      const shifts: PlanillaOperator["shifts"] = {};

      const fechas = new Set([...byFecha.keys(), ...obsByFecha.keys()]);
      for (const key of fechas) {
        shifts[key] = buildDayData(byFecha.get(key) ?? [], obsByFecha.get(key));
      }

      return {
        id: operario.id,
        nombre: operario.nombre,
        shifts,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const days = buildPlanillaDays(mes);
  const weeks = buildPlanillaWeeks(days);

  return { month: mes, days, weeks, operators };
}
