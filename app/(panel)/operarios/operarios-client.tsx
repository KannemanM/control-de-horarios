"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { EmptyState } from "@/components/ui";
import { dateFromKey, formatDateNumeric, monthKeyOf, monthLabel } from "@/lib/time";
import { avatarColor, cn } from "@/lib/utils";
import {
  createOperario,
  deleteOperario,
  renameOperario,
  updateOperarioPeriodo,
} from "./actions";

type OperatorRow = {
  id: number;
  nombre: string;
  shiftCount: number;
  observationCount: number;
  fechaAlta: string | null;
  fechaBaja: string | null;
};

type PeriodForm = {
  operator: OperatorRow;
  alta: string;
  baja: string;
};

function formatKey(key: string | null): string | null {
  return key ? formatDateNumeric(dateFromKey(key)) : null;
}

export function OperariosClient({
  operators,
  today,
}: {
  operators: OperatorRow[];
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [alta, setAlta] = useState(today);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [period, setPeriod] = useState<PeriodForm | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<OperatorRow | null>(null);

  const activeCount = operators.filter((operator) => !operator.fechaBaja).length;
  const inactiveCount = operators.length - activeCount;

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createOperario(name, alta);
      if (result.ok) {
        setName("");
        router.refresh();
      } else {
        setError(result.error ?? "No se pudo agregar el operario.");
      }
    });
  }

  function startEdit(operator: OperatorRow) {
    setEditingId(operator.id);
    setEditingName(operator.nombre);
    setEditError(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditError(null);
  }

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId === null) return;
    setEditError(null);

    startTransition(async () => {
      const result = await renameOperario(editingId, editingName);
      if (result.ok) {
        cancelEdit();
        router.refresh();
      } else {
        setEditError(result.error ?? "No se pudo guardar el nombre.");
      }
    });
  }

  function startPeriod(operator: OperatorRow) {
    setPeriod({
      operator,
      alta: operator.fechaAlta ?? "",
      baja: operator.fechaBaja ?? "",
    });
    setPeriodError(null);
    setError(null);
  }

  function closePeriod() {
    if (pending) return;
    setPeriod(null);
    setPeriodError(null);
  }

  function handlePeriod() {
    if (!period) return;
    setPeriodError(null);

    if (period.alta && period.baja && period.alta > period.baja) {
      setPeriodError("La fecha de alta no puede ser posterior a la de baja.");
      return;
    }

    startTransition(async () => {
      const result = await updateOperarioPeriodo(
        period.operator.id,
        period.alta || null,
        period.baja || null,
      );
      if (result.ok) {
        setPeriod(null);
        router.refresh();
      } else {
        setPeriodError(result.error ?? "No se pudieron guardar las fechas.");
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteOperario(deleting.id);
      if (result.ok) {
        setDeleting(null);
        router.refresh();
      } else {
        setDeleting(null);
        setError(result.error ?? "No se pudo eliminar el operario.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="mb-4">
          <p className="card-title">Agregar operario</p>
          <p className="card-subtitle">
            Solo necesitás el nombre y desde cuándo trabaja. Después cargás sus
            horarios en la planilla.
          </p>
        </div>

        <form
          onSubmit={handleAdd}
          className="grid gap-2 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
        >
          <label className="block">
            <span className="label">Nombre</span>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              maxLength={80}
              required
              className="input"
              placeholder="Ej.: Juan Pérez"
            />
          </label>
          <label className="block">
            <span className="label">Fecha de alta</span>
            <input
              type="date"
              value={alta}
              onChange={(event) => setAlta(event.target.value)}
              className="input"
            />
          </label>
          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={pending || !name.trim() || !alta}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Agregar
          </button>
        </form>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <div>
            <p className="card-title">Equipo</p>
            <p className="card-subtitle">
              {activeCount} {activeCount === 1 ? "activo" : "activos"}
              {inactiveCount > 0
                ? ` · ${inactiveCount} de baja`
                : ""}
            </p>
          </div>
          <span className="badge badge-slate">
            <Users className="h-3.5 w-3.5" />
            {operators.reduce((acc, operator) => acc + operator.shiftCount, 0)}{" "}
            horarios cargados
          </span>
        </div>

        {operators.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Todavía no hay operarios"
            description="Usá el formulario de arriba para agregar el primero."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {operators.map((operator) => {
              const editing = editingId === operator.id;
              const canDelete =
                operator.shiftCount === 0 && operator.observationCount === 0;
              const altaLabel = formatKey(operator.fechaAlta);
              const bajaLabel = formatKey(operator.fechaBaja);

              return (
                <li
                  key={operator.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 px-5 py-3.5",
                    operator.fechaBaja && "bg-ink-50/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold",
                      avatarColor(operator.id),
                      operator.fechaBaja && "opacity-60",
                    )}
                  >
                    {operator.nombre.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <form
                        onSubmit={handleRename}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          value={editingName}
                          onChange={(event) => {
                            setEditingName(event.target.value);
                            if (editError) setEditError(null);
                          }}
                          maxLength={80}
                          autoFocus
                          required
                          className="input h-9 min-w-[180px] flex-1 py-1.5"
                          aria-label="Nombre del operario"
                        />
                        <button
                          type="submit"
                          className="btn-icon text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          disabled={pending || !editingName.trim()}
                          title="Guardar nombre"
                        >
                          {pending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="btn-icon"
                          disabled={pending}
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {editError && (
                          <p className="w-full text-[11px] font-medium text-rose-600">
                            {editError}
                          </p>
                        )}
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              "truncate text-[13px] font-semibold",
                              operator.fechaBaja
                                ? "text-ink-500"
                                : "text-ink-900",
                            )}
                          >
                            {operator.nombre}
                          </p>
                          {bajaLabel && (
                            <span className="badge badge-rose">
                              Baja {bajaLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-400">
                          {altaLabel ? `Alta ${altaLabel}` : "Alta sin registrar"}
                          {" · "}
                          {operator.shiftCount}{" "}
                          {operator.shiftCount === 1
                            ? "horario cargado"
                            : "horarios cargados"}
                        </p>
                      </>
                    )}
                  </div>

                  {!editing && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(operator)}
                        className="btn-icon"
                        title="Editar nombre"
                        aria-label={`Editar ${operator.nombre}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startPeriod(operator)}
                        className="btn-icon"
                        title="Editar fechas de alta y baja"
                        aria-label={`Editar fechas de ${operator.nombre}`}
                      >
                        <CalendarRange className="h-3.5 w-3.5" />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleting(operator)}
                          className="btn-icon text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Eliminar operario"
                          aria-label={`Eliminar ${operator.nombre}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(period)}
        onClose={closePeriod}
        title="Fechas del operario"
        description="Definen en qué meses aparece en la planilla."
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={closePeriod}
              disabled={pending}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handlePeriod}
              disabled={pending}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </>
        }
      >
        {period && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink-900">
              {period.operator.nombre}
            </p>

            <label className="block">
              <span className="label">Fecha de alta</span>
              <input
                type="date"
                value={period.alta}
                onChange={(event) => {
                  setPeriod({ ...period, alta: event.target.value });
                  if (periodError) setPeriodError(null);
                }}
                className="input"
              />
              <span className="mt-1 block text-[11px] text-ink-400">
                Primer día trabajado. Vacío = sin fecha registrada.
              </span>
            </label>

            <label className="block">
              <span className="label">Fecha de baja</span>
              <input
                type="date"
                value={period.baja}
                onChange={(event) => {
                  setPeriod({ ...period, baja: event.target.value });
                  if (periodError) setPeriodError(null);
                }}
                className="input"
              />
              <span className="mt-1 block text-[11px] text-ink-400">
                Último día trabajado. Vacío = sigue activo.
              </span>
            </label>

            {period.baja && (
              <p className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-[11px] text-ink-600">
                Último mes en la planilla:{" "}
                <strong className="font-semibold text-ink-900">
                  {monthLabel(monthKeyOf(dateFromKey(period.baja)))}
                </strong>
              </p>
            )}

            {periodError && (
              <p className="text-[11px] font-medium text-rose-600">
                {periodError}
              </p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => {
          if (!pending) setDeleting(null);
        }}
        title="Eliminar operario"
        description="Solo se pueden eliminar operarios sin horarios cargados."
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDeleting(null)}
              disabled={pending}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </button>
          </>
        }
      >
        {deleting && (
          <p className="text-sm leading-relaxed text-ink-600">
            ¿Seguro que querés eliminar a{" "}
            <strong className="font-semibold text-ink-900">
              {deleting.nombre}
            </strong>
            ? No tiene horarios ni observaciones cargados.
          </p>
        )}
      </Modal>
    </div>
  );
}
