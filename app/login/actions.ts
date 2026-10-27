"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, verifySecret } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Ingresá la contraseña." };
  }

  const user = await prisma.usuario.findFirst({
    orderBy: { id: "asc" },
  });

  if (!user || !verifySecret(password, user.passwordHash)) {
    return { error: "Contraseña incorrecta." };
  }

  await createSession(user.id);
  redirect("/planilla");
}
