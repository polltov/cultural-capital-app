import Link from "next/link";
import { formatRub } from "@/src/lib/money";

type Props = { slug: string; title: string; tag: string; route: string; priceAdult: number; priceChild: number; photoUrl: string | null };

export function TourCard(p: Props) {
  return (
    <Link href={`/tours/${p.slug}`} className="block rounded-md overflow-hidden shadow-sm bg-white">
      {p.photoUrl && <img src={p.photoUrl} alt="" className="w-full aspect-[3/2] object-cover" />}
      <div className="p-4">
        <div className="text-sm uppercase text-[color:var(--cc-terracotta)]">{p.tag}</div>
        <h2 className="text-xl font-serif mt-1">{p.title}</h2>
        <div className="text-sm text-[color:var(--cc-graphite)]/70 mt-1">{p.route}</div>
        <div className="mt-3 text-sm">Взрослый {formatRub(p.priceAdult)} · Детский {formatRub(p.priceChild)}</div>
      </div>
    </Link>
  );
}
