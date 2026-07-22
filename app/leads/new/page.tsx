import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createLead } from "../actions";
import { LeadFields } from "../LeadFields";

export default async function NewLeadPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/leads" className="hover:underline">
          Lidlar
        </Link>
        <span>/</span>
        <span className="text-slate-900">Yangi lid</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Yangi lid qo&apos;shish</h1>
      <form action={createLead} className="rounded-2xl border border-slate-200 bg-white p-5">
        <LeadFields />
        <div className="mt-5 flex gap-2">
          <Link href="/leads" className="btn bg-slate-100 px-5 py-2.5 text-slate-700">
            Bekor
          </Link>
          <button className="btn bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800">
            Saqlash
          </button>
        </div>
      </form>
    </div>
  );
}
