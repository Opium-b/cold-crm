"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { tashkentLocalToUtc } from "@/lib/time";

async function guard() {
  if (!(await isAuthed())) throw new Error("Avtorizatsiya kerak");
}

export async function setMeetingStatus(id: number, status: "OTKAZILDI" | "BEKOR") {
  await guard();
  db.prepare("UPDATE meetings SET status=? WHERE id=?").run(status, id);
  revalidatePath("/meetings");
}

export async function rescheduleMeeting(id: number, fd: FormData) {
  await guard();
  const local = String(fd.get("meet_at") || "");
  if (!local) return;
  db.prepare("UPDATE meetings SET meet_at=?, status='REJALANGAN' WHERE id=?").run(
    tashkentLocalToUtc(local),
    id
  );
  revalidatePath("/meetings");
}
