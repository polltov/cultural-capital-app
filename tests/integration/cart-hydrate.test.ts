import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { insertTour, insertSlot } from "../helpers/fixtures";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

async function post(body: unknown) {
  const { POST } = await import("@/app/api/cart/hydrate/route");
  const req = new Request("http://x/api/cart/hydrate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  return { status: res.status, body: await res.json() };
}

describe("POST /api/cart/hydrate", () => {
  it("returns hydrated items for valid slots", async () => {
    const t = await insertTour(h.db, { slug: "z", title: "Z" });
    const s = await insertSlot(h.db, t.id, { seatsTotal: 5, seatsBooked: 1 });
    const r = await post({ items: [{ slotId: s.id, adult: 2, child: 1 }] });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.items[0]).toMatchObject({
      slotId: s.id, tourSlug: "z", tourTitle: "Z", seatsLeft: 4, adult: 2, child: 1,
    });
  });

  it("removes cancelled slot with reason", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { status: "cancelled" });
    const r = await post({ items: [{ slotId: s.id, adult: 1, child: 1 }] });
    expect(r.body.items).toEqual([]);
    expect(r.body.removed[0]).toMatchObject({ slotId: s.id, reason: "cancelled" });
  });

  it("clamps requested counts to seatsLeft", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 3, seatsBooked: 0 });
    const r = await post({ items: [{ slotId: s.id, adult: 5, child: 1 }] });
    expect(r.body.items[0].adult + r.body.items[0].child).toBeLessThanOrEqual(3);
    expect(r.body.items[0].adult).toBeGreaterThanOrEqual(1);
    expect(r.body.items[0].child).toBeGreaterThanOrEqual(1);
  });

  it("rejects malformed input", async () => {
    const r = await post({ items: [] });
    expect(r.status).toBe(400);
  });
});
