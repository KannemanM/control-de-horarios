import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { dateKey, todayKey } from "@/lib/time";
import { OperariosClient } from "./operarios-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operarios" };

export default async function OperariosPage() {
  await requireSession();

  const operarios = await prisma.operario.findMany({
    include: {
      _count: { select: { turnos: true, observaciones: true } },
    },
  });

  const data = operarios
    .map((operario) => ({
      id: operario.id,
      nombre: operario.nombre,
      shiftCount: operario._count.turnos,
      observationCount: operario._count.observaciones,
      fechaAlta: operario.fechaAlta ? dateKey(operario.fechaAlta) : null,
      fechaBaja: operario.fechaBaja ? dateKey(operario.fechaBaja) : null,
    }))
    .sort((a, b) => {
      const aBaja = a.fechaBaja ? 1 : 0;
      const bBaja = b.fechaBaja ? 1 : 0;
      if (aBaja !== bBaja) return aBaja - bBaja;
      return a.nombre.localeCompare(b.nombre, "es");
    });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Operarios"
        description="Agregá personas, registrá su fecha de alta y dá de baja sin perder el historial."
        actions={
          <Link href="/planilla" className="btn-secondary">
            Ir a la planilla
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <OperariosClient operators={data} today={todayKey()} />
    </div>
  );
}
