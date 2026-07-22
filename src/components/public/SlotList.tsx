import { AddToCartButton } from "./AddToCartButton";
import { formatRub } from "@/src/lib/money";

type Slot = { id: string; startsAt: Date; seatsTotal: number; seatsBooked: number };
type Props = { slots: Slot[]; tourTitle: string; priceAdult: number; priceChild: number };

export function SlotList({ slots, tourTitle, priceAdult, priceChild }: Props) {
  if (slots.length === 0) {
    return (
      <div
        className="rounded-lg px-5 py-4 text-[13px]"
        style={{
          background: "rgba(194,154,91,0.14)",
          borderLeft: "2px solid var(--cc-sand)",
          color: "var(--cc-slate)",
          fontFamily: "var(--font-sans-ui)",
        }}
      >
        Ближайших дат пока нет. Напишите нам — подберём индивидуальную дату.
      </div>
    );
  }
  return (
    <ul className="grid gap-3">
      {slots.map((s) => {
        const left = s.seatsTotal - s.seatsBooked;
        const dt = new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(s.startsAt);
        return (
          <li
            key={s.id}
            className="bg-paper rounded-lg px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            style={{ border: "1px solid rgba(194,154,91,0.4)" }}
          >
            <div>
              <div
                className="text-[16px] text-ink"
                style={{ fontFamily: "var(--font-antiqua)" }}
              >
                {dt}
              </div>
              <div
                className="text-[11px] uppercase tracking-[0.14em] font-bold mt-1"
                style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
              >
                Осталось{" "}
                <span className="text-terracotta">{left} мест</span>
                {" · "}
                Взрослый {formatRub(priceAdult)} · Детский {formatRub(priceChild)}
              </div>
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
