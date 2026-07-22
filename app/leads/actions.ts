"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { utcNow, tashkentLocalToUtc } from "@/lib/time";
import { isAuthed } from "@/lib/auth";
import { Group, LeadStatus } from "@/lib/types";

async function guard() {
  if (!(await isAuthed())) throw new Error("Avtorizatsiya kerak");
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s || null;
}

export async function createLead(fd: FormData) {
  await guard();
  const name = str(fd, "name");
  const phone = normalizePhone(str(fd, "phone") || "");
  if (!name) throw new Error("Do'kon nomi majburiy");
  if (!phone) throw new Error("Telefon raqami noto'g'ri yoki kiritilmagan");

  const group = (str(fd, "group") || "C") as Group;
  const ratingRaw = str(fd, "rating");
  const reviewsRaw = str(fd, "reviews_count");

  try {
    const info = db
      .prepare(
        `INSERT INTO leads (name, phone, phone2, address, "group", rating, reviews_count, work_hours, info, instagram)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        phone,
        normalizePhone(str(fd, "phone2") || ""),
        str(fd, "address"),
        group,
        ratingRaw ? Number(ratingRaw) : null,
        reviewsRaw ? Number(reviewsRaw) : null,
        str(fd, "work_hours"),
        str(fd, "info"),
        str(fd, "instagram")
      );
    revalidatePath("/leads");
    redirect(`/leads/${info.lastInsertRowid}`);
  } catch (e) {
    const msg = String((e as Error).message);
    if (msg.includes("UNIQUE")) throw new Error("Bu telefon raqamli lid allaqachon mavjud");
    throw e;
  }
}

export async function updateLead(id: number, fd: FormData) {
  await guard();
  const name = str(fd, "name");
  const phone = normalizePhone(str(fd, "phone") || "");
  if (!name) throw new Error("Do'kon nomi majburiy");
  if (!phone) throw new Error("Telefon raqami noto'g'ri");

  const ratingRaw = str(fd, "rating");
  const reviewsRaw = str(fd, "reviews_count");
  try {
    db.prepare(
      `UPDATE leads SET name=?, phone=?, phone2=?, address=?, "group"=?, rating=?,
         reviews_count=?, work_hours=?, info=?, instagram=?, updated_at=? WHERE id=?`
    ).run(
      name,
      phone,
      normalizePhone(str(fd, "phone2") || ""),
      str(fd, "address"),
      (str(fd, "group") || "C") as Group,
      ratingRaw ? Number(ratingRaw) : null,
      reviewsRaw ? Number(reviewsRaw) : null,
      str(fd, "work_hours"),
      str(fd, "info"),
      str(fd, "instagram"),
      utcNow(),
      id
    );
  } catch (e) {
    const msg = String((e as Error).message);
    if (msg.includes("UNIQUE")) throw new Error("Bu telefon raqami boshqa lidda mavjud");
    throw e;
  }
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function changeStatus(id: number, fd: FormData) {
  await guard();
  const status = str(fd, "status") as LeadStatus | null;
  if (!status) return;
  db.prepare("UPDATE leads SET status=?, updated_at=? WHERE id=?").run(status, utcNow(), id);
  revalidatePath(`/leads/${id}`);
}

export async function addReminder(id: number, fd: FormData) {
  await guard();
  const local = str(fd, "remind_at");
  const type = str(fd, "type") || "QAYTA_QONGIROQ";
  if (!local) throw new Error("Vaqt kiritilmagan");
  db.prepare(
    `INSERT INTO reminders (lead_id, remind_at, type, sent) VALUES (?, ?, ?, 0)`
  ).run(id, tashkentLocalToUtc(local), type);
  revalidatePath(`/leads/${id}`);
}
