import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLead, getCalls } from "@/lib/leads";
import {
  Meeting,
  STATUS_LABEL,
  STATUS_BADGE,
  GROUP_BADGE,
  REJECT_LABEL,
  LeadStatus,
} from "@/lib/types";
import { displayPhone } from "@/lib/phone";
import { displayDateTime, nowLocalInput } from "@/lib/time";
import { updateLead, changeStatus, addReminder } from "../actions";
import { LeadFields } from "../LeadFields";

export const dynamic = "force-dynamic";

const STATUSES: LeadStatus[] = [
  "YANGI",
  "KOTARMADI",
  "KEYINROQ",
  "QIZIQDI",
  "UCHRASHUV",
  "RAD",
  "SOTILDI",
  "NOTOGRI_RAQAM",
];

interface Reminder {
  id: number;
  remind_at: string;
  type: string;
  sent: number;
}

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const leadId = Number(id);
  const lead = getLead(leadId);
  if (!lead) notFound();

  const calls = getCalls(leadId);
  const meetings = db
    .prepare("SELECT * FROM meetings WHERE lead_id = ? ORDER BY meet_at DESC")
    .all(leadId) as unknown as Meeting[];
  const reminders = db
    .prepare("SELECT * FROM reminders WHERE lead_id = ? ORDER BY remind_at ASC")
    .all(leadId) as unknown as Reminder[];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/leads" className="hover:underline">
          Lidlar
        </Link>
        <span>/</span>
        <span className="text-slate-900">{lead.name}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${GROUP_BADGE[lead.group]}`}>
          {lead.group}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${STATUS_BADGE[lead.status]}`}>
          {STATUS_LABEL[lead.status]}
        </span>
        <a
          href={`tel:${lead.phone}`}
          className="ml-auto btn bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
        >
          📞 {displayPhone(lead.phone)}
        </a>
      </div>

      {lead.reject_reason && (
        <p className="text-sm text-red-600">
          Rad sababi: {REJECT_LABEL[lead.reject_reason]}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Chap: tahrirlash */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Ma&apos;lumotlarni tahrirlash</h2>
            <form action={updateLead.bind(null, leadId)}>
              <LeadFields lead={lead} />
              <div className="mt-4">
                <button className="btn bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800">
                  Yangilash
                </button>
              </div>
            </form>
          </section>

          {/* Qo'ng'iroqlar tarixi */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">
              Qo&apos;ng&apos;iroqlar tarixi ({calls.length})
            </h2>
            {calls.length === 0 ? (
              <p className="text-sm text-slate-400">Hali qo&apos;ng&apos;iroq yo&apos;q.</p>
            ) : (
              <ul className="space-y-2">
                {calls.map((c) => (
                  <li key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>{displayDateTime(c.called_at)}</span>
                      <span className="font-semibold text-slate-700">{c.outcome}</span>
                    </div>
                    {c.note && <p className="mt-1 text-slate-700">{c.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* O'ng: status, uchrashuvlar, eslatmalar */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Statusni o&apos;zgartirish</h2>
            <form action={changeStatus.bind(null, leadId)} className="flex gap-2">
              <select
                name="status"
                defaultValue={lead.status}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button className="btn bg-slate-900 px-4 py-2 text-sm text-white">Saqlash</button>
            </form>
          </section>

          {meetings.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 font-semibold text-slate-900">Uchrashuvlar</h2>
              <ul className="space-y-2 text-sm">
                {meetings.map((m) => (
                  <li key={m.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="font-medium text-slate-800">{displayDateTime(m.meet_at)}</div>
                    <div className="text-slate-500">
                      {m.location || "—"} · {m.status}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Eslatmalar</h2>
            {reminders.length > 0 && (
              <ul className="mb-3 space-y-1.5 text-sm">
                {reminders.map((r) => (
                  <li key={r.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-slate-700">{displayDateTime(r.remind_at)}</span>
                    <span className={r.sent ? "text-slate-400" : "text-amber-600"}>
                      {r.type} {r.sent ? "✓" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <form action={addReminder.bind(null, leadId)} className="space-y-2">
              <input
                type="datetime-local"
                name="remind_at"
                defaultValue={nowLocalInput()}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select name="type" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="QAYTA_QONGIROQ">Qayta qo&apos;ng&apos;iroq</option>
                <option value="UCHRASHUV_1KUN">Uchrashuv (1 kun)</option>
                <option value="UCHRASHUV_2SOAT">Uchrashuv (2 soat)</option>
                <option value="RAD_QAYTA">Rad — qayta urinish</option>
              </select>
              <button className="btn w-full bg-amber-500 py-2 text-sm text-white hover:bg-amber-600">
                + Eslatma qo&apos;shish
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
