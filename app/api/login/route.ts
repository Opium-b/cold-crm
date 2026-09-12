import { NextRequest, NextResponse } from "next/server";
import { checkPassword, expectedToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: "Server authentication is not configured: SESSION_SECRET is missing" },
      { status: 503 }
    );
  }
  const form = await req.formData();
  const password = String(form.get("password") || "");

  // Nisbiy (relative) Location ishlatamiz — cloudflared/proksi ortida ham
  // to'g'ri domenga yo'naltirish uchun (absolute URL localhost'ga ketib qolardi).
  if (!checkPassword(password)) {
    return new NextResponse(null, { status: 303, headers: { Location: "/login?error=1" } });
  }

  const res = new NextResponse(null, { status: 303, headers: { Location: "/" } });
  res.cookies.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 kun
  });
  return res;
}
