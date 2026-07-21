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
