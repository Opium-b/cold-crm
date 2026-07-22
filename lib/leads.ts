import { db } from "./db";
import { Lead, Call, Outcome, RejectReason } from "./types";
import { utcNow, utcPlus, DAY, tashkentPreset } from "./time";
import {
  sendTelegram,
  msgQiziqdi,
  msgUchrashuv,
  msgSotildi,
} from "./telegram";
import { displayDateTime } from "./time";

// -----------------------------------------------------------------------------
// Navbat mantig'i: qaysi lidga hozir qo'ng'iroq qilinadi.
//   1) vaqti kelgan lidlar (next_action_at <= hozir) — eng eskisidan
//   2) YANGI lidlar — A guruh birinchi, keyin B, C, D
// -----------------------------------------------------------------------------

// node:sqlite null-prototipli obyekt qaytaradi; uni oddiy obyektga aylantiramiz
// (Server -> Client Component ga uzatish uchun zarur).
function plain<T>(row: T | undefined | null): T | null {
  return row ? ({ ...row } as T) : null;
}
function plainAll<T>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r }) as T);
}

export function getNextLead(excludeId?: number): Lead | null {
  const now = utcNow();
  const exclude = excludeId ?? -1;

  // 1-navbat: vaqti kelgan qayta harakatlar
  const due = db
    .prepare(
      `SELECT * FROM leads
       WHERE id != ?
         AND next_action_at IS NOT NULL
         AND next_action_at <= ?
         AND status NOT IN ('SOTILDI','RAD','NOTOGRI_RAQAM','UCHRASHUV')
       ORDER BY next_action_at ASC
       LIMIT 1`
    )
    .get(exclude, now) as Lead | undefined;
  if (due) return plain(due);

  // 2-navbat: yangi lidlar, guruh bo'yicha
  const fresh = db
    .prepare(
      `SELECT * FROM leads
       WHERE id != ?
         AND status = 'YANGI'
         AND (next_action_at IS NULL OR next_action_at <= ?)
       ORDER BY CASE "group" WHEN 'A' THEN 0 WHEN 'B' THEN 1 WHEN 'C' THEN 2 ELSE 3 END,
                created_at ASC
       LIMIT 1`
    )
    .get(exclude, now) as Lead | undefined;
  return plain(fresh);
}

