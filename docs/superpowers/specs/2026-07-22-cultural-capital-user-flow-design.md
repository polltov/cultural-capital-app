# Cultural Capital — user flow + admin panel

**Date:** 2026-07-22
**Status:** Design approved, ready for implementation planning
**Repo:** `~/projects/cultural-capital-app` (new)
**Related:** mockups at `~/projects/cultural-capital/mockups/direction-d.html`

## Goal

Build an end-to-end booking flow for family excursions in Saint Petersburg. Visitor browses tours → picks date → adds to cart with adult/child counters → submits contact info → admin sees the order and confirms manually. Online payment integration is out of scope for this iteration but the data model must be forward-compatible.

## Stack decisions

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **Neon Postgres** (region us-east-1)
- **Drizzle ORM 0.45** for schema + migrations
- **Vercel Blob** for tour photos (1GB free tier)
- **Tailwind v4** matching current `direction-d` mockup aesthetic
- **Vercel** hosting; MVP URL `cultural-capital-app.vercel.app`, later `culturalcapital.res-prod.ru` or dedicated domain
- **Telegram Bot API** for admin push notifications
- **Vitest 4** for unit + integration; **Playwright** for 1-2 E2E happy paths

The static mockups at `res-prod.ru/cultural-capital/` remain untouched — new app is a separate repository.

## Requirements captured during brainstorming

### Booking rules
1. Dates are **fixed slots** created manually by admin (not recurring). Each slot has explicit `seats_total`.
2. Cart may contain **multiple excursions**. Each cart item is one `(tour_slot, adult_count, child_count)` tuple.
3. Every cart item requires **minimum 1 adult + 1 child**. Counters have +/- controls; user cannot go below the minimum. Upper bound = remaining seats for that slot.
4. Price per item = `adult_count * price_adult + child_count * price_child`. Prices are snapshotted into the order at checkout so future price changes don't affect existing orders.
5. Seats are reserved **at checkout** via a DB transaction with `UPDATE ... WHERE seats_booked + N <= seats_total` guard. If any slot in the order fails the guard, the entire transaction rolls back and the user gets a 409 with a message to refresh cart.
6. Cart lives in `localStorage` only. Server validates everything (availability, prices, min counts) at the checkout submit.

### Auth
7. Admin login is **email + password** (bcrypt hash in DB). No self-signup — first admin created via a CLI script.
8. Sessions via httpOnly cookie holding an opaque token; hash stored in `admin_sessions`. 30-day lifetime.

### Notifications
9. New orders appear in `/admin/orders` list AND trigger a **Telegram bot message** to the admin with a deep link to the order detail page.

### Content management
10. Admin edits tours + slots via panel. Photo upload is **drag-and-drop into Vercel Blob**; the URL is stored on the tour row.
11. Admin panel UX principle: **intuitively simple**. Prefer plain forms, obvious buttons, clear feedback over anything clever.

## Data model

```
tours
  id                  uuid pk
  slug                text unique          -- URL: /tours/egypt-hall
  title               text
  tag                 text                 -- «Эрмитаж», «крепость» etc
  route               text                 -- «Дворцовая → Марсово поле»
  duration_min        int
  meta                text                 -- «до 8 человек, дети 7+»
  description_md      text                 -- markdown bullets
  price_adult         int                  -- kopecks
  price_child         int                  -- kopecks
  photo_url           text nullable        -- Vercel Blob URL
  published           bool default false
  created_at, updated_at timestamptz

tour_slots
  id                  uuid pk
  tour_id             uuid fk -> tours.id
  starts_at           timestamptz          -- 2026-09-20T11:00+03
  seats_total         int
  seats_booked        int default 0
  status              enum(active, cancelled)
  created_at          timestamptz

orders
  id                  uuid pk
  order_number        int auto             -- human-readable №1024
  customer_name       text
  customer_phone      text
  customer_email      text
  status              enum(pending, confirmed, cancelled, paid)
  total_amount        int                  -- kopecks
  payment_id          text nullable        -- future kassa txn id
  admin_note          text nullable
  created_at, updated_at timestamptz

order_items
  id                  uuid pk
  order_id            uuid fk -> orders.id
  slot_id             uuid fk -> tour_slots.id
  adult_count         int check >= 1
  child_count         int check >= 1
  price_adult_snapshot int
  price_child_snapshot int

admins
  id                  uuid pk
  email               text unique
  password_hash       text                 -- bcrypt
  created_at          timestamptz

admin_sessions
  id                  uuid pk
  admin_id            uuid fk -> admins.id
  token_hash          text                 -- sha256 of cookie value
  expires_at          timestamptz
```

