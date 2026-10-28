import { createHash, randomBytes, randomInt } from "node:crypto";

const secret = () => process.env.AUTH_SECRET ?? "distinto-local-secret";

export function hashCode(value: string) {
  return createHash("sha256").update(`${secret()}:${value}`).digest("hex");
}

export function verificationCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function resetToken() {
  return randomBytes(32).toString("hex");
}
