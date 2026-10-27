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
  type PlanillaOperator,
} from "@/lib/planilla";
import { MonthPicker } from "./month-picker";
import { PlanillaBoard } from "./planilla-board";
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
      where: { fecha: { gte: start, lt: endExclusive } },
      orderBy: { fecha: "asc" },
    }),
  ]);

  const shiftsByOperario = new Map<number, PlanillaOperator["shifts"]>();

  for (const turno of turnos) {
    const key = dateKey(turno.fecha);
    if (weekdayOfKey(key) === 0) continue;

    const minutes = Math.max(
      0,
      Math.round((turno.salida.getTime() - turno.entrada.getTime()) / 60_000),
    );
    const shifts = shiftsByOperario.get(turno.operarioId) ?? {};
    shifts[key] = {
      entrada: formatTime(turno.entrada),
      salida: formatTime(turno.salida),
      minutes,
    };
    shiftsByOperario.set(turno.operarioId, shifts);
  }

  const operators: PlanillaOperator[] = operarios
    .map((operario) => ({
      id: operario.id,
      nombre: operario.nombre,
      shifts: shiftsByOperario.get(operario.id) ?? {},
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const days = buildPlanillaDays(mes);
  const weeks = buildPlanillaWeeks(days);

  return (
    <div className="animate-fade-in">
      <div className="print:hidden">
        <PageHeader
          title="Planilla"
          description="Cargá la entrada y la salida de lunes a sábado. Los totales se calculan solos."
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