// Navbatda nechta lid qolgan (taxminiy)
export function queueCount(): number {
  const now = utcNow();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM leads
       WHERE (
         (next_action_at IS NOT NULL AND next_action_at <= ?
          AND status NOT IN ('SOTILDI','RAD','NOTOGRI_RAQAM','UCHRASHUV'))
         OR (status = 'YANGI' AND (next_action_at IS NULL OR next_action_at <= ?))
       )`
    )
    .get(now, now) as { c: number };
  return row.c;
}

// Bugun (Tashkent) qilingan qo'ng'iroqlar soni
export function todayCallCount(): number {
  const start = tashkentPreset(0, 0, 0); // bugun 00:00 Tashkent -> UTC
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM calls WHERE called_at >= ?")
    .get(start) as { c: number };
  return row.c;
}

// /call ekrani uchun to'liq ma'lumot to'plami
export function callScreenData(excludeId?: number) {
  const lead = getNextLead(excludeId);
  return {
    lead,
    calls: lead ? getCalls(lead.id) : [],
    todayCount: todayCallCount(),
    queueCount: queueCount(),
  };
}

export function getLead(id: number): Lead | null {
  return plain(db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as unknown as Lead);
}

export function getCalls(leadId: number): Call[] {
  return plainAll(
    db
      .prepare("SELECT * FROM calls WHERE lead_id = ? ORDER BY called_at DESC")
      .all(leadId) as unknown as Call[]
  );
}

function touch(id: number) {
  db.prepare("UPDATE leads SET updated_at = ? WHERE id = ?").run(utcNow(), id);
}

// -----------------------------------------------------------------------------
// Qo'ng'iroq natijasini qayd etish. Bu markaziy funksiya:
// Call yozadi, lid statusini/next_action_at ni yangilaydi, kerak bo'lsa
// Meeting/Reminder yaratadi va Telegramga xabar yuboradi.
// -----------------------------------------------------------------------------

export interface OutcomePayload {
  outcome: Outcome;
  note?: string;
  durationHint?: "QISQA" | "ORTACHA" | "UZOQ" | null;
  nextAt?: string | null; // KEYINROQ uchun (UTC)
  meetAt?: string | null; // UCHRASHUV uchun (UTC)
  location?: string | null; // UCHRASHUV uchun
  rejectReason?: RejectReason | null; // RAD uchun
}

export async function recordOutcome(leadId: number, p: OutcomePayload): Promise<void> {
  const lead = getLead(leadId);
  if (!lead) throw new Error("Lid topilmadi: " + leadId);
  const note = (p.note || "").trim() || null;

  // 1) Qo'ng'iroq yozuvi
  db.prepare(
    `INSERT INTO calls (lead_id, called_at, outcome, note, duration_hint)
     VALUES (?, ?, ?, ?, ?)`
  ).run(leadId, utcNow(), p.outcome, note, p.durationHint ?? null);

  // 2) Har bir natija bo'yicha lidni yangilash
  switch (p.outcome) {
    case "KOTARMADI": {
      const streak = lead.no_answer_streak + 1;
      // 3 marta ketma-ket ko'tarmasa 7 kundan keyin, aks holda ertaga
      const next = streak >= 3 ? utcPlus(7 * DAY) : utcPlus(1 * DAY);
      db.prepare(
        `UPDATE leads SET status='KOTARMADI', no_answer_streak=?, next_action_at=?, updated_at=? WHERE id=?`
      ).run(streak, next, utcNow(), leadId);
      break;
    }

    case "KEYINROQ": {
      const next = p.nextAt || utcPlus(1 * DAY);
      db.prepare(
        `UPDATE leads SET status='KEYINROQ', no_answer_streak=0, next_action_at=?, updated_at=? WHERE id=?`
      ).run(next, utcNow(), leadId);
      db.prepare(
        `INSERT INTO reminders (lead_id, remind_at, type, sent) VALUES (?, ?, 'QAYTA_QONGIROQ', 0)`
      ).run(leadId, next);
      break;
    }

    case "QIZIQDI": {
      const next = utcPlus(1 * DAY); // ertaga follow-up
      db.prepare(
        `UPDATE leads SET status='QIZIQDI', no_answer_streak=0, next_action_at=?, updated_at=? WHERE id=?`
      ).run(next, utcNow(), leadId);
      await sendTelegram(msgQiziqdi(lead, note || ""));
      break;
    }

    case "UCHRASHUV": {
      const meetAt = p.meetAt;
      if (!meetAt) throw new Error("Uchrashuv vaqti kiritilmagan");
      db.prepare(
        `UPDATE leads SET status='UCHRASHUV', no_answer_streak=0, next_action_at=NULL, updated_at=? WHERE id=?`
      ).run(utcNow(), leadId);
      db.prepare(
        `INSERT INTO meetings (lead_id, meet_at, location, status, note)
         VALUES (?, ?, ?, 'REJALANGAN', ?)`
      ).run(leadId, meetAt, p.location ?? null, note);
      // Eslatmalar: 1 kun oldin va 2 soat oldin
      const oneDayBefore = shift(meetAt, -1 * DAY);
      const twoHoursBefore = shift(meetAt, -2 * 60 * 60 * 1000);
      db.prepare(
        `INSERT INTO reminders (lead_id, remind_at, type, sent) VALUES (?, ?, 'UCHRASHUV_1KUN', 0)`
      ).run(leadId, oneDayBefore);
      db.prepare(
        `INSERT INTO reminders (lead_id, remind_at, type, sent) VALUES (?, ?, 'UCHRASHUV_2SOAT', 0)`
      ).run(leadId, twoHoursBefore);
      await sendTelegram(
        msgUchrashuv(lead, displayDateTime(meetAt), p.location ?? "", note || "")
      );
      break;
    }

    case "RAD": {
      db.prepare(
        `UPDATE leads SET status='RAD', reject_reason=?, no_answer_streak=0, next_action_at=NULL, updated_at=? WHERE id=?`
      ).run(p.rejectReason ?? "BOSHQA", utcNow(), leadId);
      // 90 kundan keyin qayta urinish
      db.prepare(
        `INSERT INTO reminders (lead_id, remind_at, type, sent) VALUES (?, ?, 'RAD_QAYTA', 0)`
      ).run(leadId, utcPlus(90 * DAY));
      break;
    }

    case "SOTILDI": {
      db.prepare(
        `UPDATE leads SET status='SOTILDI', no_answer_streak=0, next_action_at=NULL, updated_at=? WHERE id=?`
      ).run(utcNow(), leadId);
      await sendTelegram(msgSotildi(lead, note || ""));
      break;
    }

    case "NOTOGRI_RAQAM": {
      db.prepare(
        `UPDATE leads SET status='NOTOGRI_RAQAM', next_action_at=NULL, updated_at=? WHERE id=?`
      ).run(utcNow(), leadId);
      break;
    }
  }
}

// UTC satrga millisekund qo'shish/ayirish, natija ham UTC satr
function shift(utc: string, ms: number): string {
  const d = new Date(utc.replace(" ", "T") + "Z");
  const r = new Date(d.getTime() + ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${r.getUTCFullYear()}-${pad(r.getUTCMonth() + 1)}-${pad(r.getUTCDate())} ` +
    `${pad(r.getUTCHours())}:${pad(r.getUTCMinutes())}:${pad(r.getUTCSeconds())}`
  );
}
