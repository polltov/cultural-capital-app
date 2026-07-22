import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getTourBySlug } from "@/src/db/queries/tours";
import { listUpcomingSlotsForTour } from "@/src/db/queries/slots";
import { SlotList } from "@/src/components/public/SlotList";
import { PublicShell } from "@/src/components/public/PublicShell";
import { formatRub } from "@/src/lib/money";

export const dynamic = "force-dynamic";

export default async function TourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = db();
  const tour = await getTourBySlug(d, slug);
  if (!tour) notFound();
  const slots = await listUpcomingSlotsForTour(d, tour.id);

  // Split description into optional bullet list + narrative paragraphs.
  // Convention: lines starting with "- " become bullets; everything else is prose.
  const rawLines = tour.descriptionMd.split(/\r?\n/);
  const bullets: string[] = [];
  const proseLines: string[] = [];
  for (const line of rawLines) {
    const l = line.trim();
    if (!l) continue;
    if (l.startsWith("- ") || l.startsWith("* ") || l.startsWith("• ")) {
      bullets.push(l.replace(/^[-*•]\s+/, ""));
    } else {
      proseLines.push(l);
    }
  }

  return (
    <PublicShell>
      <div className="relative z-10 px-10 pt-8 pb-4 max-md:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] uppercase font-bold text-terracotta hover:opacity-80"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          ← ко всем экскурсиям
        </Link>
      </div>

      <article className="relative z-10 px-10 pb-16 max-md:px-6">
        <div
          className="cc-ticket"
          data-photo={tour.photoUrl ? "1" : "0"}
          style={{ cursor: "default" }}
        >
          {/* Photo strip */}
          <div className="cc-ticket-photo" style={{ aspectRatio: "auto", height: 260 }}>
            {tour.photoUrl && (
              <Image
                src={tour.photoUrl}
                alt={tour.title}
                fill
                sizes="1000px"
                priority
                className="object-cover"
              />
            )}
            <span
              className="absolute top-3.5 left-3.5 z-10 bg-paper text-ink px-2.5 py-1 rounded-sm text-[10px] tracking-[0.2em] uppercase font-bold"
              style={{ fontFamily: "var(--font-sans-ui)" }}
            >
              {tour.tag || "экскурсия"}
            </span>
          </div>

          <div className="cc-perf">
            <span className="cc-stub">Экскурсия</span>
          </div>

          {/* Expanded info */}
          <div className="cc-ticket-info" style={{ padding: "26px 30px 28px" }}>
            <h1
              className="text-[26px] md:text-[30px] leading-[1.15] text-ink mb-2 relative z-10"
              style={{ fontFamily: "var(--font-antiqua)" }}
            >
              {tour.title}
            </h1>
            {tour.tag && (
              <div
                className="italic text-[14px] text-terracotta mb-3.5 relative z-10"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tour.tag}
              </div>
            )}

            {tour.route && (
              <div
                className="text-[13.5px] leading-[1.6] mb-4 relative z-10"
                style={{ color: "var(--cc-slate)", fontFamily: "var(--font-serif-body)" }}
              >
                <b className="text-ink">Маршрут: </b>
                {tour.route}
              </div>
            )}

            {(proseLines.length > 0 || bullets.length > 0) && (
              <div
                className="text-[13.5px] leading-[1.6] mb-4 relative z-10"
                style={{ color: "#3d4756", fontFamily: "var(--font-serif-body)" }}
              >
                {proseLines.map((p, i) => (
                  <p key={i} className="mb-2.5">
                    {p}
                  </p>
                ))}
                {bullets.length > 0 && (
                  <ul className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                    {bullets.map((b, i) => (
                      <li key={i} className="pl-6 relative text-[12.5px] leading-[1.5]">
                        <span
                          className="absolute left-0 top-0 text-terracotta text-[10px]"
                          aria-hidden
                        >
                          ◆
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tour.meta && (
              <div
                className="flex gap-3 text-[11.5px] uppercase tracking-[0.08em] font-bold mb-4 relative z-10"
                style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
              >
                {tour.durationMin > 0 && (
                  <>
                    <span>
                      {Math.floor(tour.durationMin / 60)}
                      {tour.durationMin % 60
                        ? `,${Math.round((tour.durationMin % 60) / 6)}`
                        : ""}{" "}
                      ч
                    </span>
                    <span
                      className="inline-block w-1 h-1 rounded-full self-center"
                      style={{ background: "var(--cc-sand)" }}
                    />
                  </>
                )}
                <span>{tour.meta}</span>
              </div>
            )}

            {/* Prices */}
            <div
              className="flex gap-6 items-baseline relative z-10 pt-4"
              style={{ borderTop: "1px solid rgba(194,154,91,0.4)" }}
            >
              <div className="flex flex-col leading-[1.1]">
                <span
                  className="text-[10px] uppercase tracking-[0.14em] font-bold mb-1"
                  style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
                >
                  Детский
                </span>
                <b
                  className="text-[22px] text-ink"
                  style={{ fontFamily: "var(--font-antiqua)", fontWeight: 400 }}
                >
                  {formatRub(tour.priceChild)}
                </b>
              </div>
              <div className="flex flex-col leading-[1.1]">
                <span
                  className="text-[10px] uppercase tracking-[0.14em] font-bold mb-1"
                  style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
                >
                  Взрослый
                </span>
                <b
                  className="text-[22px] text-ink"
                  style={{ fontFamily: "var(--font-antiqua)", fontWeight: 400 }}
                >
                  {formatRub(tour.priceAdult)}
                </b>
              </div>
            </div>
          </div>
        </div>

        {/* Slots section */}
        <section className="mt-14">
          <div
            className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold mb-2.5"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            Ближайшие даты
          </div>
          <div
            className="text-[26px] md:text-[30px] leading-none text-ink mb-6"
            style={{ fontFamily: "var(--font-antiqua)" }}
          >
            Выберите{" "}
            <em
              className="italic text-terracotta"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              удобное время
            </em>
          </div>
          <SlotList
            slots={slots}
            tourTitle={tour.title}
            priceAdult={tour.priceAdult}
            priceChild={tour.priceChild}
          />
        </section>
      </article>
    </PublicShell>
  );
}
