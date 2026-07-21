CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'cancelled', 'paid');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"adult_count" integer NOT NULL,
	"child_count" integer NOT NULL,
	"price_adult_snapshot" integer NOT NULL,
	"price_child_snapshot" integer NOT NULL,
	CONSTRAINT "items_adult_min" CHECK ("order_items"."adult_count" >= 1),
	CONSTRAINT "items_child_min" CHECK ("order_items"."child_count" >= 1)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" serial NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" integer NOT NULL,
	"payment_id" text,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "tour_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"seats_total" integer NOT NULL,
	"seats_booked" integer DEFAULT 0 NOT NULL,
	"status" "slot_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slots_booked_within_total" CHECK ("tour_slots"."seats_booked" >= 0 AND "tour_slots"."seats_booked" <= "tour_slots"."seats_total")
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"tag" text DEFAULT '' NOT NULL,
	"route" text DEFAULT '' NOT NULL,
	"duration_min" integer DEFAULT 0 NOT NULL,
	"meta" text DEFAULT '' NOT NULL,
	"description_md" text DEFAULT '' NOT NULL,
	"price_adult" integer NOT NULL,
	"price_child" integer NOT NULL,
	"photo_url" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tours_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tours_price_adult_nonneg" CHECK ("tours"."price_adult" >= 0),
	CONSTRAINT "tours_price_child_nonneg" CHECK ("tours"."price_child" >= 0)
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_slot_id_tour_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."tour_slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_slots" ADD CONSTRAINT "tour_slots_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "admin_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "orders_created_desc_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "slots_tour_start_idx" ON "tour_slots" USING btree ("tour_id","starts_at");--> statement-breakpoint
CREATE INDEX "slots_status_start_idx" ON "tour_slots" USING btree ("status","starts_at");