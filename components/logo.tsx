import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  tone = "dark",
  compact = false,
}: {
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 shadow-lg shadow-brand-900/25">
        <Clock3 className="h-5 w-5 text-white" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p
            className={cn(
              "text-[15px] font-bold tracking-tight",
              tone === "dark" ? "text-white" : "text-ink-900",
            )}
          >
            Turnos
          </p>
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.18em]",
              tone === "dark" ? "text-white/40" : "text-ink-400",
            )}
          >
            Control horario
          </p>
        </div>
      )}
    </div>
  );
}
