// Telefon raqamini normallashtirish: faqat raqamlar qoldiriladi va
// O'zbekiston formatiga (+998XXXXXXXXX) keltiriladi.
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  // 998 bilan boshlansa - o'zi
  if (digits.startsWith("998")) {
    // ortiqcha raqamlarni kesamiz (masalan xatolik bilan qo'shilgan)
    digits = digits.slice(0, 12);
  } else if (digits.length === 9) {
    // 901234567 -> 998901234567
    digits = "998" + digits;
  } else if (digits.length === 10 && digits.startsWith("0")) {
    // 0901234567 -> 998901234567
    digits = "998" + digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("998")) {
    // allaqachon to'g'ri
  } else {
    // boshqa hollarda oldiga 998 qo'shib ko'ramiz, agar 9 xonali bo'lsa
    if (digits.length < 9) return null;
    if (!digits.startsWith("998")) digits = "998" + digits.slice(-9);
  }

  if (digits.length !== 12) return null;
  return "+" + digits;
}

// Bitta katakda ikkita raqam bo'lishi mumkin ("/" yoki "," bilan ajratilgan).
export function splitPhones(raw: string | null | undefined): {
  phone: string | null;
  phone2: string | null;
} {
  if (!raw) return { phone: null, phone2: null };
  const parts = String(raw)
    .split(/[\/,;]| yoki /i)
    .map((p) => normalizePhone(p))
    .filter((p): p is string => !!p);
  return { phone: parts[0] ?? null, phone2: parts[1] ?? null };
}

// Ko'rsatish uchun chiroyli format: +998 90 123 45 67
export function displayPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("998")) {
    return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  }
  return phone;
}
