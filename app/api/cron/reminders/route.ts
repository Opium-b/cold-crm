import { NextRequest, NextResponse } from "next/server";
import { processReminders } from "@/lib/reminders";

// Tashqi cron yoki qo'lda chaqirish uchun.
// Agar .env da CRON_SECRET bo'lsa, ?secret=... mos kelishi kerak.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await processReminders();
  return NextResponse.json({ ok: true, ...result });
}
