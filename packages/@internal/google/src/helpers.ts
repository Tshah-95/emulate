import { randomBytes } from "crypto";

export function generateUid(prefix = ""): string {
  const id = randomBytes(12).toString("base64url").slice(0, 20);
  return prefix ? `${prefix}_${id}` : id;
}
