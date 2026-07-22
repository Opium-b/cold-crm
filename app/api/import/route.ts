import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone, splitPhones } from "@/lib/phone";
import { Group } from "@/lib/types";

interface IncomingRow {
  name?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  group?: string;
  rating?: string;
  reviews_count?: string;
  work_hours?: string;
  info?: string;
  instagram?: string;
}

function normGroup(v: string | undefined): Group {
  const g = (v || "").trim().toUpperCase();
  return g === "A" || g === "B" || g === "C" || g === "D" ? (g as Group) : "C";
}

function num(v: string | undefined): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = await req.json();
  const rows: IncomingRow[] = Array.isArray(body.rows) ? body.rows : [];

  let added = 0;
  let duplicates = 0;
  let noPhone = 0;
  const dupList: string[] = [];

  const insert = db.prepare(
    `INSERT INTO leads (name, phone, phone2, address, "group", rating, reviews_count, work_hours, info, instagram)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const exists = db.prepare("SELECT 1 FROM leads WHERE phone = ?");

  for (const r of rows) {
    // Telefon: bitta katakda 2 raqam bo'lishi mumkin
    const split = splitPhones(r.phone);
    let phone = split.phone;
    let phone2 = split.phone2 ?? normalizePhone(r.phone2);
    if (!phone) {
      noPhone++;
      continue;
    }
    if (exists.get(phone)) {
      duplicates++;
      if (dupList.length < 20) dupList.push(phone);
      continue;
    }
    const name = (r.name || "").trim() || "(nomsiz)";
    try {
      insert.run(
        name,
        phone,
        phone2,
        (r.address || "").trim() || null,
        normGroup(r.group),
        num(r.rating),
        num(r.reviews_count) != null ? Math.round(num(r.reviews_count)!) : null,
        (r.work_hours || "").trim() || null,
        (r.info || "").trim() || null,
        (r.instagram || "").trim() || null
      );
      added++;
    } catch (e) {
      // UNIQUE poyga holati yoki boshqa xato — dublikat sifatida sanaymiz
      duplicates++;
    }
  }

  return NextResponse.json({ added, duplicates, noPhone, total: rows.length, dupList });
}
