import type { db } from "@/src/db/client";
import { tours, tourSlots } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function insertTour(d: DB, over: Partial<typeof tours.$inferInsert> = {}) {
  const [row] = await d.insert(tours).values({
    slug: over.slug ?? `t-${Math.random().toString(36).slice(2, 8)}`,
    title: over.title ?? "Тестовая экскурсия",
    priceAdult: over.priceAdult ?? 100000,
    priceChild: over.priceChild ?? 50000,
    published: over.published ?? true,
    ...over,
  }).returning();
  return row;
}

export async function insertSlot(
  d: DB,
  tourId: string,
  over: Partial<typeof tourSlots.$inferInsert> = {},
) {
  const [row] = await d.insert(tourSlots).values({
    tourId,
    startsAt: over.startsAt ?? new Date(Date.now() + 7 * 86400_000),
    seatsTotal: over.seatsTotal ?? 8,
    seatsBooked: over.seatsBooked ?? 0,
    status: over.status ?? "active",
    ...over,
  }).returning();
  return row;
}
