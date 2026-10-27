"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { dateFromKey, combineDateAndTime, dateKey, parseHM } from "@/lib/time";

export type SaveShiftInput = {
  operarioId: number;
  fecha: string;
  entrada: string;
  salida: string;
};

export type SaveShiftResult = { ok: boolean; error?: string };

const DAY_MS = 86_400_000;

export async function saveShift(
  input: SaveShiftInput,
): Promise<SaveShiftResult> {
  await requireSession();

  const operarioId = Number(input.operarioId);
  const fecha = String(input.fecha ?? "").trim();
  const entrada = String(input.entrada ?? "").trim();
  const salida = String(input.salida ?? "").trim();

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

  // Dejar ambos campos vacíos borra el horario del día.
  if (!entrada && !salida) {
    try {
      await prisma.turno.deleteMany({
        where: { operarioId, fecha: fechaDate },
      });
      revalidatePath("/planilla");
      revalidatePath("/operarios");
      return { ok: true };
    } catch (cause) {
      console.error(cause);
      return { ok: false, error: "No se pudo borrar el horario." };
    }
  }

  if (!entrada || !salida) {
    return { ok: false, error: "Completá entrada y salida." };
  }

  const entradaMinutes = parseHM(entrada);
  const salidaMinutes = parseHM(salida);
  if (entradaMinutes === null || salidaMinutes === null) {
    return { ok: false, error: "Usá un horario válido, por ejemplo 09:00." };
  }
  if (entradaMinutes === salidaMinutes) {
    return { ok: false, error: "La salida no puede ser igual a la entrada." };
  }

  const entradaDate = combineDateAndTime(fecha, entrada);
  let salidaDate = combineDateAndTime(fecha, salida);
  if (salidaMinutes < entradaMinutes) {
    salidaDate = new Date(salidaDate.getTime() + DAY_MS);
  }

  try {
    await prisma.turno.upsert({
      where: { operarioId_fecha: { operarioId, fecha: fechaDate } },
      create: {
        operarioId,
        fecha: fechaDate,
        entrada: entradaDate,
        salida: salidaDate,
      },
      update: {
        entrada: entradaDate,
        salida: salidaDate,
      },
    });
    revalidatePath("/planilla");
    revalidatePath("/operarios");
    return { ok: true };
  } catch (cause) {
    console.error(cause);
    return { ok: false, error: "No se pudo guardar el horario." };
  }
}
