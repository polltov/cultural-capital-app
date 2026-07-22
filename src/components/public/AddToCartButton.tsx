"use client";
import { useState } from "react";

export function AddToCartButton({
  slotId,
}: {
  slotId: string;
  tourTitle: string;
  startsAt: string;
  priceAdult: number;
  priceChild: number;
}) {
  const [added, setAdded] = useState(false);
  function add() {
    const raw =
      typeof window !== "undefined" ? window.localStorage.getItem("cart") : null;
    const items: Array<{ slotId: string; adult: number; child: number }> = raw
      ? JSON.parse(raw)
      : [];
    if (items.find((i) => i.slotId === slotId)) {
      setAdded(true);
      return;
    }
    items.push({ slotId, adult: 1, child: 1 });
    window.localStorage.setItem("cart", JSON.stringify(items));
    setAdded(true);
  }
  return (
    <button
      onClick={add}
      className="bg-ink text-paper text-[12px] font-bold tracking-[0.08em] px-5 py-2.5 rounded-sm transition-colors hover:bg-[#0e1319] disabled:opacity-50"
      style={{ fontFamily: "var(--font-sans-ui)" }}
      disabled={added}
    >
      {added ? "В корзине ✓" : "Добавить в корзину"}
    </button>
  );
}
