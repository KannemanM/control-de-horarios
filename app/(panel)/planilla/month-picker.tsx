"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { monthKeyOf, shiftMonthKey } from "@/lib/time";
import { cn } from "@/lib/utils";

export function MonthPicker({ month }: { month: string }) {
  const todayMonth = monthKeyOf(new Date());
  const previous = shiftMonthKey(month, -1);
  const next = shiftMonthKey(month, 1);

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
      <Link
        href={`/planilla?mes=${previous}`}
        className="btn-icon h-8 w-8"
        title="Mes anterior"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      <form
        method="get"
        action="/planilla"
        className="relative flex items-center gap-1.5 px-1"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-ink-400" />
        <input
          key={month}
          type="month"
          name="mes"
          defaultValue={month}
          required
          onChange={(event) => {
            if (event.target.value) event.currentTarget.form?.requestSubmit();
          }}
          className="w-[142px] cursor-pointer border-0 bg-transparent p-0 text-center text-[13px] font-semibold text-ink-800 focus:outline-none focus:ring-0"
          aria-label="Mes de la planilla"
        />
        <button type="submit" className="sr-only">
          Ver mes
        </button>
      </form>

      <Link
        href={`/planilla?mes=${next}`}
        className="btn-icon h-8 w-8"
        title="Mes siguiente"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>

      <Link
        href={`/planilla?mes=${todayMonth}`}
        className={cn(
          "ml-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition",
          month === todayMonth
            ? "pointer-events-none text-ink-300"
            : "text-ink-500 hover:bg-ink-100 hover:text-ink-800",
        )}
        title="Ir al mes actual"
        aria-disabled={month === todayMonth}
        tabIndex={month === todayMonth ? -1 : undefined}
      >
        Hoy
      </Link>
    </div>
  );
}
