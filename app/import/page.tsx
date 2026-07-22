import { requireAuth } from "@/lib/auth";
import { ImportClient } from "./ImportClient";

export default async function ImportPage() {
  await requireAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Excel/CSV import</h1>
      <p className="text-sm text-slate-500">
        .xlsx yoki .csv faylni tanlang. Ustunlar avtomatik moslashtiriladi — kerak bo&apos;lsa
        qo&apos;lda to&apos;g&apos;rilang. Telefoni yo&apos;q va dublikat qatorlar o&apos;tkazib
        yuboriladi.
      </p>
      <ImportClient />
    </div>
  );
}
