"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Modal } from "./modal";
import { changePasswordAction } from "@/app/(panel)/actions";

export function PasswordDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
    setSuccess(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result.ok) {
        form.reset();
        setSuccess(true);
        window.setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 1200);
      } else {
        setError(result.error ?? "No se pudo cambiar la contraseña.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-white/45 transition hover:bg-white/5 hover:text-white/80"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Cambiar contraseña
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Cambiar contraseña"
        description="Ingresá tu contraseña actual y elegí una nueva."
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={close}
              className="btn-secondary"
              disabled={pending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="password-form"
              className="btn-primary"
              disabled={pending || success}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </>
        }
      >
        <form id="password-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
              Contraseña actualizada.
            </div>
          )}

          <div>
            <label className="label" htmlFor="current">
              Contraseña actual
            </label>
            <input
              id="current"
              name="current"
              type="password"
              autoComplete="current-password"
              required
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="next">
              Nueva contraseña
            </label>
            <input
              id="next"
              name="next"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              className="input"
            />
            <p className="mt-1 text-[10px] text-ink-400">Mínimo 6 caracteres.</p>
          </div>

          <div>
            <label className="label" htmlFor="confirm">
              Repetir nueva contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              className="input"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
