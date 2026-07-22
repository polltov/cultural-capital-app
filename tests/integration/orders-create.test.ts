import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { insertTour, insertSlot } from "../helpers/fixtures";
import { createOrderAtomic } from "@/src/db/queries/orders";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

describe("createOrderAtomic", () => {
  it("reserves seats and creates order", async () => {
    const t = await insertTour(h.db, { priceAdult: 100000, priceChild: 50000 });
    const s = await insertSlot(h.db, t.id, { seatsTotal: 5 });
    const res = await createOrderAtomic(h.db, {
      customer: { name: "Иван", phone: "+79990000000", email: "a@b.c" },
      items: [{ slotId: s.id, adult: 2, child: 1 }],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error();
    const slot = await h.client`select seats_booked, seats_total from tour_slots where id = ${s.id}`;
    expect(slot[0].seats_booked).toBe(3);
    const items = await h.client`select adult_count, child_count, price_adult_snapshot from order_items where order_id = ${res.data.orderId}`;
    expect(items[0]).toMatchObject({ adult_count: 2, child_count: 1, price_adult_snapshot: 100000 });
  });

  it("rolls back if any slot fails guard", async () => {
    const t = await insertTour(h.db);
    const okSlot = await insertSlot(h.db, t.id, { seatsTotal: 5 });
    const fullSlot = await insertSlot(h.db, t.id, { seatsTotal: 2, seatsBooked: 2 });
    const res = await createOrderAtomic(h.db, {
      customer: { name: "И", phone: "+7999", email: "a@b.c" },
      items: [
        { slotId: okSlot.id, adult: 1, child: 1 },
        { slotId: fullSlot.id, adult: 1, child: 1 },
      ],
    });
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error();
    expect(res.code).toBe("SEATS_TAKEN");
    const rows = await h.client`select id from orders`;
    expect(rows.length).toBe(0);
    const s = await h.client`select seats_booked from tour_slots where id = ${okSlot.id}`;
    expect(s[0].seats_booked).toBe(0);
  });

  it("computes total from snapshot prices", async () => {
    const t = await insertTour(h.db, { priceAdult: 100000, priceChild: 40000 });
    const s = await insertSlot(h.db, t.id, { seatsTotal: 10 });
    const res = await createOrderAtomic(h.db, {
      customer: { name: "И", phone: "+7999", email: "a@b.c" },
      items: [{ slotId: s.id, adult: 2, child: 3 }],
    });
    if (!res.ok) throw new Error(res.message);
    expect(res.data.totalAmount).toBe(2 * 100000 + 3 * 40000);
  });

  it("concurrent last-seat: one wins, one loses", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 2 });
    const c = { name: "И", phone: "+7999", email: "a@b.c" };
    const [a, b] = await Promise.all([
      createOrderAtomic(h.db, { customer: c, items: [{ slotId: s.id, adult: 1, child: 1 }] }),
      createOrderAtomic(h.db, { customer: c, items: [{ slotId: s.id, adult: 1, child: 1 }] }),
    ]);
    const oks = [a, b].filter((r) => r.ok);
    const fails = [a, b].filter((r) => !r.ok);
    expect(oks.length).toBe(1);
    expect(fails.length).toBe(1);
    const s2 = await h.client`select seats_booked from tour_slots where id = ${s.id}`;
    expect(s2[0].seats_booked).toBe(2);
  });
});
