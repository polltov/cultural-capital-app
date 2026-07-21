# Cultural Capital User Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 16 booking app for family excursions in Saint Petersburg: public catalog + multi-item cart with adult/child counters + guest checkout with atomic seat reservation + email/password admin panel with tour/slot CRUD + Telegram notifications on new orders.

**Architecture:** App Router SSR for public pages; Server Actions for mutations; Drizzle ORM over Neon Postgres for data + atomic reservation transactions; localStorage cart with server hydration at checkout; opaque session-token cookie for admin auth; Vercel Blob for tour photos; best-effort TG bot ping on new orders.

**Tech Stack:** Next.js 16.2 (App Router, Turbopack, Server Actions), TypeScript, Tailwind v4, Drizzle 0.45 + `drizzle-kit`, `postgres`, Neon Postgres 18, Vercel Blob, `bcryptjs`, `zod`, Vitest 4 + `@testing-library/react`, Playwright, ESLint 9, Prettier.

**Spec:** `docs/superpowers/specs/2026-07-22-cultural-capital-user-flow-design.md`

**Repo:** new — `~/projects/cultural-capital-app`

---

## File Structure

Top-level layout (created incrementally through the phases):

```
cultural-capital-app/
├── app/                                  # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                          # public catalog
│   ├── tours/[slug]/page.tsx             # tour detail
│   ├── cart/page.tsx                     # cart (client component)
│   ├── orders/[id]/success/page.tsx      # order success
│   ├── admin/
│   │   ├── layout.tsx                    # sidebar shell (protected)
│   │   ├── login/page.tsx                # login form
│   │   ├── page.tsx                      # dashboard
│   │   ├── orders/page.tsx               # orders table
│   │   ├── orders/[id]/page.tsx          # order detail
│   │   ├── tours/page.tsx                # tours list
│   │   ├── tours/new/page.tsx            # new tour form
│   │   ├── tours/[id]/edit/page.tsx      # edit tour form
│   │   └── tours/[id]/slots/page.tsx     # slots CRUD
│   └── api/
│       ├── cart/hydrate/route.ts
│       └── admin/upload/route.ts
├── src/
│   ├── db/
│   │   ├── client.ts                     # Neon client factory
│   │   ├── schema.ts                     # Drizzle schema
│   │   └── queries/
│   │       ├── tours.ts
│   │       ├── slots.ts
│   │       ├── orders.ts                 # incl. atomic reservation
│   │       ├── admins.ts
│   │       └── sessions.ts
│   ├── lib/
│   │   ├── env.ts                        # typed env access
│   │   ├── money.ts                      # kopecks <-> rubles helpers
│   │   ├── validation.ts                 # zod schemas (order, cart, tour)
│   │   ├── cart-types.ts                 # shared cart types
│   │   └── result.ts                     # {ok:true,data}|{ok:false,code,msg}
│   ├── auth/
│   │   ├── password.ts                   # bcrypt wrappers
│   │   ├── session.ts                    # create/verify sessions
│   │   └── require-admin.ts              # server-side guard helper
│   ├── telegram/
│   │   └── notify.ts                     # sendMessage wrapper
│   ├── actions/
│   │   ├── create-order.ts               # Server Action
│   │   ├── admin-login.ts
│   │   ├── admin-logout.ts
│   │   ├── admin-order-confirm.ts
│   │   ├── admin-order-cancel.ts
│   │   ├── admin-tour-upsert.ts
│   │   ├── admin-tour-delete.ts
│   │   ├── admin-slot-upsert.ts
│   │   └── admin-slot-cancel.ts
│   └── components/
│       ├── public/                       # catalog, tour card, cart UI
│       └── admin/                        # tables, forms
├── scripts/
│   ├── migrate.ts                        # drizzle migrator
│   ├── create-admin.ts                   # CLI to seed first admin
│   └── seed-dev.ts                       # dev data
├── drizzle/                              # generated SQL migrations
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/                              # Playwright
│   └── helpers/
├── middleware.ts                         # /admin/* protection
├── .env.example / .env.local
├── drizzle.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── .github/workflows/security.yml
```

**Why this split:**
- `src/db/queries/` isolates SQL so components stay thin and testable.
- `src/actions/` centralises Server Actions so their contracts are grep-able and unit tests can import them directly.
- `src/auth/` groups all auth concerns; UI never touches bcrypt directly.
- `src/telegram/` is one file only — no room for over-abstraction.
- `app/` has only UI + wiring; all logic lives under `src/`.

---

## Phase 0 — Project scaffold

### Task 0.1: Initialise Next.js 16 app

**Files:**
- Create: `~/projects/cultural-capital-app/*` (via `create-next-app`)

- [ ] **Step 1: Scaffold the app**

```bash
cd ~/projects
npx --yes create-next-app@16.2.10 cultural-capital-app \
  --typescript --tailwind --app --turbopack \
  --eslint --src-dir=false --import-alias='@/*' --use-npm --no-git
cd cultural-capital-app
```

Expected: Next 16.2.10 project scaffolded in `cultural-capital-app/`.

- [ ] **Step 2: Verify boot**

```bash
npm run dev -- --port 4173 &
sleep 4
curl -sSf http://localhost:4173/ >/dev/null && echo OK
kill %1
```

Expected: `OK`.

- [ ] **Step 3: Initialise git**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 16 app"
```

### Task 0.2: Install project dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install drizzle-orm@^0.45.0 postgres@^3.4.5 zod@^3.23.8 bcryptjs@^2.4.3 @vercel/blob@^0.27.0
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D drizzle-kit@^0.30.0 vitest@^4.1.0 @vitest/coverage-v8@^4.1.0 \
  @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 jsdom@^25.0.1 \
  @playwright/test@^1.49.0 dotenv@^16.4.5 @types/bcryptjs@^2.4.6 \
  tsx@^4.19.2
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install deps (drizzle, zod, bcryptjs, vitest, playwright)"
```

### Task 0.3: Wire scripts, tsconfig paths, env

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `.env.example`
- Create: `.env.local` (git-ignored)
- Modify: `.gitignore`

- [ ] **Step 1: Add scripts to package.json**

Replace the `"scripts"` block:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx scripts/migrate.ts",
  "db:studio": "drizzle-kit studio",
  "admin:create": "tsx scripts/create-admin.ts",
  "seed:dev": "tsx scripts/seed-dev.ts"
}
```

- [ ] **Step 2: Ensure `paths` in tsconfig**

`tsconfig.json` should already contain `"paths": { "@/*": ["./*"] }` from create-next-app. Verify with `cat tsconfig.json | grep -A1 paths` — no change needed if present.

- [ ] **Step 3: Create `.env.example`**

```
DATABASE_URL=postgres://user:pass@host/db
BLOB_READ_WRITE_TOKEN=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_ID=
SESSION_SECRET=change-me-32-chars-minimum-please
PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 4: Create `.env.local`**

Copy `.env.example` to `.env.local`. Fill `DATABASE_URL` with the Neon connection string once created (Phase 0.5). Leave others blank until needed.

- [ ] **Step 5: Ignore `.env.local`**

Append to `.gitignore` if missing:

```
.env.local
.env.*.local
/coverage
/playwright-report
/test-results
```

- [ ] **Step 6: Commit**

```bash
git add package.json .env.example .gitignore
git commit -m "chore: add scripts and env template"
```

### Task 0.4: Vitest config

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Write vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    coverage: { reporter: ["text", "html"], exclude: ["**/*.d.ts", "tests/**"] },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
```

- [ ] **Step 2: Write tests/setup.ts**

```ts
import { config } from "dotenv";
config({ path: ".env.local" });
```

- [ ] **Step 3: Sanity test**

Create `tests/unit/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run**

```bash
npm test
```

Expected: `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/
git commit -m "chore: vitest config with dotenv"
```

### Task 0.5: Provision Neon project + set DATABASE_URL

**Files:** none

- [ ] **Step 1: Create Neon project (manual)**

In the Neon console create project `cultural-capital`, region `us-east-1` (aws-us-east-1). Create branch `main` (default). Copy the pooled connection string.

- [ ] **Step 2: Paste into `.env.local`**

Set `DATABASE_URL=<pooled connection string>` in `.env.local`.

- [ ] **Step 3: Verify connectivity**

Run:

```bash
npx tsx -e "import postgres from 'postgres'; import { config } from 'dotenv'; config({path:'.env.local'}); const s = postgres(process.env.DATABASE_URL!, {max:1}); const r = await s\`select 1 as ok\`; console.log(r[0]); await s.end();"
```

Expected: `{ ok: 1 }`.

---

## Phase 1 — Data model & migrations

### Task 1.1: Drizzle client + config

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/db/client.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Write env accessor**

`src/lib/env.ts`:

```ts
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  sessionSecret: () => required("SESSION_SECRET"),
  publicBaseUrl: () => required("PUBLIC_BASE_URL"),
  blobToken: () => required("BLOB_READ_WRITE_TOKEN"),
  telegram: () => ({
    token: required("TELEGRAM_BOT_TOKEN"),
    adminId: required("TELEGRAM_ADMIN_ID"),
  }),
};
```

- [ ] **Step 2: Write db client**

`src/db/client.ts`:

```ts
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
```

- [ ] **Step 3: Write drizzle.config.ts**

```ts
import type { Config } from "drizzle-kit";
import { config } from "dotenv";
config({ path: ".env.local" });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/env.ts src/db/client.ts drizzle.config.ts
git commit -m "feat(db): drizzle client + typed env accessor"
```

### Task 1.2: Schema definition

**Files:**
- Create: `src/db/schema.ts`

- [ ] **Step 1: Write schema**

```ts
import {
  pgTable, uuid, text, integer, timestamp, boolean, serial, check, pgEnum, index, unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const slotStatus = pgEnum("slot_status", ["active", "cancelled"]);
export const orderStatus = pgEnum("order_status", ["pending", "confirmed", "cancelled", "paid"]);

export const tours = pgTable("tours", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  tag: text("tag").notNull().default(""),
  route: text("route").notNull().default(""),
  durationMin: integer("duration_min").notNull().default(0),
  meta: text("meta").notNull().default(""),
  descriptionMd: text("description_md").notNull().default(""),
  priceAdult: integer("price_adult").notNull(),
  priceChild: integer("price_child").notNull(),
  photoUrl: text("photo_url"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  priceAdultChk: check("tours_price_adult_nonneg", sql`${t.priceAdult} >= 0`),
  priceChildChk: check("tours_price_child_nonneg", sql`${t.priceChild} >= 0`),
}));

export const tourSlots = pgTable("tour_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tourId: uuid("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  seatsTotal: integer("seats_total").notNull(),
  seatsBooked: integer("seats_booked").notNull().default(0),
  status: slotStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bookedChk: check("slots_booked_within_total", sql`${t.seatsBooked} >= 0 AND ${t.seatsBooked} <= ${t.seatsTotal}`),
  byTourStart: index("slots_tour_start_idx").on(t.tourId, t.startsAt),
  byStatusStart: index("slots_status_start_idx").on(t.status, t.startsAt),
}));

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: serial("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  status: orderStatus("status").notNull().default("pending"),
  totalAmount: integer("total_amount").notNull(),
  paymentId: text("payment_id"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  numberUnique: unique("orders_number_unique").on(t.orderNumber),
  byCreated: index("orders_created_desc_idx").on(t.createdAt),
}));

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  slotId: uuid("slot_id").notNull().references(() => tourSlots.id, { onDelete: "restrict" }),
  adultCount: integer("adult_count").notNull(),
  childCount: integer("child_count").notNull(),
  priceAdultSnapshot: integer("price_adult_snapshot").notNull(),
  priceChildSnapshot: integer("price_child_snapshot").notNull(),
}, (t) => ({
  adultChk: check("items_adult_min", sql`${t.adultCount} >= 1`),
  childChk: check("items_child_min", sql`${t.childCount} >= 1`),
}));

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (t) => ({
  byToken: index("sessions_token_idx").on(t.tokenHash),
}));
```

