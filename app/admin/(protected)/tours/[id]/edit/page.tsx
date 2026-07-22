import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getTourById } from "@/src/db/queries/tours";
import { TourForm } from "@/src/components/admin/TourForm";
import { deleteTourAction } from "@/src/actions/admin-tour-delete";

export const dynamic = "force-dynamic";

export default async function EditTour({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTourById(db(), id);
  if (!t) notFound();
  return (
    <div>
      <h1 className="text-2xl mb-4">Редактирование</h1>
      <TourForm tour={t} />
      <form action={async () => { "use server"; await deleteTourAction(t.id); }} className="mt-6">
        <button className="text-sm text-red-700 underline">Удалить экскурсию</button>
      </form>
    </div>
  );
}
