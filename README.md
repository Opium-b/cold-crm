# Cold CRM — Cold Call ichki CRM tizimi

2 kishilik jamoa uchun sovuq qo'ng'iroq (cold call) qilishga mo'ljallangan ichki
mini-CRM. Sotuvchi bitta ekrandan navbat bo'yicha qo'ng'iroq qiladi, texnik
sherik esa Telegram orqali natijalarni kuzatadi. Interfeys to'liq o'zbek tilida.

## Texnologiyalar

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **SQLite** — Node ichiga o'rnatilgan `node:sqlite` (tashqi kutubxonasiz, bitta fayl)
- **Telegram Bot API** — oddiy `fetch` orqali
- **xlsx (SheetJS)** — Excel/CSV import uchun
- Autentifikatsiya — bitta umumiy parol + imzolangan cookie

## 1. O'rnatish

Node.js 22+ kerak (loyiha Node 26 da sinovdan o'tgan).

```bash
cd cold-crm
npm install
```

## 2. Sozlash (.env.local)

`.env.example` dan nusxa oling va qiymatlarni to'ldiring:

```bash
cp .env.example .env.local
```

| O'zgaruvchi           | Tavsif                                                             |
| --------------------- | ------------------------------------------------------------------ |
| `APP_PASSWORD`        | Tizimga kirish paroli (jamoa uchun umumiy)                         |
| `SESSION_SECRET`      | Cookie imzosi uchun uzun tasodifiy satr                            |
| `TELEGRAM_BOT_TOKEN`  | @BotFather bergan token (ixtiyoriy — bo'sh bo'lsa xabar yuborilmaydi) |
| `TELEGRAM_CHAT_ID`    | Jamoa guruhi chat ID si (manfiy son bo'lishi mumkin)              |
| `DATABASE_PATH`       | DB fayli yo'li (default `./data/crm.db`)                          |
| `CRON_SECRET`         | `/api/cron/reminders` uchun Bearer token                          |
| `DISABLE_INTERNAL_CRON` | `1` bo'lsa ichki scheduler o'chadi (serverless muhitda kerak)   |

> **Muhim:** `.env.local` ni o'zgartirgandan keyin `next build` ni qayta ishga
> tushiring — middleware `APP_PASSWORD` va `SESSION_SECRET` ni build vaqtida oladi.

## 3. Telegram bot yaratish

1. Telegramda **@BotFather** ga yozing → `/newbot` → nom bering → **token** oling.
2. Jamoa **guruhini** oching va botni guruhga qo'shing.
3. Guruhga biror xabar yozing, so'ng brauzerda oching:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   Javobdan `chat.id` ni oling (guruh ID odatda manfiy, masalan `-100123456789`).
4. `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` ni `.env.local` ga yozing.

## 4. Ishga tushirish

**Ishlab chiqish (dev) rejimi:**

```bash
npm run seed     # test uchun 5 ta namunaviy lid (bir marta)
npm run dev      # http://localhost:3000
```

**Production rejimi:**

```bash
npm run build
npm start        # http://localhost:3000 (PORT bilan o'zgartirsa bo'ladi)
```

Kirish paroli — `.env.local` dagi `APP_PASSWORD`.

## 5. Sahifalar

- **/login** — parol bilan kirish
- **/** — boshqaruv paneli: bugungi statistika, konversiya voronkasi, yaqin uchrashuvlar
- **/call** — asosiy qo'ng'iroq rejimi: bitta lid kartochkasi + natija tugmalari
- **/leads** — barcha lidlar, filtr va qidiruv, yangi lid qo'shish
- **/leads/[id]** — lid tafsilotlari, tahrirlash, tarix, eslatmalar
- **/import** — Excel/CSV import (ustunlarni moslashtirish + preview)
- **/meetings** — uchrashuvlar ro'yxati va boshqaruvi

## 6. Qo'ng'iroq navbati mantig'i

1. Vaqti kelgan qayta harakatlar (`next_action_at <= hozir`) — eng eskisidan.
2. Yangi lidlar — **A** guruh birinchi, keyin B, C, D.

Natija tugmalari avtomatik keyingi qadamni belgilaydi:

- **Ko'tarmadi** → ertaga qayta (3 marta ketma-ket bo'lsa — 7 kundan keyin)
- **Keyinroq** → tanlangan vaqtga eslatma
- **Qiziqdi** → ertaga follow-up + Telegram xabar
- **Uchrashuv** → uchrashuv + 2 ta eslatma (1 kun va 2 soat oldin) + Telegram
- **Rad etdi** → sabab bilan; 90 kundan keyin avtomatik navbatga qaytadi
- **Sotildi!** → Telegram bayram xabari
- **Noto'g'ri raqam** → navbatdan chiqadi

## 7. Excel/CSV import formati

Fayl birinchi qatori — **sarlavhalar** bo'lishi kerak. Tizim ustunlarni nom
bo'yicha avtomatik taxmin qiladi, keyin qo'lda to'g'rilash mumkin. Tavsiya
etilgan ustunlar:

`Do'kon nomi`, `Telefon`, `Guruh`, `Manzil`, `Reyting`, `Sharhlar soni`,
`Ish vaqti`, `Qisqacha ma'lumot`, `Instagram`

- **Telefon** avtomatik `+998...` formatga keltiriladi.
- Bitta katakda ikkita raqam bo'lsa (`/`, `,` bilan ajratilgan) — birinchisi
  asosiy, ikkinchisi qo'shimcha raqam bo'ladi.
- **Dublikat** (telefon bo'yicha mavjud) va **telefonsiz** qatorlar o'tkazib
  yuboriladi; import oxirida hisobot ko'rsatiladi.

## 8. Eslatmalar (reminder) mexanizmi

Ikki usul birga ishlaydi:

1. **Ichki scheduler** — server ishga tushganda har 60 soniyada vaqti kelgan
   eslatmalarni yuboradi (lokal/VPS uchun; `instrumentation.ts`).
2. **API route** — `GET /api/cron/reminders` ni tashqi cron bilan chaqirish
   mumkin. `Authorization: Bearer <CRON_SECRET>` header'i talab qilinadi.

> Serverless muhitda (masalan Vercel) ichki scheduler ishlamaydi —
> `DISABLE_INTERNAL_CRON=1` qo'yib, cron route'ni tashqi cron bilan chaqiring.

## 9. Ishga tushirish / tarmoqqa ochish

### Eng oson (tavsiya etilgan): bitta WiFi tarmoq

Bitta buyruq — build qiladi va serverni LAN'da ishga tushiradi. Shu WiFi'dagi
barcha qurilmalar (kompyuter, telefon) ochib ishlata oladi:

```bash
bash start.sh            # oddiy
bash start.sh --build    # .env.local (parol) o'zgargan bo'lsa
```

Ekranda ikki manzil chiqadi:

- **Bu kompyuterda:** `http://localhost:3000`
- **Telefon/boshqa qurilma:** `http://<LAN-IP>:3000` (masalan `http://192.168.1.8:3000`)

> **Muhim:** telefonda albatta **`http://`** bilan yozing (`https` EMAS).
> `localhost` ni telefonda ishlatmang — u telefonning o'zini bildiradi.
> Ikkala qurilma **bir xil WiFi**da bo'lishi shart.

Kirish paroli — `.env.local` dagi `APP_PASSWORD`. To'xtatish: `Ctrl+C`.
Baza kompyuterda (`data/crm.db`) saqlanadi; eslatma scheduleri ham ishlaydi.

### Internetdan (boshqa joydan) ochish kerak bo'lsa

Sherik boshqa tarmoqda bo'lsa, cloudflared tunnel yoki VPS kerak bo'ladi:

```bash
cloudflared tunnel --url http://localhost:3000   # vaqtinchalik ommaviy URL
```

### Har doim yoniq (always-on): VPS

```bash
npm run build
pm2 start "npm start" --name cold-crm
```

SQLite uchun alohida DB server kerak emas.

> **Muhim:** Netlify/Vercel/Render (bepul) bu ilova uchun MOS EMAS —
> serverless fayl tizimi vaqtinchalik (SQLite baza o'chib ketadi) va doimiy
> jarayon yo'q (eslatma scheduleri ishlamaydi).

## Barcha vaqtlar

Interfeys va eslatmalar **Asia/Tashkent (UTC+5)** vaqtida ishlaydi. Bazada
vaqtlar UTC da saqlanadi, ko'rsatishda Tashkent vaqtiga aylantiriladi.
