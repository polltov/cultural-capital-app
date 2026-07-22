import { randomBytes, createHash } from "node:crypto";
import { db } from "@/src/db/client";
import { insertSession, findAdminByToken, deleteSession } from "@/src/db/queries/sessions";

export const SESSION_COOKIE = "cc_admin_session";
export const SESSION_TTL_DAYS = 30;

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await insertSession(db(), adminId, tokenHash, expiresAt);
  return { token, expiresAt };
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  return findAdminByToken(db(), hash(token));
}

export async function revokeSession(token: string) {
  await deleteSession(db(), hash(token));
}
