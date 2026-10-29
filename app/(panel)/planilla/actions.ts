"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { dateFromKey, combineDateAndTime, dateKey, parseHM } from "@/lib/time";

export type TurnoDiaInput = {
  operarioId: number;
  fecha: string;
  /** Turno mañana */
  entradaM?: string;
  salidaM?: string;
  /** Turno tarde */
  entradaT?: string;
  salidaT?: string;
  /** Horas extras en minutos */
  horasExtras?: number;
};

export type SaveDiaResult = { ok: boolean; error?: string };

export async function saveDia(
  input: TurnoDiaInput,
): Promise<SaveDiaResult> {
  await requireSession();

  const operarioId = Number(input.operarioId);
  const fecha = String(input.fecha ?? "").trim();

  if (!Number.isInteger(operarioId) || operarioId <= 0) {
    return { ok: false, error: "Operario inválido." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, error: "Fecha inválida." };
  }

  const fechaDate = dateFromKey(fecha);
  if (dateKey(fechaDate) !== fecha) {
    return { ok: false, error: "Fecha inválida." };
  }

  const operario = await prisma.operario.findUnique({
    where: { id: operarioId },
    select: { id: true },
  });
  if (!operario) {
    return { ok: false, error: "El operario no existe." };
  }

  // Parsear y validar cada bloque
  const bloques: Array<{
    tipo: "ORDINARIO" | "EXTRA";
    secuencia?: number;
    entrada?: string;
    salida?: string;
    horasExtras?: number;
  }> = [];

  const validarRango = (e: string | undefined, s: string | undefined) => {
    if (!e && !s) return null;
    if (!e || !s) throw new Error("Completá entrada y salida del turno.");
    const em = parseHM(e);
    const sm = parseHM(s);
    if (em === null || sm === null) throw new Error("Horario inválido.");
    if (em === sm) throw new Error("La salida no puede ser igual a la entrada.");
    return { entrada: e, salida: s };
  };

  try {
    const m = validarRango(input.entradaM, input.salidaM);
    if (m) bloques.push({ tipo: "ORDINARIO", secuencia: 1, ...m });

    const t = validarRango(input.entradaT, input.salidaT);
    if (t) bloques.push({ tipo: "ORDINARIO", secuencia: 2, ...t });

    const ex = Number(input.horasExtras ?? 0);
    if (ex > 0) {
      bloques.push({ tipo: "EXTRA", horasExtras: ex });
    }
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Error de validación." };
  }

  try {
    // Borrar todos los turnos de este operario en esta fecha y recrear
    await prisma.turno.deleteMany({
      where: { operarioId, fecha: fechaDate },
    });

    for (const b of bloques) {
      if (b.tipo === "EXTRA") {
        await prisma.turno.create({
          data: {
            operarioId,
            fecha: fechaDate,
            tipo: "EXTRA",
            horasExtras: b.horasExtras,
          },
        });
      } else {
        const entradaDate = combineDateAndTime(fecha, b.entrada!);
        let salidaDate = combineDateAndTime(fecha, b.salida!);
        const em = parseHM(b.entrada!);
        const sm = parseHM(b.salida!);
        if (sm !== null && em !== null && sm < em) {
          salidaDate = new Date(salidaDate.getTime() + 86_400_000);
        }
        await prisma.turno.create({
          data: {
            operarioId,
            fecha: fechaDate,
            tipo: "ORDINARIO",
            secuencia: b.secuencia,
            entrada: entradaDate,
            salida: salidaDate,
          },
        });
      }
    }

    revalidatePath("/planilla");
    revalidatePath("/operarios");
    return { ok: true };
  } catch (cause) {
    console.error(cause);
    return { ok: false, error: "No se pudo guardar el día." };
  }
}