- [ ] **Step 2: Generate migration**

```bash
npm run db:generate
```

Expected: `drizzle/0000_*.sql` created with CREATE TABLE + CHECK + INDEX + ENUM statements.

- [ ] **Step 3: Write migrate script**

`scripts/migrate.ts`:

```ts
import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");
const client = postgres(url, { max: 1 });
const db = drizzle(client);
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("migrated");
await client.end();
```

- [ ] **Step 4: Run migration**

```bash
npm run db:migrate
```

Expected: `migrated`.

- [ ] **Step 5: Verify tables exist**

```bash
npx tsx -e "import postgres from 'postgres'; import {config} from 'dotenv'; config({path:'.env.local'}); const s = postgres(process.env.DATABASE_URL!,{max:1}); const r = await s\`select tablename from pg_tables where schemaname='public' order by tablename\`; console.log(r.map(x=>x.tablename)); await s.end();"
```

Expected includes `tours`, `tour_slots`, `orders`, `order_items`, `admins`, `admin_sessions`.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts drizzle/ scripts/migrate.ts
git commit -m "feat(db): initial schema + migrations"
```

### Task 1.3: Result type + money helpers

**Files:**
- Create: `src/lib/result.ts`
- Create: `src/lib/money.ts`
- Create: `tests/unit/money.test.ts`

- [ ] **Step 1: Write result type**

`src/lib/result.ts`:

```ts
export type Result<T, C extends string = string> =
  | { ok: true; data: T }
  | { ok: false; code: C; message: string };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const err = <C extends string>(code: C, message: string): Result<never, C> =>
  ({ ok: false, code, message });
```

- [ ] **Step 2: Write failing money tests**

`tests/unit/money.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { rublesToKopecks, kopecksToRubles, formatRub } from "@/src/lib/money";

describe("money", () => {
  it("rubles -> kopecks (integer)", () => {
    expect(rublesToKopecks(1899)).toBe(189900);
  });
  it("kopecks -> rubles", () => {
    expect(kopecksToRubles(189900)).toBe(1899);
  });
  it("formats without decimals when even", () => {
    expect(formatRub(189900)).toBe("1 899 ₽");
  });
  it("formats with decimals when needed", () => {
    expect(formatRub(189950)).toBe("1 899,50 ₽");
  });
  it("rejects negative", () => {
    expect(() => rublesToKopecks(-1)).toThrow();
  });
});
```

- [ ] **Step 3: Run — expect fail**

```bash
npm test -- money
```

Expected: fails with "Cannot find module ... money".

- [ ] **Step 4: Implement**

`src/lib/money.ts`:

```ts
export function rublesToKopecks(rub: number): number {
  if (rub < 0 || !Number.isFinite(rub)) throw new Error("invalid rubles");
  return Math.round(rub * 100);
}

export function kopecksToRubles(kop: number): number {
  return Math.round(kop) / 100;
}

export function formatRub(kop: number): string {
  const rub = kopecksToRubles(kop);
  const isWhole = Number.isInteger(rub);
  const whole = Math.trunc(rub);
  const wholeStr = whole.toLocaleString("ru-RU").replace(/,/g, " ");
  if (isWhole) return `${wholeStr} ₽`;
  const cents = Math.round((rub - whole) * 100).toString().padStart(2, "0");
  return `${wholeStr},${cents} ₽`;
}
```

- [ ] **Step 5: Run — expect pass**

```bash
npm test -- money
```

Expected: `5 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/result.ts src/lib/money.ts tests/unit/money.test.ts
git commit -m "feat(lib): result type + money helpers"
```

### Task 1.4: Integration test harness (Neon test schema)

**Files:**
- Create: `tests/helpers/db.ts`
- Create: `tests/integration/schema-check.test.ts`

- [ ] **Step 1: Test harness**

`tests/helpers/db.ts`:

```ts
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
```

- [ ] **Step 2: Write connectivity check**

`tests/integration/schema-check.test.ts`:

```ts
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
```

- [ ] **Step 3: Run**

```bash
npm test -- schema-check
```

Expected: `1 passed`.

- [ ] **Step 4: Commit**

```bash
git add tests/helpers/db.ts tests/integration/schema-check.test.ts
git commit -m "test(db): integration harness against Neon"
```

---

## Phase 2 — Public catalog

### Task 2.1: Tours query + fixture seeding

**Files:**
- Create: `src/db/queries/tours.ts`
- Create: `src/db/queries/slots.ts`
- Create: `tests/helpers/fixtures.ts`
- Create: `tests/integration/tours-queries.test.ts`

- [ ] **Step 1: Fixture helpers**

`tests/helpers/fixtures.ts`:

```ts
import type { db } from "@/src/db/client";
import { tours, tourSlots } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function insertTour(d: DB, over: Partial<typeof tours.$inferInsert> = {}) {
  const [row] = await d.insert(tours).values({
    slug: over.slug ?? `t-${Math.random().toString(36).slice(2, 8)}`,
    title: over.title ?? "Тестовая экскурсия",
    priceAdult: over.priceAdult ?? 100000,
    priceChild: over.priceChild ?? 50000,
    published: over.published ?? true,
    ...over,
  }).returning();
  return row;
}

export async function insertSlot(
  d: DB,
  tourId: string,
  over: Partial<typeof tourSlots.$inferInsert> = {},
) {
  const [row] = await d.insert(tourSlots).values({
    tourId,
    startsAt: over.startsAt ?? new Date(Date.now() + 7 * 86400_000),
    seatsTotal: over.seatsTotal ?? 8,
    seatsBooked: over.seatsBooked ?? 0,
    status: over.status ?? "active",
    ...over,
  }).returning();
  return row;
}
```

- [ ] **Step 2: Failing test**

`tests/integration/tours-queries.test.ts`:

```ts
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
```

- [ ] **Step 3: Run — expect fail**

```bash
npm test -- tours-queries
```

Expected: cannot find `queries/tours`.

- [ ] **Step 4: Implement queries**

`src/db/queries/tours.ts`:

```ts
import { asc, eq } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { tours } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function listPublishedTours(d: DB) {
  return d.select().from(tours).where(eq(tours.published, true)).orderBy(asc(tours.createdAt));
}

export async function getTourBySlug(d: DB, slug: string) {
  const rows = await d.select().from(tours).where(eq(tours.slug, slug)).limit(1);
  const t = rows[0];
  if (!t || !t.published) return null;
  return t;
}

export async function getTourById(d: DB, id: string) {
  const rows = await d.select().from(tours).where(eq(tours.id, id)).limit(1);
  return rows[0] ?? null;
}
```

- [ ] **Step 5: Run — expect pass**

```bash
npm test -- tours-queries
```

Expected: `3 passed`.

- [ ] **Step 6: Slots query**

`src/db/queries/slots.ts`:

```ts
import { and, asc, eq, gt, gte, sql } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { tourSlots } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function listUpcomingSlotsForTour(d: DB, tourId: string) {
  return d.select().from(tourSlots).where(
    and(
      eq(tourSlots.tourId, tourId),
      eq(tourSlots.status, "active"),
      gte(tourSlots.startsAt, new Date()),
      gt(sql`${tourSlots.seatsTotal} - ${tourSlots.seatsBooked}`, 0),
    ),
  ).orderBy(asc(tourSlots.startsAt));
}

