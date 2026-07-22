import "./globals.css";
import { Playfair_Display, Prata, PT_Serif, PT_Sans } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--font-playfair",
  display: "swap",
});

const prata = Prata({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-prata",
  display: "swap",
});

const ptSerif = PT_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-pt-serif",
  display: "swap",
});

const ptSans = PT_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
  display: "swap",
});

export const metadata = {
  title: "Культурная Столица · Экскурсии для семей в Санкт-Петербурге",
  description:
    "Авторские маршруты по Санкт-Петербургу для детей и взрослых. Историки и искусствоведы, которые умеют говорить с детьми на одном языке.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${playfair.variable} ${prata.variable} ${ptSerif.variable} ${ptSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
