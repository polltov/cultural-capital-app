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
