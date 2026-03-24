import { randomBytes, randomUUID } from "crypto";

/**
 * Generate a Microsoft-style object ID (UUID v4 format).
 */
export function generateOid(): string {
  return randomUUID();
}

/**
 * Generate a Microsoft-style tenant ID (UUID v4 format).
 */
export function generateTenantId(): string {
  return randomUUID();
}

/**
 * Generate a random subject identifier for the id_token `sub` claim.
 * Microsoft uses a pairwise, opaque, app-specific identifier.
 */
export function generateSubjectId(): string {
  return randomBytes(16).toString("base64url");
}
