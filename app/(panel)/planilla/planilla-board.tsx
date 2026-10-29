"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { avatarColor, cn } from "@/lib/utils";
import { monthLabel } from "@/lib/time";
import {
  countTurnos,
  formatExtraHours,
  formatHours,
  totalForOperator,
  totalForWeek,
  type PlanillaDay,
  type PlanillaDayData,
  type PlanillaOperator,
  type PlanillaWeek,
} from "@/lib/planilla";
import { DiaModal } from "./dia-modal";

type Filter = "todos" | number;

const WEEKDAYS = [
  { weekday: 1, label: "Lunes" },
  { weekday: 2, label: "Martes" },
  { weekday: 3, label: "Miércoles" },
  { weekday: 4, label: "Jueves" },
  { weekday: 5, label: "Viernes" },
  { weekday: 6, label: "Sábado" },
] as const;

function dateLabel(day: PlanillaDay) {
  return `${day.key.slice(8)}/${day.key.slice(5, 7)}`;
}

function turnoLabel(turno: { entrada?: string; salida?: string }): string {
  if (!turno.entrada && !turno.salida) return "—";
  const e = turno.entrada ?? "--:--";
  const s = turno.salida ?? "--:--";
  return `${e}-${s}`;
}

export function PlanillaBoard({
  month,
  initialOperators,
  weeks,
}: {
  month: string;
  initialOperators: PlanillaOperator[];
  weeks: PlanillaWeek[];
}) {
  const [operators, setOperators] = useState(initialOperators);
  const [filter, setFilter] = useState<Filter>("todos");
  const [modal, setModal] = useState<{
    operarioId: number;
    operarioNombre: string;
    fecha: string;
    datos?: {
      mañana?: { entrada: string; salida: string };
      tarde?: { entrada: string; salida: string };
      horasExtras?: number;
    };
  } | null>(null);

  const effectiveFilter: Filter =
    filter !== "todos" && !operators.some((operator) => operator.id === filter)
      ? "todos"
      : filter;

  const visibleOperators =
    effectiveFilter === "todos"
      ? operators
      : operators.filter((operator) => operator.id === effectiveFilter);

  const summary = useMemo(() => {
    let total = 0;
    let turnos = 0;
    for (const operator of visibleOperators) {
      total += totalForOperator(operator.shifts);
      turnos += countTurnos(operator.shifts);
    }
    return { total, turnos };
  }, [visibleOperators]);

  const resumenExtras = useMemo(() => {
    let extra = 0;
    for (const operator of visibleOperators) {
      for (const day of Object.values(operator.shifts)) {
        extra += day.extraMinutes;
      }
    }
    return extra;
  }, [visibleOperators]);

  function abrirModal(
    operarioId: number,
    operarioNombre: string,
    fecha: string,
  ) {
    const operario = operators.find((o) => o.id === operarioId);
    const dayData = operario?.shifts[fecha];
    setModal({
      operarioId,
      operarioNombre,
      fecha,
      datos: dayData
        ? {
            mañana: dayData.turnos.find((t) => t.tipo === "ORDINARIO" && t.secuencia === 1)
              ? { entrada: dayData.turnos.find((t) => t.tipo === "ORDINARIO" && t.secuencia === 1)!.entrada ?? "", salida: dayData.turnos.find((t) => t.tipo === "ORDINARIO" && t.secuencia === 1)!.salida ?? "" }
              : undefined,
            tarde: dayData.turnos.find((t) => t.tipo === "ORDINARIO" && t.secuencia === 2)
              ? { entrada: dayData.turnos.find((t) => t.tipo === "ORDINARIO" && t.secuencia === 2)!.entrada ?? "", salida: dayData.turnos.find((t) => t.tipo === "ORDINARIO" && t.secuencia === 2)!.salida ?? "" }
              : undefined,
            horasExtras: dayData.extraMinutes ?? undefined,
          }
        : undefined,
    });
  }

  function handleSaved(operarioId: number, fecha: string) {
    setOperators((current) =>
      current.map((operator) => {
        if (operator.id !== operarioId) return operator;
        // El cliente no tiene los nuevos datos directamente; se recargan del server vía revalidatePath en la acción.
        // Pero para optimismo, podríamos dejar el estado igual y confiar en el revalidate.
        return operator;
      }),
    );
    setModal(null);
  }

  if (operators.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Todavía no hay operarios"
          description="Agregá el primero para empezar a cargar horarios en la planilla."
          action={
            <Link href="/operarios" className="btn-primary">
              Agregar operario
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
      <div className="card-header gap-3 print:hidden">
        <label className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
            Operario
          </span>
          <select
            value={String(effectiveFilter)}
            onChange={(event) => {
              const value = event.target.value;
              setFilter(value === "todos" ? "todos" : Number(value));
            }}
            className="input h-9 w-auto min-w-[190px] py-1.5 text-[13px] font-medium"
            aria-label="Filtrar por operario"
          >
            <option value="todos">Todos los operarios</option>
            {operators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.nombre}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Total del mes
            </p>
            <p className="text-xl font-bold leading-tight tabular-nums text-ink-900">
              {formatHours(summary.total)}
            </p>
          </div>
          {resumenExtras > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
                Horas extras
              </p>
              <p className="text-xl font-bold leading-tight tabular-nums text-brand-700">
                {formatHours(resumenExtras)}
              </p>
            </div>
          )}
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Turnos
            </p>
            <p className="text-xl font-bold leading-tight tabular-nums text-ink-900">
              {summary.turnos}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden px-1 pb-2 print:block">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">
              Planilla de horarios
            </p>
            <h2 className="mt-0.5 text-[22px] font-bold leading-tight text-ink-900">
              {monthLabel(month)}
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-ink-600">
              {effectiveFilter === "todos"
                ? "Todos los operarios"
                : `Operario: ${visibleOperators[0]?.nombre ?? ""}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Total del mes
            </p>
            <p className="text-[18px] font-bold leading-tight tabular-nums text-ink-900">
              {formatHours(summary.total)}
            </p>
            <p className="text-[10px] font-medium text-ink-500">
              {summary.turnos} turnos
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <div className="min-w-[1090px] print:min-w-0">
          {weeks.map((week) => (
            <section
              key={week.key}
              className="planilla-print-section border-b border-ink-200 last:border-b-0"
            >
              <div className="relative border-y border-ink-800 bg-ink-900 px-4 py-2 text-left sm:text-center print:px-1 print:py-1">
                <span className="planilla-print-static sticky left-4 z-10 inline-block text-[12px] font-semibold tracking-wide text-white sm:static print:text-[10px]">
                  {week.label}
                </span>
                <span className="hidden print:absolute print:right-1 print:top-1/2 print:block print:-translate-y-1/2 print:text-[9px] print:font-medium print:tracking-wide print:text-white/60">
                  {monthLabel(month)}
                </span>
              </div>

              <table className="planilla-print-table w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="print-col-operator w-[140px]" />
                  {WEEKDAYS.map(() => (
                    <Fragment>
                      <col className="print-col-day w-[70px]" />
                    </Fragment>
                  ))}
                  <col className="print-col-total w-[68px]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-ink-200 bg-ink-100">
                    <th
                      rowSpan={2}
                      className="planilla-print-static sticky left-0 z-20 border-r border-ink-200 bg-ink-100 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500 shadow-[2px_0_4px_rgba(15,23,42,0.08)] print:px-1 print:py-1 print:text-[8px]"
                    >
                      Operario
                    </th>
                    {WEEKDAYS.map(({ weekday, label }) => {
                      const day = week.days.find(
                        (candidate) => candidate.weekday === weekday,
                      );
                      return (
                        <th
                          key={weekday}
                          className={cn(
                            "border-l border-ink-200 px-1 py-1.5 text-center print:px-0.5 print:py-0.5",
                            day?.isToday ? "bg-brand-100" : "bg-ink-100",
                          )}
                        >
                          <span
                            className={cn(
                              "block text-[11px] font-bold print:text-[9px]",
                              day?.isToday ? "text-brand-800" : "text-ink-700",
                            )}
                          >
                            {label}
                          </span>
                          <span
                            className={cn(
                              "block text-[9px] font-medium print:text-[7px]",
                              day?.isToday ? "text-brand-600" : "text-ink-400",
                            )}
                          >
                            {day ? dateLabel(day) : "—"}
                            {day?.isToday ? " · Hoy" : ""}
                          </span>
                        </th>
                      );
                    })}
                    <th
                      rowSpan={2}
                      className="planilla-print-static border-l border-ink-200 bg-brand-600 px-1 py-2 text-center text-[8px] font-bold uppercase leading-[1.15] tracking-[0.06em] text-white sm:sticky sm:right-0 sm:z-20 sm:shadow-[-2px_0_4px_rgba(15,23,42,0.08)] print:px-0.5 print:py-1 print:text-[7px]"
                    >
                      Total semana
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleOperators.map((operator, index) => {
                    const rowTint =
                      index % 2 === 0 ? "bg-white" : "bg-ink-50";
                    return (
                      <tr
                        key={operator.id}
                        className={cn("border-b border-ink-100", rowTint)}
                      >
                        <td
                          className={cn(
                            "planilla-print-static sticky left-0 z-10 border-r border-ink-200 px-2 py-1.5 shadow-[2px_0_4px_rgba(15,23,42,0.08)] print:px-1 print:py-0.5",
                            rowTint,
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              className={cn(
                                "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold print:h-4 print:w-4 print:text-[7px]",
                                avatarColor(operator.id),
                              )}
                            >
                              {operator.nombre.charAt(0).toUpperCase()}
                            </span>
                            <span
                              className="truncate text-[11px] font-semibold text-ink-800 print:text-[9px]"
                              title={operator.nombre}
                            >
                              {operator.nombre}
                            </span>
                          </div>
                        </td>

                        {WEEKDAYS.map(({ weekday }) => {
                          const day = week.days.find(
                            (candidate) => candidate.weekday === weekday,
                          );
                          if (!day) {
                            return (
                              <td
                                key={weekday}
                                className="border-l border-ink-100 bg-ink-50/30 px-1 py-1.5 text-center text-[11px] text-ink-300 print:px-0 print:py-0.5 print:text-[9px]"
                              >
                                —
                              </td>
                            );
                          }
                          const dayData = operator.shifts[day.key];
                          const turnosOrd = dayData?.turnos.filter(
                            (t) => t.tipo === "ORDINARIO",
                          ) ?? [];
                          const turnoM = turnosOrd.find((t) => t.secuencia === 1);
                          const turnoT = turnosOrd.find((t) => t.secuencia === 2);
                          const extra = dayData?.turnos.find(
                            (t) => t.tipo === "EXTRA",
                          );

                          return (
                            <td
                              key={day.key}
                              className={cn(
                                "border-l border-ink-100 px-1 py-1.5 print:px-0 print:py-0.5",
                                day.isToday ? "bg-brand-50/60" : rowTint,
                                "cursor-pointer hover:bg-ink-50/50",
                              )}
                              onClick={() =>
                                abrirModal(operator.id, operator.nombre, day.key)
                              }
                            >
                              <div className="flex flex-col gap-0.5 min-h-[44px]">
                                {turnoM && (
                                  <span className="text-[9px] font-medium text-ink-700 leading-none">
                                    M {turnoLabel(turnoM)}
                                  </span>
                                )}
                                {turnoT && (
                                  <span className="text-[9px] font-medium text-ink-700 leading-none">
                                    T {turnoLabel(turnoT)}
                                  </span>
                                )}
                                {extra && (
                                  <span className="text-[9px] font-medium text-brand-700 leading-none">
                                    +{formatExtraHours(extra.minutes)}
                                  </span>
                                )}
                                {!turnoM && !turnoT && !extra && (
                                  <span className="text-[9px] text-ink-300 leading-none">
                                    —
                                  </span>
                                )}
                                <span className="mt-0.5 text-[10px] font-bold tabular-nums text-ink-900">
                                  {dayData ? formatHours(dayData.totalMinutes) : "—"}
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        <td className="planilla-print-static border-l border-ink-200 bg-brand-600 px-1 py-1.5 text-center sm:sticky sm:right-0 sm:z-10 sm:shadow-[-2px_0_4px_rgba(15,23,42,0.08)] print:px-0.5 print:py-0.5">
                          <span className="text-[11px] font-bold tabular-nums text-white print:text-[9px]">
                            {formatHours(
                              totalForWeek(operator.shifts, week),
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </div>

      <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-3 print:hidden">
        <p className="text-[11px] text-ink-500">
          La semana va de lunes a sábado. Hacé clic en cualquier día para cargar
          turno mañana, turno tarde y horas extras. Los cambios se guardan al
          presionar "Guardar".
        </p>
      </div>

      {modal && (
        <DiaModal
          open
          operarioId={modal.operarioId}
          operarioNombre={modal.operarioNombre}
          fecha={modal.fecha}
          datos={modal.datos}
          onClose={() => setModal(null)}
          onSaved={() => handleSaved(modal.operarioId, modal.fecha)}
        />
      )}
    </div>
  );
}