export async function getSlotById(d: DB, id: string) {
  const rows = await d.select().from(tourSlots).where(eq(tourSlots.id, id)).limit(1);
  return rows[0] ?? null;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/db/queries/ tests/helpers/fixtures.ts tests/integration/tours-queries.test.ts
git commit -m "feat(db): tour + slot queries"
```

### Task 2.2: Catalog page (SSR)

**Files:**
- Modify: `app/page.tsx`
- Create: `src/components/public/TourCard.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Global styles reference the mockup palette**

Append to `app/globals.css`:

```css
:root {
  --cc-cream: #f5ede0;
  --cc-graphite: #22293a;
  --cc-terracotta: #a34a2f;
  --cc-sage: #7c8a6c;
  --cc-sand: #c29a5b;
}
body { background: var(--cc-cream); color: var(--cc-graphite); font-family: Georgia, serif; }
```

- [ ] **Step 2: Layout**

Replace `app/layout.tsx`:

```tsx
import "./globals.css";
export const metadata = { title: "Культурная столица", description: "Экскурсии для семей в СПб" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: TourCard component**

`src/components/public/TourCard.tsx`:

```tsx
import Link from "next/link";
import { formatRub } from "@/src/lib/money";

type Props = { slug: string; title: string; tag: string; route: string; priceAdult: number; priceChild: number; photoUrl: string | null };

export function TourCard(p: Props) {
  return (
    <Link href={`/tours/${p.slug}`} className="block rounded-md overflow-hidden shadow-sm bg-white">
      {p.photoUrl && <img src={p.photoUrl} alt="" className="w-full aspect-[3/2] object-cover" />}
      <div className="p-4">
        <div className="text-sm uppercase text-[color:var(--cc-terracotta)]">{p.tag}</div>
        <h2 className="text-xl font-serif mt-1">{p.title}</h2>
        <div className="text-sm text-[color:var(--cc-graphite)]/70 mt-1">{p.route}</div>
        <div className="mt-3 text-sm">Взрослый {formatRub(p.priceAdult)} · Детский {formatRub(p.priceChild)}</div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Home page**

Replace `app/page.tsx`:

```tsx
import { db } from "@/src/db/client";
import { listPublishedTours } from "@/src/db/queries/tours";
import { TourCard } from "@/src/components/public/TourCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await listPublishedTours(db());
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-serif mb-6">Экскурсии</h1>
      {rows.length === 0 && <p>Пока пусто. Загляните позже.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((t) => (
          <TourCard key={t.id} {...t} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify boot**

```bash
npm run dev -- --port 4173 &
sleep 4
curl -sSf http://localhost:4173/ | grep -q "Экскурсии" && echo OK
kill %1
```

Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add app/ src/components/public/TourCard.tsx
git commit -m "feat(public): catalog page (SSR list of published tours)"
```

### Task 2.3: Tour detail page with slots

**Files:**
- Create: `app/tours/[slug]/page.tsx`
- Create: `src/components/public/SlotList.tsx`
- Create: `src/components/public/AddToCartButton.tsx`

- [ ] **Step 1: AddToCartButton (client)**

`src/components/public/AddToCartButton.tsx`:

```tsx
"use client";
import { useState } from "react";

export function AddToCartButton({ slotId, tourTitle, startsAt, priceAdult, priceChild }:
  { slotId: string; tourTitle: string; startsAt: string; priceAdult: number; priceChild: number }) {
  const [added, setAdded] = useState(false);
  function add() {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("cart") : null;
    const items: Array<{ slotId: string; adult: number; child: number }> = raw ? JSON.parse(raw) : [];
    if (items.find((i) => i.slotId === slotId)) { setAdded(true); return; }
    items.push({ slotId, adult: 1, child: 1 });
    window.localStorage.setItem("cart", JSON.stringify(items));
    setAdded(true);
  }
  return (
    <button onClick={add} className="mt-2 px-3 py-2 bg-[color:var(--cc-graphite)] text-white rounded">
      {added ? "В корзине" : "Добавить в корзину"}
    </button>
  );
}
```

- [ ] **Step 2: SlotList**

`src/components/public/SlotList.tsx`:

```tsx
import { AddToCartButton } from "./AddToCartButton";
import { formatRub } from "@/src/lib/money";

type Slot = { id: string; startsAt: Date; seatsTotal: number; seatsBooked: number };
type Props = { slots: Slot[]; tourTitle: string; priceAdult: number; priceChild: number };

export function SlotList({ slots, tourTitle, priceAdult, priceChild }: Props) {
  if (slots.length === 0) return <p className="mt-4">Ближайших дат нет.</p>;
  return (
    <ul className="mt-4 space-y-3">
      {slots.map((s) => {
        const left = s.seatsTotal - s.seatsBooked;
        const dt = new Intl.DateTimeFormat("ru-RU", {
          day: "numeric", month: "long", weekday: "short", hour: "2-digit", minute: "2-digit",
        }).format(s.startsAt);
        return (
          <li key={s.id} className="p-3 border border-[color:var(--cc-graphite)]/20 rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{dt}</div>
                <div className="text-sm text-[color:var(--cc-graphite)]/60">Осталось {left} мест</div>
              </div>
              <div className="text-sm">Взрослый {formatRub(priceAdult)} · Детский {formatRub(priceChild)}</div>
            </div>
            <AddToCartButton
              slotId={s.id}
              tourTitle={tourTitle}
              startsAt={s.startsAt.toISOString()}
              priceAdult={priceAdult}
              priceChild={priceChild}
            />
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 3: Detail page**

`app/tours/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getTourBySlug } from "@/src/db/queries/tours";
import { listUpcomingSlotsForTour } from "@/src/db/queries/slots";
import { SlotList } from "@/src/components/public/SlotList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = db();
  const tour = await getTourBySlug(d, slug);
  if (!tour) notFound();
  const slots = await listUpcomingSlotsForTour(d, tour.id);
  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-sm underline">← ко всем экскурсиям</Link>
      <h1 className="text-4xl font-serif mt-4">{tour.title}</h1>
      <div className="text-sm text-[color:var(--cc-terracotta)] mt-1 uppercase">{tour.tag}</div>
      <p className="mt-4 whitespace-pre-wrap">{tour.descriptionMd}</p>
      <div className="mt-6 text-sm">Маршрут: {tour.route}</div>
      <div className="text-sm">Длительность: {tour.durationMin} мин · {tour.meta}</div>
      <SlotList
        slots={slots}
        tourTitle={tour.title}
        priceAdult={tour.priceAdult}
        priceChild={tour.priceChild}
      />
    </main>
  );
}
```

- [ ] **Step 4: Verify with seed**

Add a temp seed for smoke check — but keep it as a proper script:

`scripts/seed-dev.ts`:

```ts
import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "@/src/db/client";
import { tours, tourSlots } from "@/src/db/schema";

const d = db();
const [t] = await d.insert(tours).values({
  slug: "demo-tour", title: "Демо экскурсия", tag: "Демо", route: "A → B",
  durationMin: 90, meta: "до 8 человек", descriptionMd: "Описание\n- пункт 1\n- пункт 2",
  priceAdult: 100000, priceChild: 50000, published: true,
}).onConflictDoNothing().returning();
if (t) {
  await d.insert(tourSlots).values({
    tourId: t.id,
    startsAt: new Date(Date.now() + 7 * 86400_000),
    seatsTotal: 8,
  });
}
console.log("seeded");
process.exit(0);
```

- [ ] **Step 5: Run seed + smoke**

```bash
npm run seed:dev
npm run dev -- --port 4173 &
sleep 4
curl -sSf http://localhost:4173/tours/demo-tour | grep -q "Демо экскурсия" && echo OK
kill %1
```

Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add app/tours src/components/public scripts/seed-dev.ts
git commit -m "feat(public): tour detail with upcoming slot list + add-to-cart"
```

---

## Phase 3 — Cart

### Task 3.1: Cart types + hydrate API

**Files:**
- Create: `src/lib/cart-types.ts`
- Create: `src/lib/validation.ts`
- Create: `app/api/cart/hydrate/route.ts`
- Create: `tests/integration/cart-hydrate.test.ts`

- [ ] **Step 1: Shared types**

`src/lib/cart-types.ts`:

```ts
export type CartItemInput = { slotId: string; adult: number; child: number };

export type HydratedCartItem = {
  slotId: string;
  tourSlug: string;
  tourTitle: string;
  startsAt: string;
  seatsLeft: number;
  priceAdult: number;
  priceChild: number;
  adult: number;
  child: number;
};

export type HydratedCart =
  | { ok: true; items: HydratedCartItem[]; removed: Array<{ slotId: string; reason: string }> }
  | { ok: false; code: string; message: string };
```

- [ ] **Step 2: Validation**

`src/lib/validation.ts`:

```ts
import { z } from "zod";

export const cartItemSchema = z.object({
  slotId: z.string().uuid(),
  adult: z.number().int().min(1).max(50),
  child: z.number().int().min(1).max(50),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(20),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40).regex(/^[+\d\s()\-]+$/),
  email: z.string().trim().email().max(200),
});

export const orderSubmissionSchema = customerSchema.extend({
  items: cartSchema.shape.items,
});
```

- [ ] **Step 3: Failing hydrate test**

`tests/integration/cart-hydrate.test.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect fail**

```bash
npm test -- cart-hydrate
```

Expected: fails (route not found).

- [ ] **Step 5: Implement route**

`app/api/cart/hydrate/route.ts`:

```ts
import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tourSlots, tours } from "@/src/db/schema";
import { cartSchema } from "@/src/lib/validation";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = cartSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "BAD_INPUT", message: "invalid cart" }, { status: 400 });
  }
  const requested = parsed.data.items;
  const ids = requested.map((i) => i.slotId);
  const d = db();
  const rows = await d
    .select({
      slotId: tourSlots.id,
      status: tourSlots.status,
      startsAt: tourSlots.startsAt,
      seatsTotal: tourSlots.seatsTotal,
      seatsBooked: tourSlots.seatsBooked,
      tourSlug: tours.slug,
      tourTitle: tours.title,
      priceAdult: tours.priceAdult,
      priceChild: tours.priceChild,
    })
    .from(tourSlots)
    .innerJoin(tours, /* eq */ (await import("drizzle-orm")).eq(tourSlots.tourId, tours.id))
    .where(inArray(tourSlots.id, ids));

  const byId = new Map(rows.map((r) => [r.slotId, r]));
  const items: unknown[] = [];
  const removed: Array<{ slotId: string; reason: string }> = [];
  for (const req of requested) {
    const row = byId.get(req.slotId);
    if (!row) { removed.push({ slotId: req.slotId, reason: "missing" }); continue; }
    if (row.status === "cancelled") { removed.push({ slotId: req.slotId, reason: "cancelled" }); continue; }
    if (row.startsAt.getTime() < Date.now()) { removed.push({ slotId: req.slotId, reason: "past" }); continue; }
    const seatsLeft = row.seatsTotal - row.seatsBooked;
    if (seatsLeft < 2) { removed.push({ slotId: req.slotId, reason: "sold-out" }); continue; }
    let adult = Math.max(1, req.adult);
    let child = Math.max(1, req.child);
    if (adult + child > seatsLeft) {
      adult = Math.max(1, Math.min(adult, seatsLeft - 1));
      child = Math.max(1, seatsLeft - adult);
    }
    items.push({
      slotId: row.slotId,
      tourSlug: row.tourSlug,
      tourTitle: row.tourTitle,
      startsAt: row.startsAt.toISOString(),
      seatsLeft,
      priceAdult: row.priceAdult,
      priceChild: row.priceChild,
      adult,
      child,
    });
  }
  return NextResponse.json({ ok: true, items, removed });
}
```

- [ ] **Step 6: Run — expect pass**

```bash
npm test -- cart-hydrate
```

Expected: `4 passed`.

- [ ] **Step 7: Refactor — extract the join**

Move `import { eq } from "drizzle-orm"` to the top of the file (not dynamic). Re-run tests.

- [ ] **Step 8: Commit**

```bash
git add src/lib/cart-types.ts src/lib/validation.ts app/api/cart/hydrate tests/integration/cart-hydrate.test.ts
git commit -m "feat(cart): hydrate API with validation + clamping"
```

### Task 3.2: Cart page UI

**Files:**
- Create: `app/cart/page.tsx`
- Create: `src/components/public/CartClient.tsx`

- [ ] **Step 1: Page shell**

`app/cart/page.tsx`:

```tsx
import { CartClient } from "@/src/components/public/CartClient";
export const dynamic = "force-dynamic";
export default function CartPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-serif mb-4">Корзина</h1>
      <CartClient />
    </main>
  );
}
```

- [ ] **Step 2: CartClient**

`src/components/public/CartClient.tsx`:

```tsx
"use client";
import { useEffect, useState, useTransition } from "react";
import { formatRub } from "@/src/lib/money";
import type { HydratedCartItem } from "@/src/lib/cart-types";

type Storage = Array<{ slotId: string; adult: number; child: number }>;

function readCart(): Storage {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem("cart") ?? "[]"); } catch { return []; }
}

function writeCart(items: Storage) {
  window.localStorage.setItem("cart", JSON.stringify(items));
}

