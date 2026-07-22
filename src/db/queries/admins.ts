import { eq } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { admins } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function findAdminByEmail(d: DB, email: string) {
  const rows = await d.select().from(admins).where(eq(admins.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function createAdmin(d: DB, email: string, passwordHash: string) {
  const [row] = await d.insert(admins).values({ email: email.toLowerCase(), passwordHash }).returning();
  return row;
}
