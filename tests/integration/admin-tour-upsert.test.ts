import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { upsertTour, listAllTours } from "@/src/db/queries/tours";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

describe("upsertTour", () => {
  it("creates when no id", async () => {
    const t = await upsertTour(h.db, {
      slug: "new", title: "New", tag: "", route: "", durationMin: 60, meta: "",
      descriptionMd: "", priceAdult: 100000, priceChild: 50000, photoUrl: null, published: true,
    });
    expect(t.id).toMatch(/-/);
    expect((await listAllTours(h.db)).length).toBe(1);
  });

  it("updates when id given", async () => {
    const t = await upsertTour(h.db, {
      slug: "old", title: "Old", tag: "", route: "", durationMin: 60, meta: "",
      descriptionMd: "", priceAdult: 100, priceChild: 50, photoUrl: null, published: true,
    });
    const t2 = await upsertTour(h.db, { ...t, title: "New title", priceAdult: t.priceAdult, priceChild: t.priceChild });
    expect(t2.title).toBe("New title");
    expect(t2.id).toBe(t.id);
  });
});
