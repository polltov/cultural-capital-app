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