Indexes:
- `tour_slots(tour_id, starts_at)` for tour detail page listings
- `tour_slots(status, starts_at)` for future "upcoming" queries
- `orders(created_at desc)` for admin list default sort
- `admin_sessions(token_hash)` for session lookup

## Route map

### Public
- `GET /` — SSR list of published tours (mockup direction-d 1:1)
- `GET /tours/[slug]` — tour detail with upcoming slots
- `GET /cart` — client component, reads localStorage, calls hydrate API
- `GET /orders/[id]/success` — order confirmation page (accessible only via order id passed after checkout)

### API / Server Actions
- `POST /api/cart/hydrate` — takes `{items: [{slotId, adult, child}]}`, returns fresh title/prices/seats_left per item, or 410 if slot no longer exists / cancelled
- `POST /api/orders/create` (Server Action) — validates + transaction + TG notification
- `POST /api/admin/upload` — Vercel Blob upload endpoint, admin-only

### Admin
- `GET/POST /admin/login`
- `POST /admin/logout`
- `GET /admin` — dashboard summary (pending orders count, upcoming slots)
- `GET /admin/orders` — table
- `GET /admin/orders/[id]` — detail + status buttons + note field
- `GET /admin/tours` — list
- `GET /admin/tours/new`, `GET /admin/tours/[id]/edit` — form
- `GET /admin/tours/[id]/slots` — slots table with add/edit/cancel
- Middleware: everything under `/admin` except `/admin/login` requires valid session

## Business logic invariants

- `tour_slots.seats_booked <= tour_slots.seats_total` — enforced by the atomic UPDATE guard at checkout AND by a DB CHECK constraint.
- `order_items.adult_count >= 1 AND child_count >= 1` — CHECK constraint.
- `total_amount` = sum of `order_items` snapshot prices — computed server-side, never trusted from client.
- Cancelling a `confirmed` order in admin: transaction that flips status + `UPDATE tour_slots SET seats_booked = seats_booked - N` for each item.
- Admin editing an existing slot: cannot lower `seats_total` below current `seats_booked` (400 error).
- Cancelling a slot in admin: sets status=cancelled but does NOT auto-cancel existing orders on it — admin must handle each order manually (shown as warning).

## Error handling

- Client-side: form validation for name/phone/email format before submit
- Server: all Server Actions return typed error union `{ok: true, data} | {ok: false, code, message}` — surfaced in UI as toast + inline field errors
- Seat conflict at checkout → 409 with `code: "SEATS_TAKEN"` + which slot(s) failed → cart page highlights those items, forces re-hydrate
- TG notification failure → logged but does NOT fail the order (best-effort, admin can still see it in `/admin/orders`)
- Blob upload failure → form stays open, error toast, tour save blocked until photo uploaded or removed

## Testing strategy

**Unit (Vitest):**
- Cart price calculation
- Counter validation (min 1+1, max = seats_left)
- Order total computation
- Password hashing / session token generation

**Integration (Vitest + real Neon test schema):**
- Double checkout race on last seat → one 201, one 409
- Order cancellation returns seats to slot atomically
- Admin lowering `seats_total` below booked → 400
- Session middleware allows valid, rejects expired/missing
- Cart hydrate: returns 410 for cancelled slot, returns fresh price if changed

**E2E (Playwright, 2 flows):**
- Guest: browse → add 2 tours → adjust counters → checkout → success page
- Admin: login → see new order in list → open detail → confirm → TG notification stub called

**Excluded from tests:** Vercel Blob upload (mock at unit level), TG API real calls (stubbed).

## Deployment

- New GitHub repo `cultural-capital-app` under `polltov`
- Vercel project connected to `main` branch
- Neon project `cultural-capital` in `us-east-1`
- Env vars:
  - `DATABASE_URL` (Neon)
  - `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
  - `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_ID` (new bot, not reusing FastSub's)
  - `SESSION_SECRET` (for signing session tokens)
  - `PUBLIC_BASE_URL`
- Security workflow (`.github/workflows/security.yml`) copied from template per user's standing rule for new repos

## Out of scope for this iteration

- Online payments (data model reserves `status=paid` + `payment_id` for future)
- Customer accounts / login / order history (guests only)
- Multi-language (RU only)
- Discount codes
- Analytics / tracking
- Admin: multiple admins UI (create via CLI only)
- Email notifications (TG is enough for MVP)

## Open items to resolve during / after implementation

- Payment provider choice (YuKassa / Robokassa / Tinkoff / CloudPayments) — deferred until MVP live
- Final domain (`culturalcapital.res-prod.ru` vs dedicated) — deferred until MVP live
