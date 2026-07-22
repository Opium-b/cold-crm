import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { displayDateTime, nowLocalInput } from "@/lib/time";
import { displayPhone } from "@/lib/phone";
import { setMeetingStatus, rescheduleMeeting } from "./actions";

export const dynamic = "force-dynamic";

interface Row {
  id: number;
  lead_id: number;
  meet_at: string;
  location: string | null;
  status: "REJALANGAN" | "OTKAZILDI" | "BEKOR";
  note: string | null;
  name: string;
  phone: string;
}

const STATUS_LABEL: Record<string, string> = {
  REJALANGAN: "Rejalangan",
  OTKAZILDI: "O'tkazildi",
  BEKOR: "Bekor qilingan",
};
const STATUS_STYLE: Record<string, string> = {
  REJALANGAN: "bg-blue-100 text-blue-800",
  OTKAZILDI: "bg-green-100 text-green-800",
  BEKOR: "bg-red-100 text-red-700",
};

export default async function MeetingsPage() {
  await requireAuth();
  const rows = db
    .prepare(
      `SELECT m.*, l.name, l.phone
       FROM meetings m JOIN leads l ON l.id = m.lead_id
       ORDER BY CASE m.status WHEN 'REJALANGAN' THEN 0 ELSE 1 END, m.meet_at ASC`
    )
    .all() as unknown as Row[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Uchrashuvlar ({rows.length})</h1>
      {rows.length === 0 ? (
        <p className="text-slate-400">Hozircha uchrashuv yo&apos;q.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/leads/${m.lead_id}`} className="font-semibold text-slate-900 hover:underline">
                    {m.name}
                  </Link>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[m.status]}`}>
                    {STATUS_LABEL[m.status]}
                  </span>
                </div>
                <a href={`tel:${m.phone}`} className="text-sm text-slate-500 hover:underline">
                  {displayPhone(m.phone)}
                </a>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                🕐 {displayDateTime(m.meet_at)}
                {m.location ? ` · 📍 ${m.location}` : ""}
              </div>
              {m.note && <p className="mt-1 text-sm text-slate-500">{m.note}</p>}

              {m.status === "REJALANGAN" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={setMeetingStatus.bind(null, m.id, "OTKAZILDI")}>
                    <button className="btn bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">
                      O&apos;tkazildi
                    </button>
                  </form>
                  <form action={setMeetingStatus.bind(null, m.id, "BEKOR")}>
                    <button className="btn bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200">
                      Bekor
                    </button>
                  </form>
                  <form action={rescheduleMeeting.bind(null, m.id)} className="flex items-center gap-1">
                    <input
                      type="datetime-local"
                      name="meet_at"
                      defaultValue={nowLocalInput()}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button className="btn bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                      Ko&apos;chirish
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
