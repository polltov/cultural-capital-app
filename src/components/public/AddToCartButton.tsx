"use client";
import { useState } from "react";

export function AddToCartButton({ slotId, tourTitle, startsAt, priceAdult, priceChild }:
  { slotId: string; tourTitle: string; startsAt: string; priceAdult: number; priceChild: number }) {
  const [added, setAdded] = useState(false);
  function add() {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("cart") : null;
    const items: Array<{ slotId: string; adult: number; child: number }> = raw ? JSON.parse(raw) : [];
    if (items.find((i) => i.slotId === slotId)) { setAdded(true); return; }
    items.push({ slotId, adult: 1, child: 1 });
    window.localStorage.setItem("cart", JSON.stringify(items));
    setAdded(true);
  }
  return (
    <button onClick={add} className="mt-2 px-3 py-2 bg-[color:var(--cc-graphite)] text-white rounded">
      {added ? "В корзине" : "Добавить в корзину"}
    </button>
  );
}
