import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Lead, STATUS_LABEL, STATUS_BADGE, GROUP_BADGE, LeadStatus, Group } from "@/lib/types";
import { displayPhone } from "@/lib/phone";
import { displayDateTime } from "@/lib/time";

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
const GROUPS: Group[] = ["A", "B", "C", "D"];

type Row = Lead & { last_call: string | null };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; group?: string; q?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;

  const where: string[] = [];
  const params: string[] = [];
  if (sp.status && STATUSES.includes(sp.status as LeadStatus)) {
    where.push('l.status = ?');
    params.push(sp.status);
  }
  if (sp.group && GROUPS.includes(sp.group as Group)) {
    where.push('l."group" = ?');
    params.push(sp.group);
  }
  if (sp.q && sp.q.trim()) {
    where.push("(l.name LIKE ? OR l.phone LIKE ? OR l.phone2 LIKE ?)");
    const like = `%${sp.q.trim()}%`;
    params.push(like, like, like);
  }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

  const rows = db
    .prepare(
      `SELECT l.*, (SELECT MAX(called_at) FROM calls c WHERE c.lead_id = l.id) AS last_call
       FROM leads l ${whereSql}
       ORDER BY l.updated_at DESC
       LIMIT 500`
    )
    .all(...params) as unknown as Row[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Lidlar ({rows.length})</h1>
        <Link href="/leads/new" className="btn bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
          + Yangi lid
        </Link>
      </div>

      {/* Filtrlar */}
      <form className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Qidiruv: nom yoki telefon"
          className="min-w-[180px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={sp.status || ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Barcha statuslar</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="group" defaultValue={sp.group || ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Barcha guruhlar</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}-guruh
            </option>
          ))}
        </select>
        <button className="btn bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200">
          Filtr
        </button>
        <Link href="/leads" className="px-2 py-2 text-sm text-slate-400 hover:underline">
          Tozalash
        </Link>
      </form>

      {/* Jadval */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Nom</th>
              <th className="px-3 py-2 font-medium">Telefon</th>
              <th className="px-3 py-2 font-medium">Guruh</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Oxirgi qo&apos;ng&apos;iroq</th>
              <th className="px-3 py-2 font-medium">Keyingi harakat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/leads/${l.id}`} className="font-medium text-slate-900 hover:underline">
                    {l.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{displayPhone(l.phone)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${GROUP_BADGE[l.group]}`}>
                    {l.group}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[l.status]}`}>
                    {STATUS_LABEL[l.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-500">{displayDateTime(l.last_call)}</td>
                <td className="px-3 py-2 text-slate-500">{displayDateTime(l.next_action_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  Lid topilmadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
