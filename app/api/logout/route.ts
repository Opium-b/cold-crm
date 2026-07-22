import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  // Nisbiy Location — proksi/tunnel ortida ham to'g'ri ishlashi uchun.
  const res = new NextResponse(null, { status: 303, headers: { Location: "/login" } });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
