import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { OperariosClient } from "./operarios-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operarios" };

export default async function OperariosPage() {
  await requireSession();

  const operarios = await prisma.operario.findMany({
    include: {
      _count: { select: { turnos: true } },
    },
  });

  const data = operarios
    .map((operario) => ({
      id: operario.id,
      nombre: operario.nombre,
      shiftCount: operario._count.turnos,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Operarios"
        description="Agregá a las personas que vas a incluir en la planilla."
        actions={
          <Link href="/planilla" className="btn-secondary">
            Ir a la planilla
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <OperariosClient operators={data} />
    </div>
  );
}
