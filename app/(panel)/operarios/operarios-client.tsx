"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
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
import { avatarColor, cn } from "@/lib/utils";
import {
  createOperario,
  deleteOperario,
  renameOperario,
} from "./actions";

type OperatorRow = {
  id: number;
  nombre: string;
  shiftCount: number;
};

export function OperariosClient({ operators }: { operators: OperatorRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<OperatorRow | null>(null);

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createOperario(name);
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
            Solo necesitás el nombre. Después cargás sus horarios en la planilla.
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError(null);
            }}
            maxLength={80}
            required
            className="input flex-1"
            placeholder="Ej.: Juan Pérez"
            aria-label="Nombre del operario"
          />
          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={pending || !name.trim()}
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
              {operators.length}{" "}
              {operators.length === 1 ? "operario" : "operarios"}
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
              return (
                <li
                  key={operator.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold",
                      avatarColor(operator.id),
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
                        <p className="truncate text-[13px] font-semibold text-ink-900">
                          {operator.nombre}
                        </p>
                        <p className="text-[11px] text-ink-400">
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
                        onClick={() => setDeleting(operator)}
                        className="btn-icon text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Eliminar operario"
                        aria-label={`Eliminar ${operator.nombre}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(deleting)}
        onClose={() => {
          if (!pending) setDeleting(null);
        }}
        title="Eliminar operario"
        description="Esta acción también borra sus horarios."
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
            ? Se van a borrar también sus{" "}
            <strong className="font-semibold text-ink-900">
              {deleting.shiftCount}{" "}
              {deleting.shiftCount === 1 ? "horario" : "horarios"}
            </strong>
            .
          </p>
        )}
      </Modal>
    </div>
  );
}
