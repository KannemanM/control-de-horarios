"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { dateFromKey, dateKey, todayKey } from "@/lib/time";

export type OperarioResult = { ok: boolean; error?: string; id?: number };

function cleanName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function validateName(value: string): string | null {
  const nombre = cleanName(value);
  if (!nombre) return "Ingresá el nombre del operario.";
  if (nombre.length > 80) return "El nombre no puede superar los 80 caracteres.";
  return null;
}

/** "YYYY-MM-DD" -> Date a medianoche argentina. null si no es válida. */
function parseDateKey(value: string): Date | null {
  const key = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const date = dateFromKey(key);
  return dateKey(date) === key ? date : null;
}

export async function createOperario(
  nombre: string,
  fechaAlta?: string,
): Promise<OperarioResult> {
  await requireSession();

  const error = validateName(nombre);
  if (error) return { ok: false, error };

  const alta = fechaAlta?.trim()
    ? parseDateKey(fechaAlta)
    : dateFromKey(todayKey());
  if (!alta) return { ok: false, error: "La fecha de alta no es válida." };

  try {
    const operario = await prisma.operario.create({
      data: { nombre: cleanName(nombre), fechaAlta: alta },
      select: { id: true },
    });
    revalidatePath("/operarios");
    revalidatePath("/planilla");
    return { ok: true, id: operario.id };
  } catch (cause) {
    console.error(cause);
    return { ok: false, error: "No se pudo agregar el operario." };
  }
}

export async function renameOperario(
  id: number,
  nombre: string,
): Promise<OperarioResult> {
  await requireSession();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Operario inválido." };
  }

  const error = validateName(nombre);
  if (error) return { ok: false, error };

  try {
    await prisma.operario.update({
      where: { id },
      data: { nombre: cleanName(nombre) },
    });
    revalidatePath("/operarios");
    revalidatePath("/planilla");
    return { ok: true };
  } catch (cause) {
    console.error(cause);
    return { ok: false, error: "No se pudo guardar el nombre." };
  }
}

export async function updateOperarioPeriodo(
  id: number,
  fechaAlta: string | null,
  fechaBaja: string | null,
): Promise<OperarioResult> {
  await requireSession();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Operario inválido." };
  }

  let alta: Date | null = null;
  if (fechaAlta?.trim()) {
    alta = parseDateKey(fechaAlta);
    if (!alta) return { ok: false, error: "La fecha de alta no es válida." };
  }

  let baja: Date | null = null;
  if (fechaBaja?.trim()) {
    baja = parseDateKey(fechaBaja);
    if (!baja) return { ok: false, error: "La fecha de baja no es válida." };
  }

  if (alta && baja && alta > baja) {
    return {
      ok: false,
      error: "La fecha de alta no puede ser posterior a la de baja.",
    };
  }

  try {
    await prisma.operario.update({
      where: { id },
      data: { fechaAlta: alta, fechaBaja: baja },
    });
    revalidatePath("/operarios");
    revalidatePath("/planilla");
    return { ok: true };
  } catch (cause) {
    console.error(cause);
    return { ok: false, error: "No se pudieron guardar las fechas." };
  }
}

export async function deleteOperario(id: number): Promise<OperarioResult> {
  await requireSession();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Operario inválido." };
  }

  const operario = await prisma.operario.findUnique({
    where: { id },
    select: {
      _count: { select: { turnos: true, observaciones: true } },
    },
  });

  if (!operario) {
    return { ok: false, error: "El operario no existe." };
  }

  if (operario._count.turnos > 0 || operario._count.observaciones > 0) {
    return {
      ok: false,
      error:
        "Tiene horarios u observaciones cargados. Usá Dar de baja para conservar el historial.",
    };
  }

  try {
    await prisma.operario.delete({ where: { id } });
    revalidatePath("/operarios");
    revalidatePath("/planilla");
    return { ok: true };
  } catch (cause) {
    console.error(cause);
    return { ok: false, error: "No se pudo eliminar el operario." };
  }
}