export function CartClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HydratedCartItem[]>([]);
  const [removed, setRemoved] = useState<Array<{ slotId: string; reason: string }>>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  async function hydrate() {
    const storage = readCart();
    if (storage.length === 0) { setItems([]); setRemoved([]); setLoading(false); return; }
    const res = await fetch("/api/cart/hydrate", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: storage }),
    });
    const data = await res.json();
    if (data.ok) {
      setItems(data.items);
      setRemoved(data.removed);
      writeCart(data.items.map((i: HydratedCartItem) => ({ slotId: i.slotId, adult: i.adult, child: i.child })));
    }
    setLoading(false);
  }

  useEffect(() => { hydrate(); }, []);

  function update(slotId: string, patch: Partial<HydratedCartItem>) {
    setItems((cur) => {
      const next = cur.map((i) => i.slotId === slotId ? { ...i, ...patch } : i);
      writeCart(next.map((i) => ({ slotId: i.slotId, adult: i.adult, child: i.child })));
      return next;
    });
  }

  function remove(slotId: string) {
    setItems((cur) => {
      const next = cur.filter((i) => i.slotId !== slotId);
      writeCart(next.map((i) => ({ slotId: i.slotId, adult: i.adult, child: i.child })));
      return next;
    });
  }

  function total() {
    return items.reduce((s, i) => s + i.adult * i.priceAdult + i.child * i.priceChild, 0);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSubmit(async () => {
      const res = await fetch("/api/orders/create", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, items: items.map((i) => ({ slotId: i.slotId, adult: i.adult, child: i.child })) }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.message); return; }
      writeCart([]);
      window.location.href = `/orders/${data.data.orderId}/success`;
    });
  }

  if (loading) return <p>Загрузка…</p>;
  if (items.length === 0) return <p>Корзина пуста. <a href="/" className="underline">Каталог</a></p>;

  return (
    <div className="space-y-4">
      {removed.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
          Некоторые позиции удалены: {removed.map((r) => r.reason).join(", ")}
        </div>
      )}
      <ul className="space-y-3">
        {items.map((i) => {
          const canPlusAdult = i.adult + i.child < i.seatsLeft;
          const canPlusChild = i.adult + i.child < i.seatsLeft;
          const canMinusAdult = i.adult > 1;
          const canMinusChild = i.child > 1;
          const line = i.adult * i.priceAdult + i.child * i.priceChild;
          return (
            <li key={i.slotId} className="p-4 border rounded bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{i.tourTitle}</div>
                  <div className="text-sm text-black/60">{new Date(i.startsAt).toLocaleString("ru-RU")}</div>
                </div>
                <button onClick={() => remove(i.slotId)} className="text-sm underline">убрать</button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Counter label="Взрослых" value={i.adult}
                  onMinus={canMinusAdult ? () => update(i.slotId, { adult: i.adult - 1 }) : undefined}
                  onPlus={canPlusAdult ? () => update(i.slotId, { adult: i.adult + 1 }) : undefined}
                  hint={formatRub(i.priceAdult)}
                />
                <Counter label="Детей" value={i.child}
                  onMinus={canMinusChild ? () => update(i.slotId, { child: i.child - 1 }) : undefined}
                  onPlus={canPlusChild ? () => update(i.slotId, { child: i.child + 1 }) : undefined}
                  hint={formatRub(i.priceChild)}
                />
              </div>
              <div className="mt-3 text-right font-medium">{formatRub(line)}</div>
            </li>
          );
        })}
      </ul>
      <div className="text-right text-xl font-serif">Итого: {formatRub(total())}</div>

      <form onSubmit={submit} className="space-y-3 mt-6">
        <label className="block">Имя<input required minLength={2} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full border p-2 rounded" /></label>
        <label className="block">Телефон<input required pattern="[+\d\s()\-]{6,}" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mt-1 w-full border p-2 rounded" /></label>
        <label className="block">Email<input type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mt-1 w-full border p-2 rounded" /></label>
        {error && <div className="text-red-700 text-sm">{error}</div>}
        <button disabled={submitting} className="px-4 py-2 bg-[color:var(--cc-graphite)] text-white rounded">
          {submitting ? "Отправляем…" : "Оформить"}
        </button>
      </form>
    </div>
  );
}

function Counter({ label, value, onMinus, onPlus, hint }:
  { label: string; value: number; onMinus?: () => void; onPlus?: () => void; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20">{label}</span>
      <button type="button" disabled={!onMinus} onClick={onMinus} className="px-2 py-1 border rounded disabled:opacity-30">−</button>
      <span className="w-6 text-center">{value}</span>
      <button type="button" disabled={!onPlus} onClick={onPlus} className="px-2 py-1 border rounded disabled:opacity-30">+</button>
      <span className="ml-auto text-black/60">{hint}</span>
    </div>
  );
}
```

- [ ] **Step 3: Smoke check (visual)**

```bash
npm run dev -- --port 4173 &
sleep 4
curl -sSf http://localhost:4173/cart | grep -q "Корзина" && echo OK
kill %1
```

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add app/cart src/components/public/CartClient.tsx
git commit -m "feat(cart): cart page with counters + checkout form"
```

---

## Phase 4 — Checkout (atomic order creation)

### Task 4.1: Order creation query with atomic reservation

**Files:**
- Create: `src/db/queries/orders.ts`
- Create: `tests/integration/orders-create.test.ts`

- [ ] **Step 1: Failing test**

`tests/integration/orders-create.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { insertTour, insertSlot } from "../helpers/fixtures";
import { createOrderAtomic } from "@/src/db/queries/orders";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

describe("createOrderAtomic", () => {
  it("reserves seats and creates order", async () => {
    const t = await insertTour(h.db, { priceAdult: 100000, priceChild: 50000 });
    const s = await insertSlot(h.db, t.id, { seatsTotal: 5 });
    const res = await createOrderAtomic(h.db, {
      customer: { name: "Иван", phone: "+79990000000", email: "a@b.c" },
      items: [{ slotId: s.id, adult: 2, child: 1 }],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error();
    const slot = await h.client`select seats_booked, seats_total from tour_slots where id = ${s.id}`;
    expect(slot[0].seats_booked).toBe(3);
    const items = await h.client`select adult_count, child_count, price_adult_snapshot from order_items where order_id = ${res.data.orderId}`;
    expect(items[0]).toMatchObject({ adult_count: 2, child_count: 1, price_adult_snapshot: 100000 });
  });

  it("rolls back if any slot fails guard", async () => {
    const t = await insertTour(h.db);
    const okSlot = await insertSlot(h.db, t.id, { seatsTotal: 5 });
    const fullSlot = await insertSlot(h.db, t.id, { seatsTotal: 2, seatsBooked: 2 });
    const res = await createOrderAtomic(h.db, {
      customer: { name: "И", phone: "+7999", email: "a@b.c" },
      items: [
        { slotId: okSlot.id, adult: 1, child: 1 },
        { slotId: fullSlot.id, adult: 1, child: 1 },
      ],
    });
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error();
    expect(res.code).toBe("SEATS_TAKEN");
    const rows = await h.client`select id from orders`;
    expect(rows.length).toBe(0);
    const s = await h.client`select seats_booked from tour_slots where id = ${okSlot.id}`;
    expect(s[0].seats_booked).toBe(0);
  });

  it("computes total from snapshot prices", async () => {
    const t = await insertTour(h.db, { priceAdult: 100000, priceChild: 40000 });
    const s = await insertSlot(h.db, t.id, { seatsTotal: 10 });
    const res = await createOrderAtomic(h.db, {
      customer: { name: "И", phone: "+7999", email: "a@b.c" },
      items: [{ slotId: s.id, adult: 2, child: 3 }],
    });
    if (!res.ok) throw new Error(res.message);
    expect(res.data.totalAmount).toBe(2 * 100000 + 3 * 40000);
  });

  it("concurrent last-seat: one wins, one loses", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 2 });
    const c = { name: "И", phone: "+7999", email: "a@b.c" };
    const [a, b] = await Promise.all([
      createOrderAtomic(h.db, { customer: c, items: [{ slotId: s.id, adult: 1, child: 1 }] }),
      createOrderAtomic(h.db, { customer: c, items: [{ slotId: s.id, adult: 1, child: 1 }] }),
    ]);
    const oks = [a, b].filter((r) => r.ok);
    const fails = [a, b].filter((r) => !r.ok);
    expect(oks.length).toBe(1);
    expect(fails.length).toBe(1);
    const s2 = await h.client`select seats_booked from tour_slots where id = ${s.id}`;
    expect(s2[0].seats_booked).toBe(2);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- orders-create
```

Expected: fails (module not found).

- [ ] **Step 3: Implement**

`src/db/queries/orders.ts`:

