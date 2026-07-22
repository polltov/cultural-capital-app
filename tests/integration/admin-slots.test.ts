import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { insertTour, insertSlot } from "../helpers/fixtures";
import { upsertSlot, cancelSlot, listSlotsForTour } from "@/src/db/queries/slots";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

describe("slots admin ops", () => {
  it("creates new slot", async () => {
    const t = await insertTour(h.db);
    const s = await upsertSlot(h.db, { tourId: t.id, startsAt: new Date(Date.now() + 3 * 86400_000), seatsTotal: 6 });
    expect(s.tourId).toBe(t.id);
    expect((await listSlotsForTour(h.db, t.id)).length).toBe(1);
  });

  it("rejects lowering seatsTotal below booked", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 5, seatsBooked: 3 });
    await expect(upsertSlot(h.db, {
      id: s.id, tourId: t.id, startsAt: s.startsAt, seatsTotal: 2,
    })).rejects.toThrow(/SEATS_TOTAL_BELOW_BOOKED/);
  });

  it("cancels a slot", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id);
    await cancelSlot(h.db, s.id);
    const row = await h.client`select status from tour_slots where id = ${s.id}`;
    expect(row[0].status).toBe("cancelled");
  });
});
