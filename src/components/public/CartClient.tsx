"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { formatRub } from "@/src/lib/money";
import type { HydratedCartItem } from "@/src/lib/cart-types";

type Storage = Array<{ slotId: string; adult: number; child: number }>;

function readCart(): Storage {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("cart") ?? "[]");
  } catch {
    return [];
  }
}

function writeCart(items: Storage) {
  window.localStorage.setItem("cart", JSON.stringify(items));
}

export function CartClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HydratedCartItem[]>([]);
  const [removed, setRemoved] = useState<Array<{ slotId: string; reason: string }>>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const storage = readCart();
      if (storage.length === 0) {
        if (!cancelled) {
          setItems([]);
          setRemoved([]);
          setLoading(false);
        }
        return;
      }
      const res = await fetch("/api/cart/hydrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: storage }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (data.ok) {
        setItems(data.items);
        setRemoved(data.removed);
        writeCart(
          data.items.map((i: HydratedCartItem) => ({
            slotId: i.slotId,
            adult: i.adult,
            child: i.child,
          })),
        );
      }
      setLoading(false);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  function update(slotId: string, patch: Partial<HydratedCartItem>) {
    setItems((cur) => {
      const next = cur.map((i) => (i.slotId === slotId ? { ...i, ...patch } : i));
      writeCart(next.map((i) => ({ slotId: i.slotId, adult: i.adult, child: i.child })));
      return next;
    });
  }

  function remove(slotId: string) {
    setItems((cur) => {
      const next = cur.filter((i) => i.slotId !== slotId);
      writeCart(next.map((i) => ({ slotId: i.slotId, adult: i.adult, child: i.child })));
      return next;
    });
  }

  function total() {
    return items.reduce((s, i) => s + i.adult * i.priceAdult + i.child * i.priceChild, 0);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSubmit(async () => {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ slotId: i.slotId, adult: i.adult, child: i.child })),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message);
        return;
      }
      writeCart([]);
      window.location.href = `/orders/${data.data.orderId}/success`;
    });
  }

  if (loading) return <p>Загрузка…</p>;
  if (items.length === 0)
    return (
      <p>
        Корзина пуста.{" "}
        <Link href="/" className="underline">
          Каталог
        </Link>
      </p>
    );

  return (
    <div className="space-y-4">
      {removed.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
          Некоторые позиции удалены: {removed.map((r) => r.reason).join(", ")}
        </div>
      )}
      <ul className="space-y-3">
        {items.map((i) => {
          const canPlusAdult = i.adult + i.child < i.seatsLeft;
          const canPlusChild = i.adult + i.child < i.seatsLeft;
          const canMinusAdult = i.adult > 1;
          const canMinusChild = i.child > 1;
          const line = i.adult * i.priceAdult + i.child * i.priceChild;
          return (
            <li key={i.slotId} className="p-4 border rounded bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{i.tourTitle}</div>
                  <div className="text-sm text-black/60">
                    {new Date(i.startsAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <button onClick={() => remove(i.slotId)} className="text-sm underline">
                  Удалить
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Counter
                  label="Взрослых"
                  value={i.adult}
                  onMinus={canMinusAdult ? () => update(i.slotId, { adult: i.adult - 1 }) : undefined}
                  onPlus={canPlusAdult ? () => update(i.slotId, { adult: i.adult + 1 }) : undefined}
                  hint={formatRub(i.priceAdult)}
                />
                <Counter
                  label="Детей"
                  value={i.child}
                  onMinus={canMinusChild ? () => update(i.slotId, { child: i.child - 1 }) : undefined}
                  onPlus={canPlusChild ? () => update(i.slotId, { child: i.child + 1 }) : undefined}
                  hint={formatRub(i.priceChild)}
                />
              </div>
              <div className="mt-3 text-right font-medium">{formatRub(line)}</div>
            </li>
          );
        })}
      </ul>
      <div className="text-right text-xl font-serif">Итого: {formatRub(total())}</div>

      <form onSubmit={submit} className="space-y-3 mt-6">
        <label className="block">
          Имя
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full border p-2 rounded"
          />
        </label>
        <label className="block">
          Телефон
          <input
            required
            pattern="[+\d\s()\-]{6,}"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full border p-2 rounded"
          />
        </label>
        <label className="block">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full border p-2 rounded"
          />
        </label>
        {error && <div className="text-red-700 text-sm">{error}</div>}
        <button
          disabled={submitting}
          className="px-4 py-2 bg-[color:var(--cc-graphite)] text-white rounded"
        >
          {submitting ? "Отправляем…" : "Оформить"}
        </button>
      </form>
    </div>
  );
}

function Counter({
  label,
  value,
  onMinus,
  onPlus,
  hint,
}: {
  label: string;
  value: number;
  onMinus?: () => void;
  onPlus?: () => void;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20">{label}</span>
      <button
        type="button"
        disabled={!onMinus}
        onClick={onMinus}
        className="px-2 py-1 border rounded disabled:opacity-30"
      >
        −
      </button>
      <span className="w-6 text-center">{value}</span>
      <button
        type="button"
        disabled={!onPlus}
        onClick={onPlus}
        className="px-2 py-1 border rounded disabled:opacity-30"
      >
        +
      </button>
      <span className="ml-auto text-black/60">{hint}</span>
    </div>
  );
}
