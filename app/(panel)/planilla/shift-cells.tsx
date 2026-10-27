"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatHours,
  minutesBetweenTimes,
  normalizeTimeInput,
  type PlanillaDay,
  type PlanillaShift,
} from "@/lib/planilla";
import { saveShift } from "./actions";

type Status = "idle" | "saving" | "saved" | "incomplete" | "error";

type SavedTimes = { entrada: string; salida: string };

export function ShiftCells({
  operarioId,
  operarioNombre,
  day,
  shift,
  rowTint,
  onSaved,
}: {
  operarioId: number;
  operarioNombre: string;
  day: PlanillaDay;
  shift: PlanillaShift | null;
  rowTint: string;
  onSaved: (dayKey: string, shift: PlanillaShift | null) => void;
}) {
  const [entrada, setEntrada] = useState(shift?.entrada ?? "");
  const [salida, setSalida] = useState(shift?.salida ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const entradaRef = useRef(shift?.entrada ?? "");
  const salidaRef = useRef(shift?.salida ?? "");
  const lastSaved = useRef<SavedTimes | null>(
    shift ? { entrada: shift.entrada, salida: shift.salida } : null,
  );
  const saving = useRef(false);
  const savedTimer = useRef<number | null>(null);

  useEffect(() => {
    setEntrada(shift?.entrada ?? "");
    setSalida(shift?.salida ?? "");
    entradaRef.current = shift?.entrada ?? "";
    salidaRef.current = shift?.salida ?? "";
    lastSaved.current = shift
      ? { entrada: shift.entrada, salida: shift.salida }
      : null;
  }, [shift?.entrada, shift?.salida]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    };
  }, []);

  const normalizedEntrada = normalizeTimeInput(entrada);
  const normalizedSalida = normalizeTimeInput(salida);
  const minutes =
    normalizedEntrada && normalizedSalida
      ? minutesBetweenTimes(normalizedEntrada, normalizedSalida)
      : null;

  function markSaved() {
    setStatus("saved");
    setMessage(null);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => {
      setStatus((current) => (current === "saved" ? "idle" : current));
    }, 1400);
  }

  function applyChange(
    setter: (value: string) => void,
    ref: React.MutableRefObject<string>,
    value: string,
  ) {
    const clean = value.replace(/[^\d:]/g, "").slice(0, 5);
    setter(clean);
    ref.current = clean;
    if (status !== "saving") {
      setStatus("idle");
      setMessage(null);
    }
  }

  async function persist(nextEntrada: string, nextSalida: string) {
    if (saving.current) return;

    const normalizedEntrada = normalizeTimeInput(nextEntrada);
    const normalizedSalida = normalizeTimeInput(nextSalida);

    if (normalizedEntrada === null || normalizedSalida === null) {
      setStatus("error");
      setMessage("Formato HH:MM");
      return;
    }

    if (!normalizedEntrada && !normalizedSalida) {
      if (!lastSaved.current) {
        setStatus("idle");
        setMessage(null);
        return;
      }

      saving.current = true;
      setStatus("saving");
      setMessage(null);
      try {
        const result = await saveShift({
          operarioId,
          fecha: day.key,
          entrada: "",
          salida: "",
        });
        if (result.ok) {
          lastSaved.current = null;
          onSaved(day.key, null);
          markSaved();
        } else {
          setStatus("error");
          setMessage(result.error ?? "No se pudo borrar");
        }
      } finally {
        saving.current = false;
      }
      return;
    }

    if (!normalizedEntrada || !normalizedSalida) {
      setEntrada(normalizedEntrada);
      setSalida(normalizedSalida);
      entradaRef.current = normalizedEntrada;
      salidaRef.current = normalizedSalida;
      if (lastSaved.current) {
        setStatus("incomplete");
        setMessage(!normalizedEntrada ? "Falta entrada" : "Falta salida");
      } else {
        setStatus("idle");
        setMessage(null);
      }
      return;
    }

    if (normalizedEntrada !== nextEntrada) {
      setEntrada(normalizedEntrada);
      entradaRef.current = normalizedEntrada;
    }
    if (normalizedSalida !== nextSalida) {
      setSalida(normalizedSalida);
      salidaRef.current = normalizedSalida;
    }

    if (
      lastSaved.current &&
      lastSaved.current.entrada === normalizedEntrada &&
      lastSaved.current.salida === normalizedSalida
    ) {
      return;
    }

    const nextMinutes = minutesBetweenTimes(normalizedEntrada, normalizedSalida);
    if (nextMinutes === null || nextMinutes === 0) {
      setStatus("error");
      setMessage("Salida igual a entrada");
      return;
    }

    saving.current = true;
    setStatus("saving");
    setMessage(null);
    try {
      const result = await saveShift({
        operarioId,
        fecha: day.key,
        entrada: normalizedEntrada,
        salida: normalizedSalida,
      });
      if (result.ok) {
        lastSaved.current = {
          entrada: normalizedEntrada,
          salida: normalizedSalida,
        };
        onSaved(day.key, {
          entrada: normalizedEntrada,
          salida: normalizedSalida,
          minutes: nextMinutes,
        });
        markSaved();
      } else {
        setStatus("error");
        setMessage(result.error ?? "No se pudo guardar");
      }
    } finally {
      saving.current = false;
    }
  }

  function handleBlur() {
    if (status === "saving") return;
    void persist(entradaRef.current, salidaRef.current);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (entradaRef.current && salidaRef.current) {
        void persist(entradaRef.current, salidaRef.current);
      } else {
        event.currentTarget.blur();
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const previousEntrada = lastSaved.current?.entrada ?? "";
      const previousSalida = lastSaved.current?.salida ?? "";
      setEntrada(previousEntrada);
      setSalida(previousSalida);
      entradaRef.current = previousEntrada;
      salidaRef.current = previousSalida;
      setStatus("idle");
      setMessage(null);
      event.currentTarget.blur();
    }
  }

  const inputTint = day.isToday ? "bg-brand-50/70" : rowTint;
  const totalTint = day.isToday
    ? "bg-brand-50/80"
    : day.isWeekend
      ? "bg-ink-100/60"
      : rowTint;

  return (
    <>
      <td className={cn("border-l border-ink-100 px-0.5 py-1.5 print:px-0 print:py-0.5", inputTint)}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          maxLength={5}
          placeholder="--:--"
          value={entrada}
          onChange={(event) =>
            applyChange(setEntrada, entradaRef, event.target.value)
          }
          onFocus={(event) => event.currentTarget.select()}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={status === "saving"}
          className={cn(
            "mx-auto block h-7 w-full min-w-0 rounded border border-transparent bg-transparent px-1 text-center text-[12px] font-medium tabular-nums text-ink-800 outline-none transition placeholder:text-ink-300 hover:border-ink-200 hover:bg-white focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60 print:h-auto print:rounded-none print:border-0 print:bg-transparent print:px-0 print:text-[9px] print:shadow-none",
            (status === "error" || status === "incomplete") &&
              "border-rose-200 bg-rose-50/50",
          )}
          aria-label={`Entrada ${day.label} de ${operarioNombre}`}
          title="Hora de entrada (HH:MM)"
        />
      </td>

      <td className={cn("border-l border-ink-100 px-0.5 py-1.5 print:px-0 print:py-0.5", inputTint)}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          maxLength={5}
          placeholder="--:--"
          value={salida}
          onChange={(event) =>
            applyChange(setSalida, salidaRef, event.target.value)
          }
          onFocus={(event) => event.currentTarget.select()}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={status === "saving"}
          className={cn(
            "mx-auto block h-7 w-full min-w-0 rounded border border-transparent bg-transparent px-1 text-center text-[12px] font-medium tabular-nums text-ink-800 outline-none transition placeholder:text-ink-300 hover:border-ink-200 hover:bg-white focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60 print:h-auto print:rounded-none print:border-0 print:bg-transparent print:px-0 print:text-[9px] print:shadow-none",
            (status === "error" || status === "incomplete") &&
              "border-rose-200 bg-rose-50/50",
          )}
          aria-label={`Salida ${day.label} de ${operarioNombre}`}
          title="Hora de salida (HH:MM)"
        />
      </td>

      <td className={cn("border-l border-ink-100 px-1 py-1.5 text-center print:px-0.5 print:py-0.5", totalTint)}>
        <div className="flex min-h-7 items-center justify-center gap-1 print:min-h-0">
          {status === "saving" && (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-ink-400 print:hidden" />
          )}
          {status === "saved" && (
            <Check className="h-3 w-3 shrink-0 text-emerald-500 print:hidden" />
          )}
          <span
            className={cn(
              "text-[11px] font-semibold tabular-nums print:text-[9px]",
              minutes === null ? "text-ink-300" : "text-ink-900",
            )}
          >
            {minutes === null ? "—" : formatHours(minutes)}
          </span>
        </div>
        {message && (
          <p className="mt-0.5 text-[9px] font-medium leading-tight text-rose-600 print:hidden">
            {message}
          </p>
        )}
      </td>
    </>
  );
}
