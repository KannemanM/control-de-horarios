"use client";

import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

const COOKIE = "panel_sidebar";
const MAX_AGE = 60 * 60 * 24 * 365;

export function PanelShell({
  defaultCollapsed,
  children,
}: {
  defaultCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${COOKIE}=${
      next ? "collapsed" : "expanded"
    }; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  }

  return (
    <div
      className={cn(
        "panel-layout min-h-screen lg:grid",
        collapsed
          ? "lg:grid-cols-[minmax(0,1fr)]"
          : "lg:grid-cols-[268px_minmax(0,1fr)]",
      )}
    >
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      {collapsed && (
        <button
          type="button"
          onClick={toggle}
          className="fixed left-2 top-4 z-30 hidden h-8 w-8 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500 shadow-sm transition hover:bg-ink-50 hover:text-ink-900 lg:grid print:hidden"
          title="Mostrar panel lateral"
          aria-label="Mostrar panel lateral"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <main className="panel-main min-w-0 px-4 pb-20 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        <div className="panel-content mx-auto w-full max-w-[1240px]">{children}</div>
      </main>
    </div>
  );
}
