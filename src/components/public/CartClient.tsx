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
  const [form, setForm] = useState({ name: "", phone: "+7 ", email: "" });
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

  if (loading) {
    return (
      <p
        className="text-[13px] uppercase tracking-[0.2em]"
        style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
      >
        Загрузка…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cc-ticket mx-auto my-6" data-photo="0" style={{ maxWidth: 520 }}>
        <div
          className="cc-ticket-photo cc-poster-empty"
          style={{ aspectRatio: "auto", height: 160 }}
        >
          <div>
            <div className="cc-poster-empty__eyebrow">Пусто</div>
            <div
              className="cc-poster-empty__title"
              style={{ fontSize: "clamp(24px, 4vw, 34px)" }}
            >
              Здесь пока никого
            </div>
          </div>
        </div>
        <div className="cc-perf">
          <span className="cc-stub">Билет ждёт</span>
        </div>
        <div
          className="cc-ticket-info"
          style={{ padding: "22px 26px 26px", textAlign: "center" }}
        >
          <p
            className="text-[13.5px] leading-[1.6] mb-4 relative z-10"
            style={{ color: "var(--cc-slate)", fontFamily: "var(--font-serif-body)" }}
          >
            Соберите путешествие: выберите экскурсию и удобное время —
            билет займёт своё место здесь.
          </p>
          <Link
            href="/"
            className="inline-block bg-ink text-paper px-5 py-3 rounded-sm text-[11.5px] font-bold tracking-[0.14em] uppercase hover:bg-[#0e1319] relative z-10"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            К экскурсиям →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {removed.length > 0 && (
        <div
          className="p-4 rounded-lg text-[13.5px]"
          style={{
            background: "rgba(232,180,90,0.18)",
            borderLeft: "2px solid var(--cc-ochre)",
            fontFamily: "var(--font-sans-ui)",
            color: "var(--cc-ink)",
          }}
        >
          Некоторые позиции удалены: {removed.map((r) => r.reason).join(", ")}
        </div>
      )}

      <ul className="grid gap-4">
        {items.map((i) => {
          const canPlusAdult = i.adult + i.child < i.seatsLeft;
          const canPlusChild = i.adult + i.child < i.seatsLeft;
          const canMinusAdult = i.adult > 1;
          const canMinusChild = i.child > 1;
          const line = i.adult * i.priceAdult + i.child * i.priceChild;
          return (
            <li
              key={i.slotId}
              className="bg-paper rounded-lg px-6 py-5"
              style={{ border: "1px solid rgba(194,154,91,0.4)" }}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div
                    className="text-[19px] text-ink leading-[1.2]"
                    style={{ fontFamily: "var(--font-antiqua)" }}
                  >
                    {i.tourTitle}
                  </div>
                  <div
                    className="text-[11px] uppercase tracking-[0.14em] font-bold mt-1.5"
                    style={{
                      color: "var(--cc-slate)",
                      fontFamily: "var(--font-sans-ui)",
                    }}
                  >
                    {new Date(i.startsAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <button
                  onClick={() => remove(i.slotId)}
                  className="text-[11px] uppercase tracking-[0.14em] font-bold text-terracotta hover:underline"
                  style={{ fontFamily: "var(--font-sans-ui)" }}
                >
                  Удалить
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div
                className="mt-4 pt-3 text-right text-[18px] text-ink"
                style={{
                  borderTop: "1px solid rgba(194,154,91,0.4)",
                  fontFamily: "var(--font-antiqua)",
                }}
              >
                {formatRub(line)}
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className="text-right text-[24px] text-ink"
        style={{ fontFamily: "var(--font-antiqua)" }}
      >
        Итого: {formatRub(total())}
      </div>

      <form
        onSubmit={submit}
        className="bg-paper rounded-lg px-6 py-6 grid gap-4"
        style={{ border: "1px solid rgba(194,154,91,0.4)" }}
      >
        <div
          className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          Ваши контакты
        </div>
        <label className="block">
          <span
            className="text-[11px] uppercase tracking-[0.14em] font-bold"
            style={{
              color: "var(--cc-slate)",
              fontFamily: "var(--font-sans-ui)",
            }}
          >
            Имя
          </span>
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1.5 w-full px-3 py-2.5 rounded-sm bg-ivory text-ink outline-none focus:border-terracotta transition-colors"
            style={{
              border: "1px solid rgba(34,41,58,0.25)",
              fontFamily: "var(--font-serif-body)",
            }}
          />
        </label>
        <label className="block">
          <span
            className="text-[11px] uppercase tracking-[0.14em] font-bold"
            style={{
              color: "var(--cc-slate)",
              fontFamily: "var(--font-sans-ui)",
            }}
          >
            Телефон
          </span>
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            pattern="\+7\s?[\d\s()\-]{10,}"
            value={form.phone}
            onChange={(e) => {
              const v = e.target.value;
              setForm({ ...form, phone: v.startsWith("+7") ? v : "+7 " });
            }}
            onFocus={(e) => {
              if (!form.phone.trim() || form.phone === "+7") {
                setForm({ ...form, phone: "+7 " });
                requestAnimationFrame(() => {
                  const el = e.currentTarget;
                  el.setSelectionRange(el.value.length, el.value.length);
                });
              }
            }}
            className="mt-1.5 w-full px-3 py-2.5 rounded-sm bg-ivory text-ink outline-none focus:border-terracotta transition-colors"
            style={{
              border: "1px solid rgba(34,41,58,0.25)",
              fontFamily: "var(--font-serif-body)",
            }}
          />
        </label>
        <label className="block">
          <span
            className="text-[11px] uppercase tracking-[0.14em] font-bold"
            style={{
              color: "var(--cc-slate)",
              fontFamily: "var(--font-sans-ui)",
            }}
          >
            Email
          </span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5 w-full px-3 py-2.5 rounded-sm bg-ivory text-ink outline-none focus:border-terracotta transition-colors"
            style={{
              border: "1px solid rgba(34,41,58,0.25)",
              fontFamily: "var(--font-serif-body)",
            }}
          />
        </label>
        {error && (
          <div
            className="text-[13px] rounded-sm px-3 py-2"
            style={{
              background: "rgba(163,74,47,0.1)",
              color: "var(--cc-terracotta)",
              fontFamily: "var(--font-sans-ui)",
            }}
          >
            {error}
          </div>
        )}
        <button
          disabled={submitting}
          className="mt-2 bg-ink text-paper px-6 py-3.5 rounded-sm text-[13px] font-bold tracking-[0.06em] hover:bg-[#0e1319] disabled:opacity-60"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          {submitting ? "Отправляем…" : "Оформить заявку →"}
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
    <div
      className="flex items-center gap-3 bg-ivory rounded-sm px-3 py-2.5"
      style={{ border: "1px solid rgba(34,41,58,0.15)" }}
    >
      <span
        className="text-[11px] uppercase tracking-[0.14em] font-bold w-20"
        style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
      >
        {label}
      </span>
      <button
        type="button"
        disabled={!onMinus}
        onClick={onMinus}
        className="w-7 h-7 rounded-full flex items-center justify-center bg-paper text-ink disabled:opacity-30"
        style={{ border: "1px solid rgba(34,41,58,0.3)", fontFamily: "var(--font-sans-ui)" }}
        aria-label={`Уменьшить ${label.toLowerCase()}`}
      >
        −
      </button>
      <span
        className="w-6 text-center text-ink text-[16px]"
        style={{ fontFamily: "var(--font-antiqua)" }}
      >
        {value}
      </span>
      <button
        type="button"
        disabled={!onPlus}
        onClick={onPlus}
        className="w-7 h-7 rounded-full flex items-center justify-center bg-paper text-ink disabled:opacity-30"
        style={{ border: "1px solid rgba(34,41,58,0.3)", fontFamily: "var(--font-sans-ui)" }}
        aria-label={`Увеличить ${label.toLowerCase()}`}
      >
        +
      </button>
      <span
        className="ml-auto text-[11px]"
        style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
      >
        {hint}
      </span>
    </div>
  );
}
