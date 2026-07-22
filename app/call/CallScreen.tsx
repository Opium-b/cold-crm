"use client";

import { useState } from "react";
import type { Lead, Call, Outcome, RejectReason } from "@/lib/types";
import { GROUP_BADGE, REJECT_LABEL } from "@/lib/types";
import { displayPhone } from "@/lib/phone";
import { displayDateTime } from "@/lib/time";
import { CallScript } from "./CallScript";

interface ScreenData {
  lead: Lead | null;
  calls: Call[];
  todayCount: number;
  queueCount: number;
}

// --- Tashkent vaqti bo'yicha datetime-local qiymatlari (preset tugmalar uchun) ---
function tashkentDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
function preset(offsetDays: number, hh: string, mm: string): string {
  return `${tashkentDate(offsetDays)}T${hh}:${mm}`;
}
type ModalType = "KEYINROQ" | "QIZIQDI" | "UCHRASHUV" | "RAD" | "SOTILDI" | null;

export function CallScreen({ initial }: { initial: ScreenData }) {
  const [data, setData] = useState<ScreenData>(initial);
  const [modal, setModal] = useState<ModalType>(null);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const lead = data.lead;

  async function submit(outcome: Outcome, extra: Record<string, unknown> = {}) {
    if (!lead || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/call/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, outcome, ...extra }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert("Xatolik: " + (j.error || res.status));
        return;
      }
      const next: ScreenData = await res.json();
      setData(next);
      setModal(null);
      setHistoryOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    if (!lead || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/call/next?exclude=${lead.id}`);
      if (res.ok) setData(await res.json());
      setHistoryOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function copyPhone() {
    if (!lead) return;
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    // navigator.clipboard faqat https/localhost'da ishlaydi. LAN (http) uchun
    // eski usul (execCommand) bilan zaxira qilamiz.
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(lead.phone).then(done).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      const ta = document.createElement("textarea");
      ta.value = lead!.phone;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch {
        /* xatolik bo'lsa jimgina */
      }
      document.body.removeChild(ta);
    }
  }

  if (!lead) {
    return (
      <div className="mt-20 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Navbat bo&apos;sh!</h2>
        <p className="mt-2 text-slate-500">
          Hozircha qo&apos;ng&apos;iroq qilinadigan lid yo&apos;q. Yangi lid import qiling
          yoki keyinroq qayting.
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Bugun qilingan qo&apos;ng&apos;iroqlar: {data.todayCount}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-40">
      {/* Progress */}
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>
          Bugun: <b className="text-slate-900">{data.todayCount}</b> qo&apos;ng&apos;iroq
        </span>
        <span>
          Navbatda: <b className="text-slate-900">{data.queueCount}</b> ta
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Asosiy kartochka */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight text-slate-900">
              {lead.name}
            </h1>
            <span
              className={`shrink-0 rounded-lg px-3 py-1 text-sm font-bold ${GROUP_BADGE[lead.group]}`}
            >
              {lead.group}
            </span>
          </div>

          {/* Telefon - juda katta */}
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
            <a
              href={`tel:${lead.phone}`}
              className="block text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"
            >
              {displayPhone(lead.phone)}
            </a>
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={copyPhone}
                className="btn bg-slate-200 px-4 py-2 text-sm text-slate-800 hover:bg-slate-300"
              >
                {copied ? "✓ Nusxalandi" : "Nusxalash"}
              </button>
              <a
                href={`tel:${lead.phone}`}
                className="btn bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
              >
                📞 Qo&apos;ng&apos;iroq
              </a>
            </div>
            {lead.phone2 && (
              <div className="mt-2 text-sm text-slate-500">
                Qo&apos;shimcha:{" "}
                <a href={`tel:${lead.phone2}`} className="underline">
                  {displayPhone(lead.phone2)}
                </a>
              </div>
            )}
          </div>

          {/* Ma'lumotlar */}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Info label="Manzil" value={lead.address} full />
            <Info
              label="Reyting"
              value={
                lead.rating != null
                  ? `⭐ ${lead.rating}${lead.reviews_count != null ? ` (${lead.reviews_count} sharh)` : ""}`
                  : null
              }
            />
            <Info label="Ish vaqti" value={lead.work_hours} />
            <Info label="Instagram" value={lead.instagram} full />
            <Info label="Ma'lumot" value={lead.info} full />
          </dl>

          {/* Qo'ng'iroqlar tarixi (akkordeon) */}
          {data.calls.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-medium text-slate-600"
              >
                <span>Avvalgi qo&apos;ng&apos;iroqlar ({data.calls.length})</span>
                <span>{historyOpen ? "▲" : "▼"}</span>
              </button>
              {historyOpen && (
                <ul className="mt-2 space-y-2">
                  {data.calls.map((c) => (
                    <li key={c.id} className="rounded-lg bg-slate-50 p-2 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>{displayDateTime(c.called_at)}</span>
                        <span className="font-medium">{c.outcome}</span>
                      </div>
                      {c.note && <div className="mt-1 text-slate-700">{c.note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Suhbat skripti */}
        <CallScript />
      </div>

      {/* Natija tugmalari - pastda, katta (telefon uchun qulay) */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2 sm:grid-cols-4">
          <ResultBtn color="gray" disabled={busy} onClick={() => submit("KOTARMADI")}>
            Ko&apos;tarmadi
          </ResultBtn>
          <ResultBtn color="amber" disabled={busy} onClick={() => setModal("KEYINROQ")}>
            Keyinroq
          </ResultBtn>
          <ResultBtn color="green" disabled={busy} onClick={() => setModal("QIZIQDI")}>
            Qiziqdi
          </ResultBtn>
          <ResultBtn color="blue" disabled={busy} onClick={() => setModal("UCHRASHUV")}>
            Uchrashuv
          </ResultBtn>
          <ResultBtn color="red" disabled={busy} onClick={() => setModal("RAD")}>
            Rad etdi
          </ResultBtn>
          <ResultBtn color="black" disabled={busy} onClick={() => submit("NOTOGRI_RAQAM")}>
            Noto&apos;g&apos;ri raqam
          </ResultBtn>
          <ResultBtn color="gold" disabled={busy} onClick={() => setModal("SOTILDI")}>
            Sotildi!
          </ResultBtn>
          <button
            onClick={skip}
            disabled={busy}
            className="btn border border-slate-300 bg-white py-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            O&apos;tkazib yuborish
          </button>
        </div>
      </div>

      {/* Modallar */}
      {modal === "KEYINROQ" && (
        <KeyinroqModal busy={busy} onClose={() => setModal(null)} onSubmit={submit} />
      )}
      {modal === "QIZIQDI" && (
        <NoteModal
          title="Qiziqdi — nima kelishildi?"
          placeholder="Masalan: Telegramga namuna yuborish kerak"
          color="green"
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={(note) => submit("QIZIQDI", { note })}
        />
      )}
      {modal === "UCHRASHUV" && (
        <UchrashuvModal busy={busy} onClose={() => setModal(null)} onSubmit={submit} />
      )}
      {modal === "RAD" && (
        <RadModal busy={busy} onClose={() => setModal(null)} onSubmit={submit} />
      )}
      {modal === "SOTILDI" && (
        <NoteModal
          title="🎉 Sotildi! Tafsilotlar"
          placeholder="Summa, shartlar..."
          color="gold"
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={(note) => submit("SOTILDI", { note })}
        />
      )}
    </div>
  );
}

// ------------------------------- Yordamchi UI -------------------------------

function Info({
  label,
  value,
  full,
}: {
  label: string;
  value: string | null | undefined;
  full?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}

const COLORS: Record<string, string> = {
  gray: "bg-gray-500 hover:bg-gray-600 text-white",
  amber: "bg-amber-500 hover:bg-amber-600 text-white",
  green: "bg-green-600 hover:bg-green-700 text-white",
  blue: "bg-blue-600 hover:bg-blue-700 text-white",
  red: "bg-red-600 hover:bg-red-700 text-white",
  black: "bg-neutral-900 hover:bg-black text-white",
  gold: "bg-yellow-500 hover:bg-yellow-600 text-white",
};

function ResultBtn({
  color,
  children,
  onClick,
  disabled,
}: {
  color: keyof typeof COLORS;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn py-3 text-sm ${COLORS[color]}`}
    >
      {children}
    </button>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-lg font-bold text-slate-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function KeyinroqModal({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (o: Outcome, e: Record<string, unknown>) => void;
}) {
  const [when, setWhen] = useState(preset(0, "17", "00"));
  const [note, setNote] = useState("");
  const presets = [
    { label: "Bugun 17:00", val: preset(0, "17", "00") },
    { label: "Ertaga 11:00", val: preset(1, "11", "00") },
    { label: "Ertaga 16:00", val: preset(1, "16", "00") },
  ];
  return (
    <ModalShell title="Keyinroq qo'ng'iroq qilish" onClose={onClose}>
      <div className="mb-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setWhen(p.val)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              when === p.val ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-800"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="mb-1 block text-sm text-slate-600">Yoki qo&apos;lda tanlang</label>
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Izoh (ixtiyoriy)"
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
        rows={2}
      />
      <div className="flex gap-2">
        <button onClick={onClose} className="btn flex-1 bg-slate-100 py-2.5 text-slate-700">
          Bekor
        </button>
        <button
          disabled={busy || !when}
          onClick={() => onSubmit("KEYINROQ", { nextAtLocal: when, note })}
          className="btn flex-1 bg-amber-500 py-2.5 text-white"
        >
          Saqlash
        </button>
      </div>
    </ModalShell>
  );
}

function UchrashuvModal({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (o: Outcome, e: Record<string, unknown>) => void;
}) {
  const [when, setWhen] = useState(preset(1, "11", "00"));
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  return (
    <ModalShell title="Uchrashuv belgilash" onClose={onClose}>
      <label className="mb-1 block text-sm text-slate-600">Sana va vaqt</label>
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      <label className="mb-1 block text-sm text-slate-600">Joy</label>
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Manzil / do'kon"
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Izoh (ixtiyoriy)"
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
        rows={2}
      />
      <div className="flex gap-2">
        <button onClick={onClose} className="btn flex-1 bg-slate-100 py-2.5 text-slate-700">
          Bekor
        </button>
        <button
          disabled={busy || !when}
          onClick={() => onSubmit("UCHRASHUV", { meetAtLocal: when, location, note })}
          className="btn flex-1 bg-blue-600 py-2.5 text-white"
        >
          Belgilash
        </button>
      </div>
    </ModalShell>
  );
}

function RadModal({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (o: Outcome, e: Record<string, unknown>) => void;
}) {
  const [reason, setReason] = useState<RejectReason>("KERAK_EMAS");
  const [note, setNote] = useState("");
  const reasons = Object.entries(REJECT_LABEL) as [RejectReason, string][];
  return (
    <ModalShell title="Rad etish sababi" onClose={onClose}>
      <div className="mb-3 space-y-1.5">
        {reasons.map(([val, label]) => (
          <label
            key={val}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 has-[:checked]:border-red-400 has-[:checked]:bg-red-50"
          >
            <input
              type="radio"
              name="reason"
              checked={reason === val}
              onChange={() => setReason(val)}
            />
            <span className="text-slate-800">{label}</span>
          </label>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Izoh (ixtiyoriy)"
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
        rows={2}
      />
      <div className="flex gap-2">
        <button onClick={onClose} className="btn flex-1 bg-slate-100 py-2.5 text-slate-700">
          Bekor
        </button>
        <button
          disabled={busy}
          onClick={() => onSubmit("RAD", { rejectReason: reason, note })}
          className="btn flex-1 bg-red-600 py-2.5 text-white"
        >
          Saqlash
        </button>
      </div>
    </ModalShell>
  );
}

function NoteModal({
  title,
  placeholder,
  color,
  busy,
  onClose,
  onSubmit,
}: {
  title: string;
  placeholder: string;
  color: "green" | "gold";
  busy: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const btn = color === "green" ? "bg-green-600" : "bg-yellow-500";
  return (
    <ModalShell title={title} onClose={onClose}>
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={placeholder}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
        rows={3}
      />
      <div className="flex gap-2">
        <button onClick={onClose} className="btn flex-1 bg-slate-100 py-2.5 text-slate-700">
          Bekor
        </button>
        <button
          disabled={busy}
          onClick={() => onSubmit(note)}
          className={`btn flex-1 py-2.5 text-white ${btn}`}
        >
          Saqlash
        </button>
      </div>
    </ModalShell>
  );
}
