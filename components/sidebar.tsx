"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  LogOut,
  Menu,
  Table2,
  Users,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { PasswordDialog } from "./password-dialog";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(panel)/actions";

const NAV = [
  { href: "/planilla", label: "Planilla", icon: Table2 },
  { href: "/operarios", label: "Operarios", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const nav = (
    <nav className="mt-6 space-y-1">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-white/10 text-white shadow-sm ring-1 ring-inset ring-white/10"
                : "text-white/55 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px]",
                active ? "text-brand-300" : "text-white/40 group-hover:text-white/80",
              )}
              strokeWidth={2}
            />
            <span className="flex-1">{item.label}</span>
            {active && <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white/85 px-4 py-3 backdrop-blur lg:hidden print:hidden">
        <Logo tone="light" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-icon"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-ink-950/50 backdrop-blur-sm lg:hidden print:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950 px-4 pb-4 pt-5 transition-transform duration-300 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-1">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {nav}

        <div className="mt-auto space-y-3 pt-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-200 ring-1 ring-inset ring-brand-400/20">
                A
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white">
                  Administrador
                </p>
                <p className="truncate text-[11px] text-white/40">
                  Acceso privado
                </p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-rose-300"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
            <div className="mt-2 border-t border-white/5 pt-2">
              <PasswordDialog />
            </div>
          </div>
          <p className="px-1 text-[10px] text-white/25">
            Turnos · Planilla de horarios
          </p>
        </div>
      </aside>
    </>
  );
}
