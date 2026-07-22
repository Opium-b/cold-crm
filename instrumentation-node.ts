// Faqat Node.js runtime'da yuklanadi (instrumentation.ts orqali).
// Har 60 soniyada vaqti kelgan eslatmalarni yuboradi (lokal/VPS uchun).
import { processReminders } from "./lib/reminders";

const g = globalThis as unknown as { __CRM_REMINDER_TIMER__?: NodeJS.Timeout };

if (!g.__CRM_REMINDER_TIMER__ && process.env.DISABLE_INTERNAL_CRON !== "1") {
  g.__CRM_REMINDER_TIMER__ = setInterval(() => {
    processReminders().catch((e) => console.error("[cron] xatolik:", e));
  }, 60_000);
  console.log("[crm] Eslatma scheduler ishga tushdi (har 60 soniya)");
}
