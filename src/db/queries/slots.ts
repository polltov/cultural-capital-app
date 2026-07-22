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

export async function listSlotsForTour(d: DB, tourId: string) {
  return d.select().from(tourSlots).where(eq(tourSlots.tourId, tourId)).orderBy(asc(tourSlots.startsAt));
}

export async function upsertSlot(d: DB, input: {
  id?: string; tourId: string; startsAt: Date; seatsTotal: number;
}) {
  if (input.id) {
    const [existing] = await d.select({ booked: tourSlots.seatsBooked }).from(tourSlots).where(eq(tourSlots.id, input.id)).limit(1);
    if (!existing) throw new Error("SLOT_MISSING");
    if (input.seatsTotal < existing.booked) throw new Error("SEATS_TOTAL_BELOW_BOOKED");
    const [row] = await d.update(tourSlots).set({
      startsAt: input.startsAt, seatsTotal: input.seatsTotal,
    }).where(eq(tourSlots.id, input.id)).returning();
    return row;
  }
  const [row] = await d.insert(tourSlots).values({
    tourId: input.tourId, startsAt: input.startsAt, seatsTotal: input.seatsTotal,
  }).returning();
  return row;
}

export async function cancelSlot(d: DB, id: string) {
  await d.update(tourSlots).set({ status: "cancelled" }).where(eq(tourSlots.id, id));
}
