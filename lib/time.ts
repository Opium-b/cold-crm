// -----------------------------------------------------------------------------
// Vaqt bilan ishlash. Barcha vaqtlar bazada UTC formatida saqlanadi:
//   "YYYY-MM-DD HH:MM:SS"  (SQLite datetime('now') bilan bir xil).
// Foydalanuvchiga esa har doim Asia/Tashkent (UTC+5, yozgi vaqt yo'q) da
// ko'rsatiladi. Tashkent doimiy UTC+5 bo'lgani uchun hisob oddiy.
// -----------------------------------------------------------------------------

const TZ_OFFSET_HOURS = 5; // Asia/Tashkent

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Date -> "YYYY-MM-DD HH:MM:SS" (UTC)
function fmtUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

// Bazadagi UTC satrini Date obyektiga aylantirish
export function parseUtc(s: string): Date {
  return new Date(s.replace(" ", "T") + "Z");
}

// Hozirgi vaqt (UTC satr) - bazaga yozish uchun
export function utcNow(): string {
  return fmtUtc(new Date());
}

// Hozirdan +ms keyingi vaqt (UTC satr)
export function utcPlus(ms: number): string {
  return fmtUtc(new Date(Date.now() + ms));
}

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

// datetime-local input (Tashkent vaqti, masalan "2026-07-22T17:00")
// -> bazaga yoziladigan UTC satr
export function tashkentLocalToUtc(local: string): string {
  const m = local.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) throw new Error("Noto'g'ri sana format: " + local);
  const [, y, mo, d, h, mi] = m;
  const utcMs = Date.UTC(
    +y,
    +mo - 1,
    +d,
    +h - TZ_OFFSET_HOURS,
    +mi,
    0
  );
  return fmtUtc(new Date(utcMs));
}

// Tashkent bo'yicha "hozir" Date (wall-clock)
function tashkentNow(): Date {
  return new Date(Date.now() + TZ_OFFSET_HOURS * HOUR);
}

// Bugun/ertaga soat HH:MM (Tashkent) -> UTC satr
export function tashkentPreset(dayOffset: number, hh: number, mm: number): string {
  const t = tashkentNow();
  const utcMs = Date.UTC(
    t.getUTCFullYear(),
    t.getUTCMonth(),
    t.getUTCDate() + dayOffset,
    hh - TZ_OFFSET_HOURS,
    mm,
    0
  );
  return fmtUtc(new Date(utcMs));
}

// Ko'rsatish uchun: UTC satr -> "22.07.2026, 17:00" (Tashkent)
export function displayDateTime(utc: string | null | undefined): string {
  if (!utc) return "—";
  const d = parseUtc(utc);
  const t = new Date(d.getTime() + TZ_OFFSET_HOURS * HOUR);
  return (
    `${pad(t.getUTCDate())}.${pad(t.getUTCMonth() + 1)}.${t.getUTCFullYear()}, ` +
    `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`
  );
}

// Faqat sana: "22.07.2026" (Tashkent)
export function displayDate(utc: string | null | undefined): string {
  if (!utc) return "—";
  const d = parseUtc(utc);
  const t = new Date(d.getTime() + TZ_OFFSET_HOURS * HOUR);
  return `${pad(t.getUTCDate())}.${pad(t.getUTCMonth() + 1)}.${t.getUTCFullYear()}`;
}

// datetime-local input uchun default qiymat (Tashkent, hozir)
export function nowLocalInput(): string {
  const t = tashkentNow();
  return (
    `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}` +
    `T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`
  );
}