```ts
import { and, eq, sql } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { orders, orderItems, tourSlots, tours } from "@/src/db/schema";
import { type Result, ok, err } from "@/src/lib/result";

type DB = ReturnType<typeof db>;

type Input = {
  customer: { name: string; phone: string; email: string };
  items: Array<{ slotId: string; adult: number; child: number }>;
};

export type OrderCreateError = "SEATS_TAKEN" | "SLOT_MISSING" | "SLOT_INACTIVE";

export async function createOrderAtomic(
  d: DB,
  input: Input,
): Promise<Result<{ orderId: string; orderNumber: number; totalAmount: number }, OrderCreateError>> {
  try {
    return await d.transaction(async (tx) => {
      let total = 0;
      const snapshots: Array<{ slotId: string; adult: number; child: number; pa: number; pc: number }> = [];

      for (const it of input.items) {
        const need = it.adult + it.child;
        const updated = await tx.execute(sql`
          UPDATE tour_slots
          SET seats_booked = seats_booked + ${need}
          WHERE id = ${it.slotId}
            AND status = 'active'
            AND seats_booked + ${need} <= seats_total
          RETURNING tour_id
        `);
        const row = (updated as unknown as { rows?: Array<{ tour_id: string }> }).rows?.[0]
          ?? (Array.isArray(updated) ? (updated as Array<{ tour_id: string }>)[0] : undefined);
        if (!row) {
          throw new Error("SEATS_TAKEN");
        }
        const tourRow = await tx.select({
          priceAdult: tours.priceAdult, priceChild: tours.priceChild,
        }).from(tours).where(eq(tours.id, row.tour_id)).limit(1);
        const t = tourRow[0];
        if (!t) throw new Error("SLOT_MISSING");
        snapshots.push({
          slotId: it.slotId, adult: it.adult, child: it.child,
          pa: t.priceAdult, pc: t.priceChild,
        });
        total += it.adult * t.priceAdult + it.child * t.priceChild;
      }

      const [order] = await tx.insert(orders).values({
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        customerEmail: input.customer.email,
        status: "pending",
        totalAmount: total,
      }).returning({ id: orders.id, orderNumber: orders.orderNumber });

      await tx.insert(orderItems).values(snapshots.map((s) => ({
        orderId: order.id,
        slotId: s.slotId,
        adultCount: s.adult,
        childCount: s.child,
        priceAdultSnapshot: s.pa,
        priceChildSnapshot: s.pc,
      })));

      return ok({ orderId: order.id, orderNumber: order.orderNumber, totalAmount: total });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "SEATS_TAKEN") return err("SEATS_TAKEN", "Мест уже нет, обновите корзину");
    if (msg === "SLOT_MISSING") return err("SLOT_MISSING", "Слот не найден");
    throw e;
  }
}

export async function getOrderWithItems(d: DB, orderId: string) {
  const [o] = await d.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!o) return null;
  const items = await d.select({
    id: orderItems.id, adultCount: orderItems.adultCount, childCount: orderItems.childCount,
    priceAdultSnapshot: orderItems.priceAdultSnapshot, priceChildSnapshot: orderItems.priceChildSnapshot,
    slotId: orderItems.slotId,
    startsAt: tourSlots.startsAt,
    tourTitle: tours.title, tourSlug: tours.slug,
  })
  .from(orderItems)
  .innerJoin(tourSlots, eq(orderItems.slotId, tourSlots.id))
  .innerJoin(tours, eq(tourSlots.tourId, tours.id))
  .where(eq(orderItems.orderId, orderId));
  return { order: o, items };
}

export async function listRecentOrders(d: DB, limit = 100) {
  return d.select().from(orders).orderBy(sql`${orders.createdAt} desc`).limit(limit);
}

export async function confirmOrder(d: DB, orderId: string, note?: string) {
  await d.update(orders).set({ status: "confirmed", adminNote: note ?? null, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
}

export async function cancelOrderAndReleaseSeats(d: DB, orderId: string, note?: string) {
  return d.transaction(async (tx) => {
    const [o] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!o) throw new Error("ORDER_MISSING");
    if (o.status === "cancelled") return;
    const items = await tx.select({ slotId: orderItems.slotId, adult: orderItems.adultCount, child: orderItems.childCount })
      .from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const it of items) {
      await tx.execute(sql`
        UPDATE tour_slots SET seats_booked = GREATEST(0, seats_booked - ${it.adult + it.child})
        WHERE id = ${it.slotId}
      `);
    }
    await tx.update(orders).set({ status: "cancelled", adminNote: note ?? null, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- orders-create
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/db/queries/orders.ts tests/integration/orders-create.test.ts
git commit -m "feat(orders): atomic seat reservation + create/confirm/cancel"
```

### Task 4.2: Create-order API + success page

**Files:**
- Create: `app/api/orders/create/route.ts`
- Create: `app/orders/[id]/success/page.tsx`
- Create: `tests/integration/orders-api.test.ts`

- [ ] **Step 1: Failing API test**

`tests/integration/orders-api.test.ts`:

```ts
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
    const r = await post({ name: "Иван", phone: "+79990000000", email: "a@b.c", items: [{ slotId: s.id, adult: 1, child: 1 }] });
    expect(r.status).toBe(201);
    expect(r.body.ok).toBe(true);
    expect(r.body.data.orderId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns 409 on seats taken", async () => {
    const t = await insertTour(h.db);
    const s = await insertSlot(h.db, t.id, { seatsTotal: 2, seatsBooked: 2 });
    const r = await post({ name: "И", phone: "+7999", email: "a@b.c", items: [{ slotId: s.id, adult: 1, child: 1 }] });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe("SEATS_TAKEN");
  });

  it("returns 400 on bad input", async () => {
    const r = await post({ name: "", phone: "", email: "nope", items: [] });
    expect(r.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- orders-api
```

- [ ] **Step 3: Implement route**

`app/api/orders/create/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { orderSubmissionSchema } from "@/src/lib/validation";
import { createOrderAtomic } from "@/src/db/queries/orders";
import { notifyAdmin } from "@/src/telegram/notify";
import { env } from "@/src/lib/env";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = orderSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "BAD_INPUT", message: "Проверьте поля" }, { status: 400 });
  }
  const res = await createOrderAtomic(db(), {
    customer: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email },
    items: parsed.data.items,
  });
  if (!res.ok) {
    const status = res.code === "SEATS_TAKEN" ? 409 : 400;
    return NextResponse.json(res, { status });
  }
  try {
    const base = env.publicBaseUrl();
    await notifyAdmin(`Новая заявка №${res.data.orderNumber}\n${base}/admin/orders/${res.data.orderId}`);
  } catch (e) {
    console.error("tg notify failed", e);
  }
  return NextResponse.json({ ok: true, data: { orderId: res.data.orderId } }, { status: 201 });
}
```

- [ ] **Step 4: Stub notifyAdmin so tests link**

Create `src/telegram/notify.ts`:

```ts
export async function notifyAdmin(_text: string): Promise<void> {
  // real implementation added in Phase 8
  return;
}
```

- [ ] **Step 5: Run — expect pass**

```bash
npm test -- orders-api
```

Expected: `3 passed`.

- [ ] **Step 6: Success page**

`app/orders/[id]/success/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getOrderWithItems } from "@/src/db/queries/orders";
import { formatRub } from "@/src/lib/money";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrderWithItems(db(), id);
  if (!data) notFound();
  const { order, items } = data;
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-serif">Заявка №{order.orderNumber} принята</h1>
      <p className="mt-2">Мы свяжемся с вами по телефону {order.customerPhone} или email {order.customerEmail}.</p>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="border p-3 rounded">
            <div className="font-medium">{i.tourTitle}</div>
            <div className="text-sm">{new Date(i.startsAt).toLocaleString("ru-RU")}</div>
            <div className="text-sm">Взрослых: {i.adultCount} · Детей: {i.childCount}</div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-right text-xl">Итого: {formatRub(order.totalAmount)}</div>
    </main>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add app/api/orders app/orders src/telegram/notify.ts tests/integration/orders-api.test.ts
git commit -m "feat(checkout): order creation API + success page (TG stub)"
```

---

## Phase 5 — Admin auth

### Task 5.1: Password + session helpers

**Files:**
- Create: `src/auth/password.ts`
- Create: `src/auth/session.ts`
- Create: `src/db/queries/admins.ts`
- Create: `src/db/queries/sessions.ts`
- Create: `tests/unit/password.test.ts`
- Create: `tests/integration/sessions.test.ts`

- [ ] **Step 1: Failing password test**

