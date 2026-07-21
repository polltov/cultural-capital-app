import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tourSlots, tours } from "@/src/db/schema";
import { cartSchema } from "@/src/lib/validation";
import type { HydratedCartItem } from "@/src/lib/cart-types";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = cartSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "BAD_INPUT", message: "invalid cart" },
      { status: 400 },
    );
  }
  const requested = parsed.data.items;
  const ids = requested.map((i) => i.slotId);
  const d = db();
  const rows = await d
    .select({
      slotId: tourSlots.id,
      status: tourSlots.status,
      startsAt: tourSlots.startsAt,
      seatsTotal: tourSlots.seatsTotal,
      seatsBooked: tourSlots.seatsBooked,
      tourSlug: tours.slug,
      tourTitle: tours.title,
      priceAdult: tours.priceAdult,
      priceChild: tours.priceChild,
    })
    .from(tourSlots)
    .innerJoin(tours, eq(tourSlots.tourId, tours.id))
    .where(inArray(tourSlots.id, ids));

  const byId = new Map(rows.map((r) => [r.slotId, r]));
  const items: HydratedCartItem[] = [];
  const removed: Array<{ slotId: string; reason: string }> = [];
  for (const it of requested) {
    const row = byId.get(it.slotId);
    if (!row) {
      removed.push({ slotId: it.slotId, reason: "missing" });
      continue;
    }
    if (row.status === "cancelled") {
      removed.push({ slotId: it.slotId, reason: "cancelled" });
      continue;
    }
    if (row.startsAt.getTime() < Date.now()) {
      removed.push({ slotId: it.slotId, reason: "past" });
      continue;
    }
    const seatsLeft = row.seatsTotal - row.seatsBooked;
    if (seatsLeft < 2) {
      removed.push({ slotId: it.slotId, reason: "sold-out" });
      continue;
    }
    let adult = Math.max(1, it.adult);
    let child = Math.max(1, it.child);
    if (adult + child > seatsLeft) {
      adult = Math.max(1, Math.min(adult, seatsLeft - 1));
      child = Math.max(1, seatsLeft - adult);
    }
    items.push({
      slotId: row.slotId,
      tourSlug: row.tourSlug,
      tourTitle: row.tourTitle,
      startsAt: row.startsAt.toISOString(),
      seatsLeft,
      priceAdult: row.priceAdult,
      priceChild: row.priceChild,
      adult,
      child,
    });
  }
  return NextResponse.json({ ok: true, items, removed });
}
