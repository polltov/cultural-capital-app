import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "@/src/db/client";
import { tours, tourSlots } from "@/src/db/schema";

(async () => {
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
})();
