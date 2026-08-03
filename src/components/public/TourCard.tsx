import Link from "next/link";
import Image from "next/image";
import { formatRub } from "@/src/lib/money";

type Props = {
  slug: string;
  title: string;
  tag: string;
  route: string;
  priceAdult: number;
  priceChild: number;
  photoUrl: string | null;
  meta?: string;
  durationMin?: number;
  index?: number;
  serial?: string;
  earliestSlotAt?: string | null;
  seatsLeft?: number | null;
};

function formatSlotDate(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(d).replace(/\.$/, "");
  const wd = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(d);
  const time = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return { big: day, sub: `${wd} · ${time}` };
}

function seatsLabel(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `осталось ${n} место`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `осталось ${n} места`;
  return `осталось ${n} мест`;
}

/**
 * Ticket-style card (direction-d). Renders:
 *  - photo panel (with fallback color-gradient by index if no photo)
 *  - top-left tag chip + top-right seats badge is left for slot list
 *  - perforated cut line with tiny serial
 *  - info block: title, italic tag, route, meta, price + CTA
 */
export function TourCard(p: Props) {
  const hasPhoto = Boolean(p.photoUrl);
  const serial = p.serial ?? `№ ${String((p.index ?? 0) + 1).padStart(3, "0")}`;

  return (
    <Link
      href={`/tours/${p.slug}`}
      data-photo={hasPhoto ? "1" : "0"}
      data-index={p.index ?? 0}
      className="cc-ticket group no-underline text-ink"
    >
      <div className="cc-ticket-photo">
        {hasPhoto && (
          <Image
            src={p.photoUrl as string}
            alt={p.title}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover"
          />
        )}
        <span
          className="absolute top-3.5 left-3.5 z-10 bg-paper text-ink px-2.5 py-1 rounded-sm text-[10px] tracking-[0.2em] uppercase font-bold"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          {p.tag || "экскурсия"}
        </span>
        {p.earliestSlotAt && (() => {
          const dt = formatSlotDate(p.earliestSlotAt);
          return (
            <span
              className="absolute bottom-3 left-3.5 z-10 text-[11.5px] font-bold tracking-[0.14em] uppercase text-paper"
              style={{ fontFamily: "var(--font-sans-ui)" }}
            >
              <b
                className="block text-[16px] font-normal tracking-[0.02em] normal-case"
                style={{ fontFamily: "var(--font-antiqua)" }}
              >
                {dt.big}
              </b>
              {dt.sub}
            </span>
          );
        })()}
        {typeof p.seatsLeft === "number" && p.seatsLeft > 0 && (
          <span
            className="absolute bottom-3.5 right-3.5 z-10 text-[10px] font-bold tracking-[0.08em] text-paper px-2 py-1 rounded-sm"
            style={{
              background: "rgba(163,74,47,0.95)",
              fontFamily: "var(--font-sans-ui)",
            }}
          >
            {seatsLabel(p.seatsLeft)}
          </span>
        )}
      </div>

      <div className="cc-perf">
        <span className="cc-stub">{serial}</span>
      </div>

      <div className="cc-ticket-info">
        <div
          className="text-[17px] leading-[1.15] text-ink mb-1.5 relative z-10"
          style={{ fontFamily: "var(--font-antiqua)" }}
        >
          {p.title}
        </div>
        <div
          className="italic text-[12.5px] text-terracotta mb-2.5 relative z-10"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {p.tag}
        </div>
        <div
          className="text-[12px] leading-[1.5] mb-3 relative z-10 min-h-[36px]"
          style={{ color: "var(--cc-slate)", fontFamily: "var(--font-serif-body)" }}
        >
          {p.route}
        </div>
        {(p.meta || p.durationMin) && (
          <div
            className="flex gap-3 text-[11px] uppercase tracking-[0.08em] font-bold mb-3 relative z-10"
            style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
          >
            {p.durationMin ? <span>{Math.round(p.durationMin / 60)} ч</span> : null}
            {p.durationMin && p.meta ? (
              <span
                className="inline-block w-1 h-1 rounded-full self-center"
                style={{ background: "var(--cc-sand)" }}
              />
            ) : null}
            {p.meta ? <span>{p.meta}</span> : null}
          </div>
        )}
        <div
          className="mt-auto flex justify-between items-center pt-3 relative z-10"
          style={{ borderTop: "1px solid rgba(194,154,91,0.4)" }}
        >
          <span
            className="text-[22px] text-ink"
            style={{ fontFamily: "var(--font-antiqua)" }}
          >
            {formatRub(p.priceChild || p.priceAdult)}
            <small
              className="text-[10px] tracking-[0.08em] ml-0.5"
              style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
            >
              /чел
            </small>
          </span>
          <span
            className="bg-ink text-paper text-[11px] font-bold tracking-[0.08em] px-3.5 py-2 rounded-sm transition-colors group-hover:bg-[#0e1319]"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            Купить
          </span>
        </div>
      </div>
    </Link>
  );
}
