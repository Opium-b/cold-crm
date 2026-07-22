import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// -----------------------------------------------------------------------------
// Oddiy autentifikatsiya: bitta umumiy parol (.env APP_PASSWORD).
// Muvaffaqiyatli kirishda imzolangan (HMAC) cookie o'rnatiladi.
// Bu ichki vosita bo'lgani uchun murakkab auth kerak emas.
// -----------------------------------------------------------------------------

export const COOKIE_NAME = "crm_session";

function secret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

// Cookie qiymati - APP_PASSWORD ustidan HMAC. Uni to'g'ri parolsiz yasab
// bo'lmaydi, demak soxta cookie o'tmaydi.
export function expectedToken(): string {
  const pw = process.env.APP_PASSWORD || "";
  return crypto.createHmac("sha256", secret()).update("crm-auth:" + pw).digest("hex");
}

export function checkPassword(input: string): boolean {
  const pw = process.env.APP_PASSWORD || "";
  if (!pw) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Server Component/Route ichida: kirmagan bo'lsa /login ga yo'naltiradi.
export async function requireAuth(): Promise<void> {
  const store = await cookies();
  const val = store.get(COOKIE_NAME)?.value;
  if (val !== expectedToken()) redirect("/login");
}

// API route'lar uchun: true/false qaytaradi (redirect qilmaydi).
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === expectedToken();
}
