import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

export function sqlClient() {
  return postgres(process.env.DATABASE_URL!, { max: 2, prepare: false });
}

export async function truncate() {
  const s = sqlClient();
  await s`TRUNCATE TABLE order_items, orders, tour_slots, tours, admin_sessions, admins RESTART IDENTITY CASCADE`;
  await s.end();
}

export async function seedTourWithSlot() {
  const s = sqlClient();
  const [t] = await s`INSERT INTO tours (slug, title, price_adult, price_child, published)
    VALUES ('e2e', 'E2E', 100000, 50000, true) RETURNING id, slug`;
  const [slot] = await s`INSERT INTO tour_slots (tour_id, starts_at, seats_total)
    VALUES (${t.id}, now() + interval '7 days', 8) RETURNING id`;
  await s.end();
  return { tourSlug: t.slug, slotId: slot.id };
}
