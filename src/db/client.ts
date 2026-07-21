import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "@/src/lib/env";

let cached: ReturnType<typeof drizzle> | null = null;

export function db() {
  if (cached) return cached;
  const sql = postgres(env.databaseUrl(), { max: 5, prepare: false });
  cached = drizzle(sql, { schema });
  return cached;
}
