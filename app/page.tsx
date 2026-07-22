import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getDashboard } from "@/lib/stats";
import { displayDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireAuth();
  const d = getDashboard();

  const pct = (n: number) =>
    d.funnel.total ? Math.round((n / d.funnel.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Boshqaruv paneli</h1>
      </div>

      {/* Statistika kartalari */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Bugungi qo'ng'iroqlar" value={d.todayCalls} tone="slate" />
        <Stat label="Bugun qiziqdi" value={d.todayInterested} tone="green" />
        <Stat label="Bugun uchrashuv" value={d.todayMeetings} tone="blue" />
        <Stat label="Bugun rad" value={d.todayRejected} tone="red" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Kutayotgan lidlar" value={d.waiting} tone="amber" />
        <Stat
          label="Yaqin uchrashuvlar (7 kun)"
          value={d.upcomingMeetings.length}
          tone="blue"
        />
      </div>

      {/* Katta tugma */}
      <Link
        href="/call"
        className="btn block w-full bg-green-600 py-5 text-center text-xl font-bold text-white shadow-sm hover:bg-green-700"
      >
        📞 QO&apos;NG&apos;IROQNI BOSHLASH
      </Link>

      {/* Konversiya voronkasi */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Konversiya voronkasi</h2>
        <div className="space-y-2">
          <Funnel label="Jami lidlar" value={d.funnel.total} pct={100} color="bg-slate-400" />
          <Funnel
            label="Qo'ng'iroq qilingan"
            value={d.funnel.called}
            pct={pct(d.funnel.called)}
            color="bg-sky-500"
          />
          <Funnel
            label="Qiziqqan"
            value={d.funnel.interested}
            pct={pct(d.funnel.interested)}
            color="bg-green-500"
          />
          <Funnel
            label="Uchrashuv"
            value={d.funnel.meeting}
            pct={pct(d.funnel.meeting)}
            color="bg-blue-600"
          />
          <Funnel
            label="Sotilgan"
            value={d.funnel.sold}
            pct={pct(d.funnel.sold)}
            color="bg-yellow-500"
          />
        </div>
      </section>

      {/* Yaqin uchrashuvlar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Yaqin uchrashuvlar</h2>
          <Link href="/meetings" className="text-sm text-blue-600 hover:underline">
            Barchasi →
          </Link>
        </div>
        {d.upcomingMeetings.length === 0 ? (
          <p className="text-sm text-slate-400">Kelgusi 7 kunda uchrashuv yo&apos;q.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {d.upcomingMeetings.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5">
                <Link href={`/leads/${m.lead_id}`} className="font-medium text-slate-800 hover:underline">
                  {m.name}
                </Link>
                <span className="text-sm text-slate-500">
                  {displayDateTime(m.meet_at)}
                  {m.location ? ` · ${m.location}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const TONE: Record<string, string> = {
  slate: "text-slate-900",
  green: "text-green-600",
  blue: "text-blue-600",
  red: "text-red-600",
  amber: "text-amber-600",
};

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`text-3xl font-extrabold ${TONE[tone]}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Funnel({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">
          {value} <span className="text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
