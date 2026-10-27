import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Mismo formato que lib/password.ts para que el login siga funcionando.
 * Formato: s1$<salt-hex>$<hash-hex>
 */
function hashSecret(value) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(value, salt, 32).toString("hex");
  return `s1$${salt}$${derived}`;
}

async function main() {
  const users = await prisma.usuario.count();

  if (users > 0) {
    console.log("Ya existe un usuario. No se crea otro administrador.");
    return;
  }

  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 6) {
    throw new Error(
      "Falta ADMIN_PASSWORD o tiene menos de 6 caracteres. Definila en el entorno antes de arrancar.",
    );
  }

  await prisma.usuario.create({
    data: { passwordHash: hashSecret(password) },
  });

  console.log("Administrador inicial creado correctamente.");
}

main()
  .catch((error) => {
    console.error("No se pudo inicializar el administrador:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
