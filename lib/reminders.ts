import { db } from "./db";
import { utcNow } from "./time";
import { displayDateTime } from "./time";
import {
  sendTelegram,
  msgReminderCall,
  msgReminderMeeting,
} from "./telegram";
import { Lead } from "./types";

interface DueReminder {
  id: number;
  lead_id: number;
  type: string;
  remind_at: string;
}

// Vaqti kelgan eslatmalarni qayta ishlash. Route ham, setInterval ham
// shu funksiyani chaqiradi.
export async function processReminders(): Promise<{ processed: number }> {
  const now = utcNow();
  const due = db
    .prepare(
      `SELECT id, lead_id, type, remind_at FROM reminders
       WHERE sent = 0 AND remind_at <= ? ORDER BY remind_at ASC LIMIT 100`
    )
    .all(now) as unknown as DueReminder[];

  let processed = 0;

  for (const r of due) {
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(r.lead_id) as
      | Lead
      | undefined;
    if (!lead) {
      db.prepare("UPDATE reminders SET sent = 1 WHERE id = ?").run(r.id);
      continue;
    }

    try {
      if (r.type === "RAD_QAYTA") {
        // Xabar yubormaydi — lidni navbatga qaytaradi
        db.prepare(
          "UPDATE leads SET status='YANGI', next_action_at=?, reject_reason=NULL, updated_at=? WHERE id=?"
        ).run(now, now, lead.id);
      } else if (r.type === "QAYTA_QONGIROQ") {
        const lastNote = lastCallNote(lead.id);
        await sendTelegram(msgReminderCall(lead, lastNote));
      } else if (r.type === "UCHRASHUV_1KUN" || r.type === "UCHRASHUV_2SOAT") {
        const meeting = db
          .prepare(
            "SELECT meet_at, location FROM meetings WHERE lead_id = ? AND status='REJALANGAN' ORDER BY meet_at ASC LIMIT 1"
          )
          .get(lead.id) as { meet_at: string; location: string | null } | undefined;
        if (meeting) {
          const when = r.type === "UCHRASHUV_1KUN" ? "ertaga uchrashuv!" : "2 soatdan keyin uchrashuv!";
          await sendTelegram(
            msgReminderMeeting(lead, when, displayDateTime(meeting.meet_at), meeting.location || "")
          );
        }
      }
    } catch (e) {
      console.error("[reminders] xatolik id=" + r.id, e);
    }

    db.prepare("UPDATE reminders SET sent = 1 WHERE id = ?").run(r.id);
    processed++;
  }

  return { processed };
}

function lastCallNote(leadId: number): string {
  const row = db
    .prepare(
      "SELECT note FROM calls WHERE lead_id = ? AND note IS NOT NULL ORDER BY called_at DESC LIMIT 1"
    )
    .get(leadId) as { note: string } | undefined;
  return row?.note || "";
}
