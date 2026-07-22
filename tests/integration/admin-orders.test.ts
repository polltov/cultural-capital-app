import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { insertTour, insertSlot } from "../helpers/fixtures";
import { createOrderAtomic, cancelOrderAndReleaseSeats, confirmOrder } from "@/src/db/queries/orders";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

describe("admin order operations", () => {
  it("confirm sets status", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 4 });
    const r = await createOrderAtomic(h.db, {
      customer: { name: "И", phone: "+7", email: "a@b.c" },
      items: [{ slotId: s.id, adult: 1, child: 1 }],
    });
    if (!r.ok) throw new Error();
    await confirmOrder(h.db, r.data.orderId);
    const row = await h.client`select status from orders where id = ${r.data.orderId}`;
    expect(row[0].status).toBe("confirmed");
  });

  it("cancel releases seats", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 4 });
    const r = await createOrderAtomic(h.db, {
      customer: { name: "И", phone: "+7", email: "a@b.c" },
      items: [{ slotId: s.id, adult: 2, child: 1 }],
    });
    if (!r.ok) throw new Error();
    await cancelOrderAndReleaseSeats(h.db, r.data.orderId, "no show");
    const slot = await h.client`select seats_booked from tour_slots where id = ${s.id}`;
    expect(slot[0].seats_booked).toBe(0);
    const order = await h.client`select status, admin_note from orders where id = ${r.data.orderId}`;
    expect(order[0]).toMatchObject({ status: "cancelled", admin_note: "no show" });
  });
});
