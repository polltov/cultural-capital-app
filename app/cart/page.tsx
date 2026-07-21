import { CartClient } from "@/src/components/public/CartClient";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-serif mb-4">Корзина</h1>
      <CartClient />
    </main>
  );
}
