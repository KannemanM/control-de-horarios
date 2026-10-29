import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import {
  dateKey,
  formatTime,
  isValidMonthKey,
  monthKeyOf,
  monthRange,
  weekdayOfKey,
} from "@/lib/time";
import {
  buildPlanillaDays,
  buildPlanillaWeeks,
  buildDayData,
  type PlanillaOperator,
} from "@/lib/planilla";
import { PlanillaBoard } from "./planilla-board";
import { MonthPicker } from "./month-picker";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planilla" };

export default async function PlanillaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  await requireSession();

  const params = await searchParams;
  const mesParam = Array.isArray(params.mes) ? params.mes[0] : params.mes;
  const mes = isValidMonthKey(mesParam) ? mesParam : monthKeyOf(new Date());
  const { start, endExclusive } = monthRange(mes);

  const [operarios, turnos] = await Promise.all([
    prisma.operario.findMany(),
    prisma.turno.findMany({
      where: {
        fecha: { gte: start, lt: endExclusive },
      },
      orderBy: [{ operarioId: "asc" }, { fecha: "asc" }, { secuencia: "asc" }],
    }),
  ]);

  // Agrupar turnos por operario y fecha
  const shiftsByOperario = new Map<
    number,
    Map<string, Array<NonNullable<Parameters<typeof buildDayData>[0]>[0]>>
  >();

  for (const operario of operarios) {
    shiftsByOperario.set(operario.id, new Map());
  }

  for (const turno of turnos) {
    const key = dateKey(turno.fecha);
    if (weekdayOfKey(key) === 0) continue;

    const byFecha = shiftsByOperario.get(turno.operarioId);
    if (!byFecha) continue;

    const lista = byFecha.get(key) ?? [];
    lista.push({
      id: turno.id,
      tipo: turno.tipo,
      secuencia: turno.secuencia ?? undefined,
      entrada: turno.entrada,
      salida: turno.salida,
      horasExtras: turno.horasExtras,
    });
    byFecha.set(key, lista);
  }

  const operators: PlanillaOperator[] = operarios
    .map((operario) => {
      const byFecha = shiftsByOperario.get(operario.id) ?? new Map();
      const shifts: Record<string, NonNullable<ReturnType<typeof buildDayData>>> = {};

      for (const [key, turnosDelDia] of byFecha.entries()) {
        shifts[key] = buildDayData(turnosDelDia);
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

  return (
    <div className="animate-fade-in">
      <div className="print:hidden">
        <PageHeader
          title="Planilla"
          description="Cargá horarios de entrada y salida por turno, más horas extras. Los totales se calculan solos."
          actions={
            <>
              <MonthPicker month={mes} />
              <PrintButton />
            </>
          }
        />
      </div>

      <PlanillaBoard
        key={mes}
        month={mes}
        initialOperators={operators}
        weeks={weeks}
      />
    </div>
  );
}
