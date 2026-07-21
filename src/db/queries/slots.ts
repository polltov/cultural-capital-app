import { and, asc, eq, gt, gte, sql } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { tourSlots } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function listUpcomingSlotsForTour(d: DB, tourId: string) {
  return d.select().from(tourSlots).where(
    and(
      eq(tourSlots.tourId, tourId),
      eq(tourSlots.status, "active"),
      gte(tourSlots.startsAt, new Date()),
      gt(sql`${tourSlots.seatsTotal} - ${tourSlots.seatsBooked}`, 0),
    ),
  ).orderBy(asc(tourSlots.startsAt));
}

export async function getSlotById(d: DB, id: string) {
  const rows = await d.select().from(tourSlots).where(eq(tourSlots.id, id)).limit(1);
  return rows[0] ?? null;
}
