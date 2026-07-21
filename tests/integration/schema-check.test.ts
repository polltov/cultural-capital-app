import { describe, it, expect, afterAll } from "vitest";
import { makeTestDb } from "../helpers/db";

const h = await makeTestDb();
afterAll(async () => h.cleanup());

describe("schema", () => {
  it("has expected tables", async () => {
    const rows = await h.client`
      select tablename from pg_tables where schemaname='public'
    ` as unknown as { tablename: string }[];
    const names = rows.map((r) => r.tablename).sort();
    expect(names).toEqual(expect.arrayContaining([
      "admin_sessions", "admins", "order_items", "orders", "tour_slots", "tours",
    ]));
  });
});
