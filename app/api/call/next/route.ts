import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { callScreenData } from "@/lib/leads";

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const ex = req.nextUrl.searchParams.get("exclude");
  const data = callScreenData(ex ? Number(ex) : undefined);
  return NextResponse.json(data);
}
