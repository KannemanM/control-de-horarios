import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ShieldCheck, Table2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar" };

const FEATURES = [
  "Planilla mensual editable como Excel",
  "Totales diarios y semanales automáticos",
  "Operarios y horarios en un solo lugar",
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/planilla");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-grid opacity-[0.35]" />
        <div className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-brand-600/25 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[380px] w-[380px] rounded-full bg-emerald-500/10 blur-[110px]" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative mt-auto max-w-md">
          <span className="badge border border-white/10 bg-white/5 text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Planilla de horarios
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white text-balance">
            Tus horarios, simples y ordenados.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Cargá la entrada y la salida de cada operario y obtené los totales
            del día y de la semana sin cuentas manuales.
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2.5 text-sm text-white/70"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12 flex items-center gap-6 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Clock3 className="h-4 w-4" />
            Zona horaria Argentina
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <ShieldCheck className="h-4 w-4" />
            Acceso privado
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo tone="light" />
          </div>

          <div className="mb-8">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <Table2 className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink-900">
              Ingresar al panel
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Acceso exclusivo del administrador.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
