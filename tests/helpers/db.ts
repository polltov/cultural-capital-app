import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/src/db/schema";
import { sql } from "drizzle-orm";

export async function makeTestDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required for integration tests");
  const client = postgres(url, { max: 3, prepare: false });
  const db = drizzle(client, { schema });
  return { db, client, cleanup: () => client.end() };
}

export async function truncateAll(client: postgres.Sql) {
  await client`TRUNCATE TABLE order_items, orders, tour_slots, tours, admin_sessions, admins RESTART IDENTITY CASCADE`;
}

export const sqlHelpers = { sql };
