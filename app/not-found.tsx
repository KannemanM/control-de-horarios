import Link from "next/link";
import { Clock3 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-900/20">
          <Clock3 className="h-7 w-7" />
        </div>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-ink-400">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          La dirección que buscás no existe o fue movida.
        </p>
        <Link href="/planilla" className="btn-primary mt-6">
          Volver a la planilla
        </Link>
      </div>
    </div>
  );
}
