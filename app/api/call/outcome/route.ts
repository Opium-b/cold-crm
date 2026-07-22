import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { recordOutcome, callScreenData, OutcomePayload } from "@/lib/leads";
import { Outcome, RejectReason } from "@/lib/types";
import { tashkentLocalToUtc } from "@/lib/time";

const OUTCOMES: Outcome[] = [
  "KOTARMADI",
  "KEYINROQ",
  "QIZIQDI",
  "UCHRASHUV",
  "RAD",
  "SOTILDI",
  "NOTOGRI_RAQAM",
];

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "auth" }, { status: 401 });
  }
  const body = await req.json();
  const leadId = Number(body.leadId);
  const outcome = body.outcome as Outcome;

  if (!leadId || !OUTCOMES.includes(outcome)) {
    return NextResponse.json({ error: "Noto'g'ri ma'lumot" }, { status: 400 });
  }

  const payload: OutcomePayload = {
    outcome,
    note: typeof body.note === "string" ? body.note : undefined,
    durationHint: body.durationHint ?? null,
    rejectReason: (body.rejectReason as RejectReason) ?? null,
  };

  try {
    // Sana maydonlari mijozdan Tashkent local formatida keladi -> UTC ga
    if (outcome === "KEYINROQ") {
      if (body.nextAtUtc) payload.nextAt = String(body.nextAtUtc);
      else if (body.nextAtLocal) payload.nextAt = tashkentLocalToUtc(String(body.nextAtLocal));
    }
    if (outcome === "UCHRASHUV") {
      if (!body.meetAtLocal) {
        return NextResponse.json({ error: "Uchrashuv vaqti kerak" }, { status: 400 });
      }
      payload.meetAt = tashkentLocalToUtc(String(body.meetAtLocal));
      payload.location = typeof body.location === "string" ? body.location : null;
    }

    await recordOutcome(leadId, payload);
  } catch (e) {
    console.error("[outcome]", e);
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }

  // Natijadan keyin darhol keyingi lidni qaytaramiz (sahifa yangilanmaydi)
  const next = callScreenData(leadId);
  return NextResponse.json(next);
}
