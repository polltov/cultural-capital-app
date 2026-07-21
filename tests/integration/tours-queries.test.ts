import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { insertTour } from "../helpers/fixtures";
import { listPublishedTours, getTourBySlug } from "@/src/db/queries/tours";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

describe("listPublishedTours", () => {
  it("returns only published tours ordered by createdAt asc", async () => {
    const a = await insertTour(h.db, { slug: "a", title: "A", published: true });
    await insertTour(h.db, { slug: "b", title: "B", published: false });
    const c = await insertTour(h.db, { slug: "c", title: "C", published: true });
    const rows = await listPublishedTours(h.db);
    expect(rows.map((r) => r.slug)).toEqual([a.slug, c.slug]);
  });
});

describe("getTourBySlug", () => {
  it("returns tour when published", async () => {
    const t = await insertTour(h.db, { slug: "x", published: true });
    expect(await getTourBySlug(h.db, "x")).toMatchObject({ id: t.id });
  });
  it("returns null when unpublished", async () => {
    await insertTour(h.db, { slug: "y", published: false });
    expect(await getTourBySlug(h.db, "y")).toBeNull();
  });
});
