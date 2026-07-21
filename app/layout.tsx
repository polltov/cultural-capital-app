import "./globals.css";
export const metadata = { title: "Культурная столица", description: "Экскурсии для семей в СПб" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
