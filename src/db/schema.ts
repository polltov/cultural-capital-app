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
