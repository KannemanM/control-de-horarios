import crypto from "node:crypto";

export function hashSecret(value: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(value, salt, 32).toString("hex");
  return `s1$${salt}$${derived}`;
}

export function verifySecret(value: string, stored: string): boolean {
  const [version, salt, hash] = stored.split("$");
  if (version !== "s1" || !salt || !hash) return false;
  const derived = crypto.scryptSync(value, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return (
    derived.length === expected.length && crypto.timingSafeEqual(derived, expected)
  );
}