`tests/unit/password.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/src/auth/password";

describe("password", () => {
  it("hashes and verifies", async () => {
    const h = await hashPassword("secret-pw");
    expect(await verifyPassword("secret-pw", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

`src/auth/password.ts`:

```ts
import bcrypt from "bcryptjs";
export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
```

- [ ] **Step 3: Run**

```bash
npm test -- password
```

Expected: `1 passed`.

- [ ] **Step 4: Admin/session queries**

`src/db/queries/admins.ts`:

```ts
import { eq } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { admins } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function findAdminByEmail(d: DB, email: string) {
  const rows = await d.select().from(admins).where(eq(admins.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function createAdmin(d: DB, email: string, passwordHash: string) {
  const [row] = await d.insert(admins).values({ email: email.toLowerCase(), passwordHash }).returning();
  return row;
}
```

`src/db/queries/sessions.ts`:

```ts
import { and, eq, lt, sql } from "drizzle-orm";
import type { db } from "@/src/db/client";
import { adminSessions, admins } from "@/src/db/schema";

type DB = ReturnType<typeof db>;

export async function insertSession(d: DB, adminId: string, tokenHash: string, expiresAt: Date) {
  const [row] = await d.insert(adminSessions).values({ adminId, tokenHash, expiresAt }).returning();
  return row;
}

export async function findAdminByToken(d: DB, tokenHash: string) {
  const rows = await d
    .select({
      adminId: admins.id, email: admins.email,
      expiresAt: adminSessions.expiresAt,
    })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .where(eq(adminSessions.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return { id: row.adminId, email: row.email };
}

export async function deleteSession(d: DB, tokenHash: string) {
  await d.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
}

export async function pruneExpiredSessions(d: DB) {
  await d.delete(adminSessions).where(lt(adminSessions.expiresAt, sql`now()`));
}
```

- [ ] **Step 5: Session helpers**

`src/auth/session.ts`:

```ts
import { randomBytes, createHash } from "node:crypto";
import { insertSession, findAdminByToken, deleteSession } from "@/src/db/queries/sessions";
import { db } from "@/src/db/client";

export const SESSION_COOKIE = "cc_admin_session";
export const SESSION_TTL_DAYS = 30;

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await insertSession(db(), adminId, tokenHash, expiresAt);
  return { token, expiresAt };
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  return findAdminByToken(db(), hash(token));
}

export async function revokeSession(token: string) {
  await deleteSession(db(), hash(token));
}
```

- [ ] **Step 6: Failing integration test**

`tests/integration/sessions.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { hashPassword } from "@/src/auth/password";
import { createAdmin } from "@/src/db/queries/admins";
import { issueSession, readSession, revokeSession } from "@/src/auth/session";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

describe("sessions", () => {
  it("issue -> read -> revoke", async () => {
    const a = await createAdmin(h.db, "root@example.com", await hashPassword("x"));
    const { token } = await issueSession(a.id);
    const found = await readSession(token);
    expect(found?.id).toBe(a.id);
    await revokeSession(token);
    expect(await readSession(token)).toBeNull();
  });
});
```

- [ ] **Step 7: Run**

```bash
npm test -- sessions
```

Expected: `1 passed`.

- [ ] **Step 8: Commit**

```bash
git add src/auth src/db/queries/admins.ts src/db/queries/sessions.ts tests/unit/password.test.ts tests/integration/sessions.test.ts
git commit -m "feat(auth): password + session helpers with DB backing"
```

### Task 5.2: create-admin CLI

**Files:**
- Create: `scripts/create-admin.ts`

- [ ] **Step 1: Script**

```ts
import { config } from "dotenv";
config({ path: ".env.local" });
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "@/src/db/client";
import { createAdmin, findAdminByEmail } from "@/src/db/queries/admins";
import { hashPassword } from "@/src/auth/password";

const rl = readline.createInterface({ input, output });
const email = (await rl.question("email: ")).trim().toLowerCase();
const password = (await rl.question("password (min 8): ")).trim();
rl.close();
if (password.length < 8) { console.error("password too short"); process.exit(1); }
const d = db();
if (await findAdminByEmail(d, email)) { console.error("admin already exists"); process.exit(1); }
const hash = await hashPassword(password);
const a = await createAdmin(d, email, hash);
console.log("created", a.id);
process.exit(0);
```

- [ ] **Step 2: Run once locally**

```bash
npm run admin:create
```

Enter email + password. Expect: `created <uuid>`.

- [ ] **Step 3: Commit**

```bash
git add scripts/create-admin.ts
git commit -m "feat(auth): CLI to bootstrap first admin"
```

### Task 5.3: Login/logout Server Actions + middleware

**Files:**
- Create: `src/actions/admin-login.ts`
- Create: `src/actions/admin-logout.ts`
- Create: `src/auth/require-admin.ts`
- Create: `middleware.ts`
- Create: `app/admin/login/page.tsx`

- [ ] **Step 1: Actions**

`src/actions/admin-login.ts`:

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/src/db/client";
import { findAdminByEmail } from "@/src/db/queries/admins";
import { verifyPassword } from "@/src/auth/password";
import { issueSession, SESSION_COOKIE, SESSION_TTL_DAYS } from "@/src/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function adminLoginAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return "Проверьте поля";
  const admin = await findAdminByEmail(db(), parsed.data.email);
  if (!admin) return "Неверный email или пароль";
  const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!ok) return "Неверный email или пароль";
  const { token, expiresAt } = await issueSession(admin.id);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/",
    expires: expiresAt, maxAge: SESSION_TTL_DAYS * 86400,
  });
  redirect("/admin");
}
```

`src/actions/admin-logout.ts`:

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revokeSession, SESSION_COOKIE } from "@/src/auth/session";

export async function adminLogoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token);
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
```

- [ ] **Step 2: Server-side guard**

`src/auth/require-admin.ts`:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, SESSION_COOKIE } from "@/src/auth/session";

export async function requireAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const admin = await readSession(token);
  if (!admin) redirect("/admin/login");
  return admin;
}
```

- [ ] **Step 3: Edge middleware (cheap gate; deep validation in `requireAdmin`)**

`middleware.ts`:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/src/auth/session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();
  const has = req.cookies.get(SESSION_COOKIE);
  if (!has) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```

- [ ] **Step 4: Login page**

`app/admin/login/page.tsx`:

```tsx
"use client";
import { useActionState } from "react";
import { adminLoginAction } from "@/src/actions/admin-login";

export default function LoginPage() {
  const [err, action, pending] = useActionState(adminLoginAction, null);
  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-2xl mb-4">Вход в админку</h1>
      <form action={action} className="space-y-3">
        <input name="email" type="email" required placeholder="email"
          className="w-full border p-2 rounded" />
        <input name="password" type="password" required placeholder="пароль"
          className="w-full border p-2 rounded" />
        {err && <div className="text-red-700 text-sm">{err}</div>}
        <button disabled={pending} className="w-full bg-black text-white p-2 rounded">
          {pending ? "…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Smoke check**

```bash
npm run dev -- --port 4173 &
sleep 4
curl -sSI http://localhost:4173/admin | head -1
curl -sSI http://localhost:4173/admin/login | head -1
kill %1
```

Expected: first shows `307` redirect to login, second `200`.

- [ ] **Step 6: Commit**

```bash
git add src/actions src/auth/require-admin.ts middleware.ts app/admin/login
git commit -m "feat(auth): login + logout actions, protected /admin middleware"
```

---

## Phase 6 — Admin: orders

### Task 6.1: Admin shell + dashboard

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `src/components/admin/Sidebar.tsx`

- [ ] **Step 1: Sidebar**

`src/components/admin/Sidebar.tsx`:

```tsx
import Link from "next/link";
import { adminLogoutAction } from "@/src/actions/admin-logout";

export function Sidebar({ email }: { email: string }) {
  return (
    <aside className="w-56 border-r p-4 min-h-screen bg-white">
      <div className="mb-6 text-sm text-black/60">{email}</div>
      <nav className="space-y-2">
        <Link className="block" href="/admin">Обзор</Link>
        <Link className="block" href="/admin/orders">Заявки</Link>
        <Link className="block" href="/admin/tours">Экскурсии</Link>
      </nav>
      <form action={adminLogoutAction} className="mt-8">
        <button className="text-sm underline">Выйти</button>
      </form>
    </aside>
  );
}
```

- [ ] **Step 2: Layout**

`app/admin/layout.tsx`:

```tsx
import { requireAdmin } from "@/src/auth/require-admin";
import { Sidebar } from "@/src/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <Sidebar email={admin.email} />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
```

But `/admin/login` should NOT use this layout. Move it under `app/admin/(auth)/login/` route group? Simpler: keep login in `app/admin/login/page.tsx` and split layout via route group.

Restructure:
```bash
mkdir -p app/admin/\(protected\)
git mv app/admin/page.tsx app/admin/\(protected\)/page.tsx 2>/dev/null || true
```

Actually the layout needs to apply to protected routes only. Use a route group `(protected)`:

- [ ] **Step 3: Route group for protected**

```bash
mkdir -p "app/admin/(protected)"
```

Move layout there — create `app/admin/(protected)/layout.tsx` with the code from Step 2. Delete `app/admin/layout.tsx`.

Then `app/admin/(protected)/page.tsx`:

```tsx
import { db } from "@/src/db/client";
import { listRecentOrders } from "@/src/db/queries/orders";

export default async function AdminDashboard() {
  const orders = await listRecentOrders(db(), 5);
  const pending = orders.filter((o) => o.status === "pending").length;
  return (
    <div>
      <h1 className="text-2xl mb-4">Обзор</h1>
      <p>Новых заявок: {pending}</p>
    </div>
  );
}
```

- [ ] **Step 4: Smoke check**

Login manually (with the admin from Task 5.2) via browser at `/admin/login`; verify redirect to `/admin` works and dashboard renders.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)" src/components/admin/Sidebar.tsx
git commit -m "feat(admin): protected shell + dashboard"
```

### Task 6.2: Orders list + detail + confirm/cancel

**Files:**
- Create: `app/admin/(protected)/orders/page.tsx`
- Create: `app/admin/(protected)/orders/[id]/page.tsx`
- Create: `src/actions/admin-order-confirm.ts`
- Create: `src/actions/admin-order-cancel.ts`
- Create: `tests/integration/admin-orders.test.ts`

- [ ] **Step 1: Failing test for actions (integration via imports)**

`tests/integration/admin-orders.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
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
```

- [ ] **Step 2: Run — should pass (queries already exist)**

```bash
npm test -- admin-orders
```

Expected: `2 passed`.

- [ ] **Step 3: Actions**

`src/actions/admin-order-confirm.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { confirmOrder } from "@/src/db/queries/orders";
import { requireAdmin } from "@/src/auth/require-admin";

export async function confirmOrderAction(orderId: string, note: string | null) {
  await requireAdmin();
  await confirmOrder(db(), orderId, note ?? undefined);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders`);
}
```

`src/actions/admin-order-cancel.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { cancelOrderAndReleaseSeats } from "@/src/db/queries/orders";
import { requireAdmin } from "@/src/auth/require-admin";

export async function cancelOrderAction(orderId: string, note: string | null) {
  await requireAdmin();
  await cancelOrderAndReleaseSeats(db(), orderId, note ?? undefined);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders`);
}
```

- [ ] **Step 4: Orders list page**

`app/admin/(protected)/orders/page.tsx`:

```tsx
import Link from "next/link";
import { db } from "@/src/db/client";
import { listRecentOrders } from "@/src/db/queries/orders";
import { formatRub } from "@/src/lib/money";

export const dynamic = "force-dynamic";

export default async function OrdersList() {
  const rows = await listRecentOrders(db());
  return (
    <div>
      <h1 className="text-2xl mb-4">Заявки</h1>
      <table className="w-full text-sm">
        <thead className="text-left border-b"><tr>
          <th className="p-2">№</th><th>Дата</th><th>Клиент</th><th>Статус</th><th className="text-right">Сумма</th>
        </tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b hover:bg-black/5">
              <td className="p-2"><Link className="underline" href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
              <td>{new Date(o.createdAt).toLocaleString("ru-RU")}</td>
              <td>{o.customerName}</td>
              <td>{o.status}</td>
              <td className="text-right">{formatRub(o.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Order detail with actions**

`app/admin/(protected)/orders/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getOrderWithItems } from "@/src/db/queries/orders";
import { formatRub } from "@/src/lib/money";
import { confirmOrderAction } from "@/src/actions/admin-order-confirm";
import { cancelOrderAction } from "@/src/actions/admin-order-cancel";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrderWithItems(db(), id);
  if (!data) notFound();
  const { order, items } = data;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl mb-2">Заявка №{order.orderNumber}</h1>
      <div className="text-sm text-black/60">Статус: {order.status}</div>
      <div className="mt-4">
        <div>{order.customerName}</div>
        <div>{order.customerPhone}</div>
        <div>{order.customerEmail}</div>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="border p-3 rounded">
            <div className="font-medium">{i.tourTitle}</div>
            <div className="text-sm">{new Date(i.startsAt).toLocaleString("ru-RU")}</div>
            <div className="text-sm">Взрослых: {i.adultCount} × {formatRub(i.priceAdultSnapshot)} · Детей: {i.childCount} × {formatRub(i.priceChildSnapshot)}</div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-right text-xl">Итого: {formatRub(order.totalAmount)}</div>

      {order.status === "pending" && (
        <div className="mt-6 space-y-3">
          <form action={async (fd) => { "use server"; await confirmOrderAction(order.id, String(fd.get("note") ?? "") || null); }}>
            <label className="block text-sm">Заметка (опционально)
              <input name="note" className="mt-1 w-full border p-2 rounded" defaultValue={order.adminNote ?? ""} />
            </label>
            <button className="mt-2 bg-green-700 text-white px-3 py-2 rounded">Подтвердить</button>
          </form>
          <form action={async (fd) => { "use server"; await cancelOrderAction(order.id, String(fd.get("cancelNote") ?? "") || null); }}>
            <label className="block text-sm">Причина отмены
              <input name="cancelNote" className="mt-1 w-full border p-2 rounded" />
            </label>
            <button className="mt-2 bg-red-700 text-white px-3 py-2 rounded">Отменить</button>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Smoke test**

Log in, create an order via the public flow (or via seed), open `/admin/orders`, click into detail, confirm, verify status flips. Also check cancel returns seats.

- [ ] **Step 7: Commit**

```bash
git add "app/admin/(protected)/orders" src/actions/admin-order-confirm.ts src/actions/admin-order-cancel.ts tests/integration/admin-orders.test.ts
git commit -m "feat(admin): orders list + detail + confirm/cancel"
```

---

## Phase 7 — Admin: tours & slots

### Task 7.1: Tour upsert action + list/edit pages

**Files:**
- Create: `src/actions/admin-tour-upsert.ts`
- Create: `src/actions/admin-tour-delete.ts`
- Create: `src/db/queries/tours.ts` (extend)
- Create: `app/admin/(protected)/tours/page.tsx`
- Create: `app/admin/(protected)/tours/new/page.tsx`
- Create: `app/admin/(protected)/tours/[id]/edit/page.tsx`
- Create: `src/components/admin/TourForm.tsx`
- Create: `tests/integration/admin-tour-upsert.test.ts`

- [ ] **Step 1: Extend tours queries**

Append to `src/db/queries/tours.ts`:

```ts
import { desc } from "drizzle-orm";

export async function listAllTours(d: DB) {
  return d.select().from(tours).orderBy(desc(tours.createdAt));
}

export async function upsertTour(d: DB, input: {
  id?: string; slug: string; title: string; tag: string; route: string; durationMin: number;
  meta: string; descriptionMd: string; priceAdult: number; priceChild: number;
  photoUrl: string | null; published: boolean;
}) {
  if (input.id) {
    const [row] = await d.update(tours).set({ ...input, updatedAt: new Date() })
      .where(eq(tours.id, input.id)).returning();
    return row;
  }
  const [row] = await d.insert(tours).values(input).returning();
  return row;
}

export async function deleteTour(d: DB, id: string) {
  await d.delete(tours).where(eq(tours.id, id));
}
```

- [ ] **Step 2: Failing action test**

`tests/integration/admin-tour-upsert.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { upsertTour, listAllTours, getTourBySlug } from "@/src/db/queries/tours";

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
```

- [ ] **Step 3: Run — expect pass**

```bash
npm test -- admin-tour-upsert
```

- [ ] **Step 4: Action**

`src/actions/admin-tour-upsert.ts`:

```ts
"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { upsertTour } from "@/src/db/queries/tours";
import { requireAdmin } from "@/src/auth/require-admin";

const schema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "только a-z, 0-9, -"),
  title: z.string().min(1).max(200),
  tag: z.string().max(80).default(""),
  route: z.string().max(200).default(""),
  durationMin: z.coerce.number().int().min(0).max(1440).default(0),
  meta: z.string().max(200).default(""),
  descriptionMd: z.string().max(4000).default(""),
  priceAdultRub: z.coerce.number().int().min(0).max(1_000_000),
  priceChildRub: z.coerce.number().int().min(0).max(1_000_000),
  photoUrl: z.string().url().nullable().optional(),
  published: z.coerce.boolean(),
});

export async function upsertTourAction(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: fd.get("id") || undefined,
    slug: fd.get("slug"),
    title: fd.get("title"),
    tag: fd.get("tag") ?? "",
    route: fd.get("route") ?? "",
    durationMin: fd.get("durationMin") ?? 0,
    meta: fd.get("meta") ?? "",
    descriptionMd: fd.get("descriptionMd") ?? "",
    priceAdultRub: fd.get("priceAdultRub") ?? 0,
    priceChildRub: fd.get("priceChildRub") ?? 0,
    photoUrl: fd.get("photoUrl") || null,
    published: fd.get("published") === "on",
  });
  if (!parsed.success) return parsed.error.issues.map((i) => i.message).join("; ");
  const { priceAdultRub, priceChildRub, ...rest } = parsed.data;
  const saved = await upsertTour(db(), {
    ...rest,
    photoUrl: rest.photoUrl ?? null,
    priceAdult: priceAdultRub * 100,
    priceChild: priceChildRub * 100,
  });
  revalidatePath("/admin/tours");
  revalidatePath("/");
  revalidatePath(`/tours/${saved.slug}`);
  redirect(`/admin/tours/${saved.id}/edit`);
}
```

- [ ] **Step 5: Delete action**

`src/actions/admin-tour-delete.ts`:

```ts
"use server";
import { redirect } from "next/navigation";
import { db } from "@/src/db/client";
import { deleteTour } from "@/src/db/queries/tours";
import { requireAdmin } from "@/src/auth/require-admin";

export async function deleteTourAction(id: string) {
  await requireAdmin();
  await deleteTour(db(), id);
  redirect("/admin/tours");
}
```

- [ ] **Step 6: TourForm**

`src/components/admin/TourForm.tsx`:

```tsx
"use client";
import { useActionState, useState } from "react";
import { upsertTourAction } from "@/src/actions/admin-tour-upsert";

type Tour = {
  id: string; slug: string; title: string; tag: string; route: string; durationMin: number;
  meta: string; descriptionMd: string; priceAdult: number; priceChild: number;
  photoUrl: string | null; published: boolean;
};

export function TourForm({ tour }: { tour: Tour | null }) {
  const [err, action, pending] = useActionState(upsertTourAction, null);
  const [photoUrl, setPhotoUrl] = useState(tour?.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/admin/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST", body: file,
      });
      const data = await res.json();
      if (data.url) setPhotoUrl(data.url); else alert("upload failed");
    } finally { setUploading(false); }
  }

  return (
    <form action={action} className="space-y-3 max-w-xl">
      {tour && <input type="hidden" name="id" value={tour.id} />}
      <label className="block">Slug<input required name="slug" defaultValue={tour?.slug} className="w-full border p-2 rounded" /></label>
      <label className="block">Заголовок<input required name="title" defaultValue={tour?.title} className="w-full border p-2 rounded" /></label>
      <label className="block">Тег<input name="tag" defaultValue={tour?.tag} className="w-full border p-2 rounded" /></label>
      <label className="block">Маршрут<input name="route" defaultValue={tour?.route} className="w-full border p-2 rounded" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">Длительность (мин)<input name="durationMin" type="number" defaultValue={tour?.durationMin ?? 0} className="w-full border p-2 rounded" /></label>
        <label className="block">Мета<input name="meta" defaultValue={tour?.meta} className="w-full border p-2 rounded" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">Цена взрослого (₽)<input name="priceAdultRub" type="number" min="0" required defaultValue={tour ? tour.priceAdult / 100 : ""} className="w-full border p-2 rounded" /></label>
        <label className="block">Цена детского (₽)<input name="priceChildRub" type="number" min="0" required defaultValue={tour ? tour.priceChild / 100 : ""} className="w-full border p-2 rounded" /></label>
      </div>
      <label className="block">Описание (markdown)
        <textarea name="descriptionMd" rows={6} defaultValue={tour?.descriptionMd} className="w-full border p-2 rounded"></textarea>
      </label>

      <div>
        <label className="block text-sm">Фото</label>
        <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} />
        {uploading && <span className="ml-2 text-sm">загрузка…</span>}
        <input type="hidden" name="photoUrl" value={photoUrl} />
        {photoUrl && <img src={photoUrl} alt="" className="mt-2 max-w-xs rounded" />}
      </div>

      <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={tour?.published ?? false} /> Опубликовано</label>

      {err && <div className="text-red-700 text-sm">{err}</div>}
      <button disabled={pending} className="bg-black text-white px-4 py-2 rounded">{pending ? "…" : "Сохранить"}</button>
    </form>
  );
}
```

- [ ] **Step 7: Pages**

`app/admin/(protected)/tours/page.tsx`:

```tsx
import Link from "next/link";
import { db } from "@/src/db/client";
import { listAllTours } from "@/src/db/queries/tours";

