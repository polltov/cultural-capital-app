import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** If true, renders decorative blobs inside the mock. Defaults to true. */
  withBlobs?: boolean;
};

/**
 * PublicShell — the "cream album" outer container from direction-d.
 * Recreates the .mock frame: rounded, ivory, with drop-shadow and
 * decorative organic "blob" shapes at the corners.
 */
export function PublicShell({ children, withBlobs = true }: Props) {
  return (
    <div className="min-h-screen bg-ivory relative overflow-hidden">
      {withBlobs && (
        <>
          <span className="cc-blob b1" />
          <span className="cc-blob b2" />
          <span className="cc-blob b3" />
          <span className="cc-blob b4" />
          <span className="cc-blob b5" />
          <span className="cc-blob b6" />
        </>
      )}
      <div className="relative z-10 max-w-[1000px] mx-auto">
        <TopBar />
        {children}
        <Footer />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="relative z-10 flex justify-between items-center px-10 py-6 max-md:px-6 max-md:py-4 max-md:flex-wrap max-md:gap-3">
      <Link href="/" aria-label="Культурная Столица" className="flex items-center gap-3.5 no-underline">
        <span className="relative flex-none block h-8 w-7 -translate-y-0.5">
          <span
            className="absolute inset-0 block"
            style={{
              background: "linear-gradient(135deg,#4b5f78,#26303b)",
              borderRadius: "60% 40% 55% 45% / 45% 55% 45% 55%",
            }}
          />
          <span
            className="absolute"
            style={{
              top: 14,
              left: -8,
              width: 12,
              height: 14,
              background: "#a34a2f",
              borderRadius: "55% 45% 60% 40% / 60% 40% 60% 40%",
              opacity: 0.95,
            }}
          />
        </span>
        <span
          className="whitespace-nowrap text-[28px] md:text-[32px] leading-none tracking-[-0.01em] text-ink -translate-y-1"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Культурная Столица
        </span>
      </Link>
      <nav
        className="flex gap-6 items-center text-ink text-[14px]"
        style={{ fontFamily: "var(--font-sans-ui)" }}
      >
        <Link href="/" className="hover:text-terracotta transition-colors">
          Экскурсии
        </Link>
        <Link href="/cart" className="hover:text-terracotta transition-colors">
          Корзина
        </Link>
        <a
          href="https://t.me/kulturnaya_stolitsa"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-terracotta text-paper py-2.5 px-5 rounded-sm text-[13px] font-bold tracking-[0.06em]"
        >
          Написать
        </a>
      </nav>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="relative z-10 border-t px-10 py-8 max-md:px-6 max-md:py-6 flex flex-col md:flex-row justify-between gap-4 text-[12px] tracking-[0.14em] uppercase"
      style={{
        borderColor: "rgba(34,41,58,0.14)",
        color: "var(--cc-slate)",
        fontFamily: "var(--font-sans-ui)",
      }}
    >
      <span>© {new Date().getFullYear()} · Культурная Столица · Санкт-Петербург</span>
      <span>
        <a href="mailto:hello@kulturnaya-stolitsa.ru" className="hover:text-terracotta">
          hello@kulturnaya-stolitsa.ru
        </a>
      </span>
    </footer>
  );
}
