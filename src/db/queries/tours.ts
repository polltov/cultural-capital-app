import { asc, desc, eq } from "drizzle-orm";
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

export async function listAllTours(d: DB) {
  return d.select().from(tours).orderBy(desc(tours.createdAt));
}

export async function upsertTour(d: DB, input: {
  id?: string; slug: string; title: string; tag: string; route: string; durationMin: number;
  meta: string; descriptionMd: string; priceAdult: number; priceChild: number;
  photoUrl: string | null; published: boolean;
}) {
  if (input.id) {
    const [row] = await d.update(tours).set({ ...input, updatedAt: new Date() })
      .where(eq(tours.id, input.id)).returning();
    return row;
  }
  const [row] = await d.insert(tours).values(input).returning();
  return row;
}

export async function deleteTour(d: DB, id: string) {
  await d.delete(tours).where(eq(tours.id, id));
}