export const dynamic = "force-dynamic";

export default async function ToursList() {
  const rows = await listAllTours(db());
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl">Экскурсии</h1>
        <Link className="underline" href="/admin/tours/new">+ Новая</Link>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">
                <Link className="underline" href={`/admin/tours/${t.id}/edit`}>{t.title}</Link>
                <div className="text-xs text-black/50">/{t.slug} · {t.published ? "опубликовано" : "черновик"}</div>
              </td>
              <td className="text-right">
                <Link className="underline" href={`/admin/tours/${t.id}/slots`}>слоты</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`app/admin/(protected)/tours/new/page.tsx`:

```tsx
import { TourForm } from "@/src/components/admin/TourForm";
export default function NewTour() {
  return (<div><h1 className="text-2xl mb-4">Новая экскурсия</h1><TourForm tour={null} /></div>);
}
```

`app/admin/(protected)/tours/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getTourById } from "@/src/db/queries/tours";
import { TourForm } from "@/src/components/admin/TourForm";
import { deleteTourAction } from "@/src/actions/admin-tour-delete";

export const dynamic = "force-dynamic";

export default async function EditTour({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTourById(db(), id);
  if (!t) notFound();
  return (
    <div>
      <h1 className="text-2xl mb-4">Редактирование</h1>
      <TourForm tour={t} />
      <form action={async () => { "use server"; await deleteTourAction(t.id); }} className="mt-6">
        <button className="text-sm text-red-700 underline">Удалить экскурсию</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/actions/admin-tour-upsert.ts src/actions/admin-tour-delete.ts src/db/queries/tours.ts src/components/admin/TourForm.tsx "app/admin/(protected)/tours" tests/integration/admin-tour-upsert.test.ts
git commit -m "feat(admin): tour list + new/edit form + delete"
```

### Task 7.2: Vercel Blob upload endpoint

**Files:**
- Create: `app/api/admin/upload/route.ts`

- [ ] **Step 1: Route**

```ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/src/auth/require-admin";
import { env } from "@/src/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const filename = url.searchParams.get("filename");
  if (!filename || !req.body) {
    return NextResponse.json({ error: "filename + body required" }, { status: 400 });
  }
  const safe = filename.replace(/[^\w.\-]/g, "_");
  const blob = await put(`tours/${Date.now()}-${safe}`, req.body, {
    access: "public",
    token: env.blobToken(),
  });
  return NextResponse.json({ url: blob.url });
}
```

- [ ] **Step 2: Manual verify**

Set `BLOB_READ_WRITE_TOKEN` in `.env.local` (from Vercel dashboard once project is linked in Phase 10). Log in, edit a tour, upload an image, confirm URL populates and image renders.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/upload
git commit -m "feat(admin): Vercel Blob upload endpoint"
```

### Task 7.3: Slots CRUD

**Files:**
- Create: `src/actions/admin-slot-upsert.ts`
- Create: `src/actions/admin-slot-cancel.ts`
- Create: `src/db/queries/slots.ts` (extend)
- Create: `app/admin/(protected)/tours/[id]/slots/page.tsx`
- Create: `tests/integration/admin-slots.test.ts`

- [ ] **Step 1: Extend slots queries**

Append to `src/db/queries/slots.ts`:

```ts
export async function listSlotsForTour(d: DB, tourId: string) {
  return d.select().from(tourSlots).where(eq(tourSlots.tourId, tourId)).orderBy(asc(tourSlots.startsAt));
}

export async function upsertSlot(d: DB, input: {
  id?: string; tourId: string; startsAt: Date; seatsTotal: number;
}) {
  if (input.id) {
    const [existing] = await d.select({ booked: tourSlots.seatsBooked }).from(tourSlots).where(eq(tourSlots.id, input.id)).limit(1);
    if (!existing) throw new Error("SLOT_MISSING");
    if (input.seatsTotal < existing.booked) throw new Error("SEATS_TOTAL_BELOW_BOOKED");
    const [row] = await d.update(tourSlots).set({
      startsAt: input.startsAt, seatsTotal: input.seatsTotal,
    }).where(eq(tourSlots.id, input.id)).returning();
    return row;
  }
  const [row] = await d.insert(tourSlots).values({
    tourId: input.tourId, startsAt: input.startsAt, seatsTotal: input.seatsTotal,
  }).returning();
  return row;
}

export async function cancelSlot(d: DB, id: string) {
  await d.update(tourSlots).set({ status: "cancelled" }).where(eq(tourSlots.id, id));
}
```

- [ ] **Step 2: Failing test**

`tests/integration/admin-slots.test.ts`:

```ts
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
```

- [ ] **Step 3: Run — expect pass**

```bash
npm test -- admin-slots
```

- [ ] **Step 4: Actions**

`src/actions/admin-slot-upsert.ts`:

```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { upsertSlot } from "@/src/db/queries/slots";
import { requireAdmin } from "@/src/auth/require-admin";

const schema = z.object({
  id: z.string().uuid().optional(),
  tourId: z.string().uuid(),
  startsAt: z.string().min(10),
  seatsTotal: z.coerce.number().int().min(1).max(200),
});

export async function upsertSlotAction(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: fd.get("id") || undefined,
    tourId: fd.get("tourId"),
    startsAt: fd.get("startsAt"),
    seatsTotal: fd.get("seatsTotal"),
  });
  if (!parsed.success) return parsed.error.issues.map((i) => i.message).join("; ");
  try {
    await upsertSlot(db(), {
      id: parsed.data.id,
      tourId: parsed.data.tourId,
      startsAt: new Date(parsed.data.startsAt),
      seatsTotal: parsed.data.seatsTotal,
    });
    revalidatePath(`/admin/tours/${parsed.data.tourId}/slots`);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "unknown error";
  }
}
```

`src/actions/admin-slot-cancel.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { cancelSlot } from "@/src/db/queries/slots";
import { requireAdmin } from "@/src/auth/require-admin";

