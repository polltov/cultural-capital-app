"use client";
import { useActionState, useState } from "react";
import { upsertTourAction } from "@/src/actions/admin-tour-upsert";

type Tour = {
  id: string; slug: string; title: string; tag: string; route: string; durationMin: number;
  meta: string; descriptionMd: string; priceAdult: number; priceChild: number;
  photoUrl: string | null; published: boolean;
};

export function TourForm({ tour }: { tour: Tour | null }) {
  const [err, action, pending] = useActionState(upsertTourAction, null);
  const [photoUrl, setPhotoUrl] = useState(tour?.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/admin/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST", body: file,
      });
      const data = await res.json();
      if (data.url) setPhotoUrl(data.url); else alert("upload failed");
    } finally { setUploading(false); }
  }

  return (
    <form action={action} className="space-y-3 max-w-xl">
      {tour && <input type="hidden" name="id" value={tour.id} />}
      <label className="block">Slug<input required name="slug" defaultValue={tour?.slug} className="w-full border p-2 rounded" /></label>
      <label className="block">Заголовок<input required name="title" defaultValue={tour?.title} className="w-full border p-2 rounded" /></label>
      <label className="block">Тег<input name="tag" defaultValue={tour?.tag} className="w-full border p-2 rounded" /></label>
      <label className="block">Маршрут<input name="route" defaultValue={tour?.route} className="w-full border p-2 rounded" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">Длительность (мин)<input name="durationMin" type="number" defaultValue={tour?.durationMin ?? 0} className="w-full border p-2 rounded" /></label>
        <label className="block">Мета<input name="meta" defaultValue={tour?.meta} className="w-full border p-2 rounded" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">Цена взрослого (₽)<input name="priceAdultRub" type="number" min="0" required defaultValue={tour ? tour.priceAdult / 100 : ""} className="w-full border p-2 rounded" /></label>
        <label className="block">Цена детского (₽)<input name="priceChildRub" type="number" min="0" required defaultValue={tour ? tour.priceChild / 100 : ""} className="w-full border p-2 rounded" /></label>
      </div>
      <label className="block">Описание (markdown)
        <textarea name="descriptionMd" rows={6} defaultValue={tour?.descriptionMd} className="w-full border p-2 rounded"></textarea>
      </label>

      <div>
        <label className="block text-sm">Фото</label>
        <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} />
        {uploading && <span className="ml-2 text-sm">загрузка…</span>}
        <input type="hidden" name="photoUrl" value={photoUrl} />
        {photoUrl && <img src={photoUrl} alt="" className="mt-2 max-w-xs rounded" />}
      </div>

      <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={tour?.published ?? false} /> Опубликовано</label>

      {err && <div className="text-red-700 text-sm">{err}</div>}
      <button disabled={pending} className="bg-black text-white px-4 py-2 rounded">{pending ? "…" : "Сохранить"}</button>
    </form>
  );
}
