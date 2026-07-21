import { asc, eq } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { tours } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function listPublishedTours(d: DB) {
  return d.select().from(tours).where(eq(tours.published, true)).orderBy(asc(tours.createdAt));
}

export async function getTourBySlug(d: DB, slug: string) {
  const rows = await d.select().from(tours).where(eq(tours.slug, slug)).limit(1);
  const t = rows[0];
  if (!t || !t.published) return null;
  return t;
}

export async function getTourById(d: DB, id: string) {
  const rows = await d.select().from(tours).where(eq(tours.id, id)).limit(1);
  return rows[0] ?? null;
}