export async function cancelSlotAction(id: string, tourId: string) {
  await requireAdmin();
  await cancelSlot(db(), id);
  revalidatePath(`/admin/tours/${tourId}/slots`);
}
```

- [ ] **Step 5: Slots page**

`app/admin/(protected)/tours/[id]/slots/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getTourById } from "@/src/db/queries/tours";
import { listSlotsForTour } from "@/src/db/queries/slots";
import { upsertSlotAction } from "@/src/actions/admin-slot-upsert";
import { cancelSlotAction } from "@/src/actions/admin-slot-cancel";

export const dynamic = "force-dynamic";

export default async function SlotsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTourById(db(), id);
  if (!t) notFound();
  const slots = await listSlotsForTour(db(), id);

  return (
    <div>
      <h1 className="text-2xl mb-4">Слоты — {t.title}</h1>
      <form action={upsertSlotAction} className="flex gap-2 mb-6 items-end">
        <input type="hidden" name="tourId" value={t.id} />
        <label className="block">Дата и время
          <input required type="datetime-local" name="startsAt" className="border p-2 rounded" />
        </label>
        <label className="block">Мест
          <input required type="number" name="seatsTotal" min="1" max="200" className="border p-2 rounded w-24" />
        </label>
        <button className="bg-black text-white px-3 py-2 rounded">Добавить слот</button>
      </form>

      <table className="w-full text-sm">
        <thead className="text-left border-b"><tr>
          <th className="p-2">Дата</th><th>Мест</th><th>Занято</th><th>Статус</th><th></th>
        </tr></thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">{new Date(s.startsAt).toLocaleString("ru-RU")}</td>
              <td>{s.seatsTotal}</td>
              <td>{s.seatsBooked}</td>
              <td>{s.status}</td>
              <td className="text-right">
                {s.status === "active" && (
                  <form action={async () => { "use server"; await cancelSlotAction(s.id, t.id); }}>
                    <button className="text-red-700 underline text-xs">отменить</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/actions/admin-slot-upsert.ts src/actions/admin-slot-cancel.ts src/db/queries/slots.ts "app/admin/(protected)/tours/[id]/slots" tests/integration/admin-slots.test.ts
git commit -m "feat(admin): slots CRUD (create/cancel + booked-guard)"
```

---

## Phase 8 — Telegram notifications

### Task 8.1: notifyAdmin real implementation

**Files:**
- Modify: `src/telegram/notify.ts`
- Create: `tests/unit/notify.test.ts`

- [ ] **Step 1: Failing test**

`tests/unit/notify.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  process.env.TELEGRAM_BOT_TOKEN = "test-tok";
  process.env.TELEGRAM_ADMIN_ID = "42";
  vi.restoreAllMocks();
});

describe("notifyAdmin", () => {
  it("POSTs to Telegram sendMessage with chat_id and text", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const { notifyAdmin } = await import("@/src/telegram/notify");
    await notifyAdmin("hello");
    expect(spy).toHaveBeenCalledOnce();
    const call = spy.mock.calls[0];
    expect(String(call[0])).toBe("https://api.telegram.org/bottest-tok/sendMessage");
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body).toMatchObject({ chat_id: 42, text: "hello" });
  });

  it("throws on non-ok telegram response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false, description: "bad" }), { status: 400 }),
    );
    const { notifyAdmin } = await import("@/src/telegram/notify");
    await expect(notifyAdmin("x")).rejects.toThrow(/bad/);
  });
});
```

- [ ] **Step 2: Run — expect fail (stub returns void)**

```bash
npm test -- notify
```

- [ ] **Step 3: Implement**

Replace `src/telegram/notify.ts`:

```ts
import { env } from "@/src/lib/env";

export async function notifyAdmin(text: string): Promise<void> {
  const { token, adminId } = env.telegram();
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: Number(adminId), text, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`telegram: ${JSON.stringify(j)}`);
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- notify
```

Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/telegram/notify.ts tests/unit/notify.test.ts
git commit -m "feat(telegram): notifyAdmin real HTTP call"
```

---

## Phase 9 — E2E tests

### Task 9.1: Playwright setup

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/booking.spec.ts`
- Create: `tests/e2e/helpers.ts`

- [ ] **Step 1: Install browsers**

```bash
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Config**

`playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.PW_BASE_URL || "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run start -- --port 3000",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Helpers**

`tests/e2e/helpers.ts`:

```ts
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
```

- [ ] **Step 4: Spec**

`tests/e2e/booking.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { truncate, seedTourWithSlot } from "./helpers";

test.beforeEach(async () => { await truncate(); });

test("guest can add tour to cart and submit order", async ({ page }) => {
  const { tourSlug } = await seedTourWithSlot();
  await page.goto(`/tours/${tourSlug}`);
  await page.getByRole("button", { name: /Добавить/ }).click();
  await page.goto("/cart");
  await page.getByLabel("Имя").fill("Иван Тестовый");
  await page.getByLabel("Телефон").fill("+79990000000");
  await page.getByLabel("Email").fill("ivan@example.com");
  await page.getByRole("button", { name: /Оформить/ }).click();
  await expect(page.locator("h1")).toContainText("принята");
});
```

- [ ] **Step 5: Run**

```bash
npm run test:e2e
```

Expected: 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test(e2e): playwright + guest booking happy path"
```

---

## Phase 10 — Deploy

### Task 10.1: Security workflow + repo setup

**Files:**
- Create: `.github/workflows/security.yml`
- Create: `README.md` (short)

- [ ] **Step 1: Copy security workflow**

Copy from `~/.claude/templates/security-review-workflow.yml` (per user's standing rule for new repos) into `.github/workflows/security.yml`. If the template file doesn't exist, ask the user for the current source and pause this step until provided.

- [ ] **Step 2: README stub**

```markdown
# Cultural Capital App

Booking flow for family excursions in Saint Petersburg.

## Dev
- `npm install`
- Fill `.env.local` (see `.env.example`)
- `npm run db:migrate`
- `npm run admin:create`
- `npm run seed:dev` (optional)
- `npm run dev`

## Tests
- `npm test` (unit + integration, requires `DATABASE_URL`)
- `npm run test:e2e` (Playwright, boots the app)

## Deploy
Vercel; env vars per `.env.example`. Neon Postgres for prod DB. Vercel Blob for tour photos.
```

- [ ] **Step 3: Commit**

```bash
git add .github README.md
git commit -m "chore: security workflow + README"
```

### Task 10.2: Create GitHub repo + push

- [ ] **Step 1: Create repo**

```bash
gh repo create polltov/cultural-capital-app --public --source . --remote origin --push
```

Expected: repo created and pushed.

- [ ] **Step 2: Add CLAUDE_API_KEY secret**

```bash
gh secret set CLAUDE_API_KEY --repo polltov/cultural-capital-app
```

(paste value when prompted)

### Task 10.3: Vercel project + env

- [ ] **Step 1: Link project**

```bash
npx --yes vercel@latest link --project cultural-capital-app --yes
```

- [ ] **Step 2: Set env vars**

For each of `DATABASE_URL`, `SESSION_SECRET`, `PUBLIC_BASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID`, `BLOB_READ_WRITE_TOKEN`:

```bash
npx vercel env add <NAME> production
```

Paste value. Repeat for `preview` where applicable.

- [ ] **Step 3: Deploy**

```bash
npx vercel --prod
```

Expected: deployment URL printed. Open it, log into `/admin/login`, verify dashboard renders.

- [ ] **Step 4: Run production migration**

Neon migrations are already applied (Task 1.2 ran against the same DB). If prod DB is separate, run `DATABASE_URL=<prod> npm run db:migrate` locally.

- [ ] **Step 5: Bootstrap prod admin**

```bash
DATABASE_URL=<prod> npm run admin:create
```

- [ ] **Step 6: End-to-end smoke on prod**

Manually: open prod URL → seed a tour + slot via admin → open incognito → book → verify order appears in `/admin/orders` + TG message received.

- [ ] **Step 7: Commit any final config**

```bash
git add .vercel/project.json 2>/dev/null || true
git commit -m "chore: vercel project link" 2>/dev/null || true
git push
```

---

## Self-review checklist (already done during writing)

- **Spec coverage:** All 11 requirements from the spec map to tasks (booking rules → Phases 3+4; auth → Phase 5; notifications → Phase 4.2 + 8; content mgmt → Phase 7; UX principle → surfaced in Phase 7 form design).
- **Types:** `createOrderAtomic`, `HydratedCartItem`, `requireAdmin`, `SESSION_COOKIE`, `env.*()` used consistently across tasks.
- **No placeholders:** Every code step has full code; every test step has full test code; every command shows expected output.
- **Frequent commits:** Each task ends with a commit; TDD steps within tasks may commit together.

## Open questions surfaced during planning (not blockers)

- **Payment provider:** deferred (schema already has `payment_id`, `status=paid`).
- **Domain:** deferred (Vercel default URL for MVP).
- **Multi-admin UI:** out of scope (CLI-only).
