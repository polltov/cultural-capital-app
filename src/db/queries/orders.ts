import { and, eq, sql } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { orders, orderItems, tourSlots, tours } from "@/src/db/schema";
import { type Result, ok, err } from "@/src/lib/result";

type DB = ReturnType<typeof db>;

type Input = {
  customer: { name: string; phone: string; email: string };
  items: Array<{ slotId: string; adult: number; child: number }>;
};

export type OrderCreateError = "SEATS_TAKEN" | "SLOT_MISSING" | "SLOT_INACTIVE";

export async function createOrderAtomic(
  d: DB,
  input: Input,
): Promise<Result<{ orderId: string; orderNumber: number; totalAmount: number }, OrderCreateError>> {
  try {
    return await d.transaction(async (tx) => {
      let total = 0;
      const snapshots: Array<{ slotId: string; adult: number; child: number; pa: number; pc: number }> = [];

      for (const it of input.items) {
        const need = it.adult + it.child;
        const updated = await tx.execute(sql`
          UPDATE tour_slots
          SET seats_booked = seats_booked + ${need}
          WHERE id = ${it.slotId}
            AND status = 'active'
            AND seats_booked + ${need} <= seats_total
          RETURNING tour_id
        `);
        const row = (updated as unknown as { rows?: Array<{ tour_id: string }> }).rows?.[0]
          ?? (Array.isArray(updated) ? (updated as Array<{ tour_id: string }>)[0] : undefined);
        if (!row) {
          throw new Error("SEATS_TAKEN");
        }
        const tourRow = await tx.select({
          priceAdult: tours.priceAdult, priceChild: tours.priceChild,
        }).from(tours).where(eq(tours.id, row.tour_id)).limit(1);
        const t = tourRow[0];
        if (!t) throw new Error("SLOT_MISSING");
        snapshots.push({
          slotId: it.slotId, adult: it.adult, child: it.child,
          pa: t.priceAdult, pc: t.priceChild,
        });
        total += it.adult * t.priceAdult + it.child * t.priceChild;
      }

      const [order] = await tx.insert(orders).values({
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        customerEmail: input.customer.email,
        status: "pending",
        totalAmount: total,
      }).returning({ id: orders.id, orderNumber: orders.orderNumber });

      await tx.insert(orderItems).values(snapshots.map((s) => ({
        orderId: order.id,
        slotId: s.slotId,
        adultCount: s.adult,
        childCount: s.child,
        priceAdultSnapshot: s.pa,
        priceChildSnapshot: s.pc,
      })));

      return ok({ orderId: order.id, orderNumber: order.orderNumber, totalAmount: total });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "SEATS_TAKEN") return err("SEATS_TAKEN", "Мест уже нет, обновите корзину");
    if (msg === "SLOT_MISSING") return err("SLOT_MISSING", "Слот не найден");
    throw e;
  }
}

export async function getOrderWithItems(d: DB, orderId: string) {
  const [o] = await d.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!o) return null;
  const items = await d.select({
    id: orderItems.id, adultCount: orderItems.adultCount, childCount: orderItems.childCount,
    priceAdultSnapshot: orderItems.priceAdultSnapshot, priceChildSnapshot: orderItems.priceChildSnapshot,
    slotId: orderItems.slotId,
    startsAt: tourSlots.startsAt,
    tourTitle: tours.title, tourSlug: tours.slug,
  })
  .from(orderItems)
  .innerJoin(tourSlots, eq(orderItems.slotId, tourSlots.id))
  .innerJoin(tours, eq(tourSlots.tourId, tours.id))
  .where(eq(orderItems.orderId, orderId));
  return { order: o, items };
}

export async function listRecentOrders(d: DB, limit = 100) {
  return d.select().from(orders).orderBy(sql`${orders.createdAt} desc`).limit(limit);
}

export async function confirmOrder(d: DB, orderId: string, note?: string) {
  await d.update(orders).set({ status: "confirmed", adminNote: note ?? null, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
}

export async function cancelOrderAndReleaseSeats(d: DB, orderId: string, note?: string) {
  return d.transaction(async (tx) => {
    const [o] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!o) throw new Error("ORDER_MISSING");
    if (o.status === "cancelled") return;
    const items = await tx.select({ slotId: orderItems.slotId, adult: orderItems.adultCount, child: orderItems.childCount })
      .from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const it of items) {
      await tx.execute(sql`
        UPDATE tour_slots SET seats_booked = GREATEST(0, seats_booked - ${it.adult + it.child})
        WHERE id = ${it.slotId}
      `);
    }
    await tx.update(orders).set({ status: "cancelled", adminNote: note ?? null, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });
}
