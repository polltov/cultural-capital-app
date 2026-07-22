import { eq, lt, sql } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { adminSessions, admins } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function insertSession(d: DB, adminId: string, tokenHash: string, expiresAt: Date) {
  const [row] = await d.insert(adminSessions).values({ adminId, tokenHash, expiresAt }).returning();
  return row;
}

export async function findAdminByToken(d: DB, tokenHash: string) {
  const rows = await d
    .select({
      adminId: admins.id,
      email: admins.email,
      expiresAt: adminSessions.expiresAt,
    })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .where(eq(adminSessions.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return { id: row.adminId, email: row.email };
}

export async function deleteSession(d: DB, tokenHash: string) {
  await d.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
}

export async function pruneExpiredSessions(d: DB) {
  await d.delete(adminSessions).where(lt(adminSessions.expiresAt, sql`now()`));
}
