// Test uchun 5 ta namunaviy lid qo'shadi.
// Ishga tushirish:  npm run seed
// db.ts import qilinganda jadval sxemasi avtomatik yaratiladi (migrate).
import { db } from "../lib/db.ts";

const leads: [string, string, string, string, number, number, string, string, string][] = [
  // name, phone, group, address, rating, reviews, work_hours, info, instagram
  ["Guli Style ayollar kiyimi", "PHONE_REDACTED_001", "A", "Chilonzor 9-kvartal", 4.2, 34, "09:00-20:00", "Sayti yo'q, faqat Instagram orqali sotadi", "@guli_style"],
  ["Baraka Mebel", "PHONE_REDACTED_002", "B", "Sergeli, Yangi bozor", 4.6, 120, "10:00-19:00", "Kichik sayti bor, lekin eskirgan", "@baraka_mebel"],
  ["Oro Zargarlik", "PHONE_REDACTED_003", "A", "Yunusobod 5-mavze", 4.8, 58, "11:00-21:00", "Faqat Telegram kanal, katalog yo'q", "@oro_gold"],
  ["Fresh Market", "PHONE_REDACTED_004", "C", "Mirzo Ulug'bek tumani", 3.9, 15, "08:00-23:00", "Do'kon kichik, reklamaga qiziqishi mumkin", ""],
  ["Zamin Qurilish", "PHONE_REDACTED_005", "B", "Olmazor, Qatortol ko'chasi", 4.1, 27, "09:00-18:00", "Qurilish mollari, ulgurji", "@zamin_qurilish"],
];

const insert = db.prepare(
  `INSERT OR IGNORE INTO leads (name, phone, "group", address, rating, reviews_count, work_hours, info, instagram)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

let added = 0;
for (const l of leads) {
  const info = insert.run(l[0], l[1], l[2], l[3], l[4], l[5], l[6], l[7], l[8] || null);
  if (info.changes) added++;
}

console.log(`Seed tugadi: ${added} ta yangi lid qo'shildi (jami ${leads.length} dan).`);
