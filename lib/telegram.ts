// Telegramga xabar yuborish. Kutubxonasiz - oddiy fetch orqali.
// Token/chat_id sozlanmagan bo'lsa jimgina o'tkazib yuboradi (xatolik bermaydi),
// shunda CRM Telegramsiz ham ishlayveradi.

export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[telegram] TOKEN yoki CHAT_ID sozlanmagan — xabar yuborilmadi");
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("[telegram] xatolik:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[telegram] tarmoq xatosi:", e);
    return false;
  }
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type LeadLike = {
  name: string;
  group: string;
  phone: string;
  address?: string | null;
};

export function msgQiziqdi(lead: LeadLike, note: string): string {
  return (
    `🔥 <b>YANGI ISSIQ LID!</b>\n` +
    `🏪 ${esc(lead.name)} (${esc(lead.group)}-guruh)\n` +
    `📞 ${esc(lead.phone)}\n` +
    `📍 ${esc(lead.address || "—")}\n` +
    `💬 Izoh: ${esc(note || "—")}\n` +
    `➡️ Keyingi qadam: ertaga follow-up`
  );
}

export function msgUchrashuv(
  lead: LeadLike,
  meetAtDisplay: string,
  location: string,
  note: string
): string {
  return (
    `📅 <b>YANGI UCHRASHUV!</b>\n` +
    `🏪 ${esc(lead.name)}\n` +
    `📞 ${esc(lead.phone)}\n` +
    `🕐 ${esc(meetAtDisplay)}\n` +
    `📍 ${esc(location || "—")}\n` +
    `💬 ${esc(note || "—")}`
  );
}

export function msgSotildi(lead: LeadLike, note: string): string {
  return (
    `🎉🎉🎉 <b>SOTILDI!</b> 🎉🎉🎉\n` +
    `🏪 ${esc(lead.name)}\n` +
    `💬 ${esc(note || "—")}`
  );
}

export function msgReminderCall(lead: LeadLike, lastNote: string): string {
  return (
    `⏰ <b>ESLATMA: qayta qo'ng'iroq</b>\n` +
    `🏪 ${esc(lead.name)} — 📞 ${esc(lead.phone)}\n` +
    `💬 ${esc(lastNote || "—")}`
  );
}

export function msgReminderMeeting(
  lead: LeadLike,
  when: string,
  meetAtDisplay: string,
  location: string
): string {
  return (
    `⏰ <b>ESLATMA: ${esc(when)}</b>\n` +
    `🏪 ${esc(lead.name)} — 🕐 ${esc(meetAtDisplay)} — 📍 ${esc(location || "—")}`
  );
}
