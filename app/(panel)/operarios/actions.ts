"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

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

export async function createOperario(nombre: string): Promise<OperarioResult> {
  await requireSession();

  const error = validateName(nombre);
  if (error) return { ok: false, error };

  try {
    const operario = await prisma.operario.create({
      data: { nombre: cleanName(nombre) },
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

export async function deleteOperario(id: number): Promise<OperarioResult> {
  await requireSession();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Operario inválido." };
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
