import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { insertTour, insertSlot } from "../helpers/fixtures";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

vi.mock("@/src/telegram/notify", () => ({ notifyAdmin: vi.fn(async () => {}) }));

async function post(body: unknown) {
  const { POST } = await import("@/app/api/orders/create/route");
  const req = new Request("http://x/api/orders/create", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  return { status: res.status, body: await res.json() };
}

describe("POST /api/orders/create", () => {
  it("creates on happy path", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 4 });
    const r = await post({ name: "Иван", phone: "+79990000000", email: "a@b.co", items: [{ slotId: s.id, adult: 1, child: 1 }] });
    expect(r.status).toBe(201);
    expect(r.body.ok).toBe(true);
    expect(r.body.data.orderId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns 409 on seats taken", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 2, seatsBooked: 2 });
    const r = await post({ name: "Ии", phone: "+79999", email: "a@b.co", items: [{ slotId: s.id, adult: 1, child: 1 }] });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe("SEATS_TAKEN");
  });

  it("returns 400 on bad input", async () => {
    const r = await post({ name: "", phone: "", email: "nope", items: [] });
    expect(r.status).toBe(400);
  });
});
