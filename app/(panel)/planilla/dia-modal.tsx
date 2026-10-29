"use client";

import { useEffect, useState } from "react";
import { SaveDiaResult, saveDia } from "./actions";
import {
  formatExtraHours,
  formatHours,
  minutesBetweenTimes,
  normalizeTimeInput,
} from "@/lib/planilla";
import { X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DiaModalProps = {
  open: boolean;
  operarioId: number;
  operarioNombre: string;
  fecha: string; // YYYY-MM-DD
  datos?: {
    mañana?: { entrada: string; salida: string };
    tarde?: { entrada: string; salida: string };
    horasExtras?: number; // minutos
  };
  onClose: () => void;
  onSaved: () => void;
};

export function DiaModal({
  open,
  operarioId,
  operarioNombre,
  fecha,
  datos,
  onClose,
  onSaved,
}: DiaModalProps) {
  const [entradaM, setEntradaM] = useState(datos?.mañana?.entrada ?? "");
  const [salidaM, setSalidaM] = useState(datos?.mañana?.salida ?? "");
  const [entradaT, setEntradaT] = useState(datos?.tarde?.entrada ?? "");
  const [salidaT, setSalidaT] = useState(datos?.tarde?.salida ?? "");
  const [horasExtras, setHorasExtras] = useState(
    datos?.horasExtras !== undefined ? formatExtraHours(datos.horasExtras) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSaving(false);
    }
  }, [open]);

  const limpiarHora = (setter: (v: string) => void, valor: string) => {
    const clean = valor.replace(/[^\d:]/g, "").slice(0, 5);
    setter(clean);
  };

  const exMinutos = (): number | null => {
    const raw = horasExtras.replace(/[^\d:]/g, "");
    if (!raw) return null;
    if (raw.includes(":")) {
      const [h, m] = raw.split(":").map(Number);
      if (h == null || m == null) return null;
      return h * 60 + m;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) return null;
    return n * 60;
  };

  const validarRango = (
    e: string,
    s: string,
  ): { entrada: string; salida: string } | null => {
    if (!e && !s) return null;
    if (!e || !s) throw new Error("Completá entrada y salida del turno.");
    const ne = normalizeTimeInput(e);
    const ns = normalizeTimeInput(s);
    if (ne === null || ns === null) throw new Error("Horario inválido.");
    const m = minutesBetweenTimes(ne, ns);
    if (m === null || m === 0) throw new Error("Salida igual a entrada.");
    return { entrada: ne, salida: ns };
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const m = validarRango(entradaM, salidaM);
      const t = validarRango(entradaT, salidaT);
      const ex = exMinutos();

      const input: {
        operarioId: number;
        fecha: string;
        entradaM?: string;
        salidaM?: string;
        entradaT?: string;
        salidaT?: string;
        horasExtras?: number;
      } = { operarioId, fecha };

      if (m) {
        input.entradaM = m.entrada;
        input.salidaM = m.salida;
      }
      if (t) {
        input.entradaT = t.entrada;
        input.salidaT = t.salida;
      }
      if (ex !== null && ex !== 0) {
        input.horasExtras = ex;
      }

      const result: SaveDiaResult = await saveDia(input);
      if (result.ok) {
        onSaved();
        onClose();
      } else {
        setError(result.error ?? "No se pudo guardar");
        setSaving(false);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado");
      setSaving(false);
    }
  }

  if (!open) return null;

  const totalMin =
    (minutesBetweenTimes(entradaM, salidaM) ?? 0) +
    (minutesBetweenTimes(entradaT, salidaT) ?? 0) +
    (exMinutos() ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dia-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-ink-200">
        <div className="flex items-center justify-between mb-4">
          <h2 id="dia-modal-title" className="text-lg font-bold text-ink-900">
            {fecha}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-[11px] font-medium text-ink-600 uppercase tracking-wider">
            {operarioNombre}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-ink-500">
                Turno mañana
              </label>
              <input
                type="text"
                placeholder="Entrada"
                value={entradaM}
                onChange={(e) => limpiarHora(setEntradaM, e.target.value)}
                className="h-8 rounded border border-ink-200 bg-transparent px-2 text-center text-[12px] font-medium outline-none focus:border-brand-500"
              />
              <input
                type="text"
                placeholder="Salida"
                value={salidaM}
                onChange={(e) => limpiarHora(setSalidaM, e.target.value)}
                className="h-8 rounded border border-ink-200 bg-transparent px-2 text-center text-[12px] font-medium outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-ink-500">
                Turno tarde
              </label>
              <input
                type="text"
                placeholder="Entrada"
                value={entradaT}
                onChange={(e) => limpiarHora(setEntradaT, e.target.value)}
                className="h-8 rounded border border-ink-200 bg-transparent px-2 text-center text-[12px] font-medium outline-none focus:border-brand-500"
              />
              <input
                type="text"
                placeholder="Salida"
                value={salidaT}
                onChange={(e) => limpiarHora(setSalidaT, e.target.value)}
                className="h-8 rounded border border-ink-200 bg-transparent px-2 text-center text-[12px] font-medium outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium text-ink-500">
              Horas extras
            </label>
            <input
              type="text"
              placeholder="Ej: 2:30 o 2.5"
              value={horasExtras}
              onChange={(e) => setHorasExtras(e.target.value)}
              className="h-8 rounded border border-ink-200 bg-transparent px-2 text-center text-[12px] font-medium outline-none focus:border-brand-500"
            />
          </div>

          {totalMin > 0 && (
            <p className="text-[11px] font-semibold text-ink-800">
              Total del día: <span className="font-bold text-brand-700">{formatHours(totalMin)}</span>
            </p>
          )}

          {error && (
            <p className="text-[11px] font-medium text-rose-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded border border-ink-200 bg-transparent text-[12px] font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-brand-600 text-white text-[12px] font-medium hover:bg-brand-700 disabled:opacity-60 flex items-center gap-1"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
