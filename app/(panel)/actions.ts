"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { destroySession, requireSession } from "@/lib/auth";
import { hashSecret, verifySecret } from "@/lib/password";

export type PasswordResult = { ok: boolean; error?: string };

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(
  formData: FormData,
): Promise<PasswordResult> {
  const session = await requireSession();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || !confirm) {
    return { ok: false, error: "Completá todos los campos." };
  }
  if (next.length < 6) {
    return { ok: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
  }
  if (next !== confirm) {
    return { ok: false, error: "Las contraseñas nuevas no coinciden." };
  }

  const user = await prisma.usuario.findUnique({ where: { id: session.id } });
  if (!user || !verifySecret(current, user.passwordHash)) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }

  await prisma.usuario.update({
    where: { id: user.id },
    data: { passwordHash: hashSecret(next) },
  });

  return { ok: true };
}
