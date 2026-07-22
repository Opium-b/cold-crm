// Cold-call suhbat skripti — /call sahifasida qo'ng'iroq paytida ko'rish uchun.
// Manba: cold_call_suhbat_daraxti.txt (soat do'konlari uchun sayt sotish).
// Har bosqich bosilganda ochiladi (native <details>, JS shart emas).

type Item =
  | { k: "say"; text: string }
  | { k: "tip"; text: string }
  | { k: "sub"; text: string }
  | { k: "branch"; client: string; say?: string; tip?: string }
  | { k: "check"; text: string }
  | { k: "text"; text: string };

type Stage = { id: string; title: string; items: Item[]; open?: boolean };

const STAGES: Stage[] = [
  {
    id: "0",
    title: "0. Qo'ng'iroqdan oldin (30 soniya)",
    items: [
      { k: "check", text: "Do'kon nomi va nima sotishini eslab oling" },
      { k: "check", text: "Google'da nomini qidiring: sayti/Instagrami bormi?" },
      { k: "check", text: "Bitta shaxsiy detal tayyorlang (\"77 ta sharhingiz bor ekan\")" },
      { k: "check", text: "Chuqur nafas, tabassum. Ovoz sekin va ishonchli." },
      { k: "tip", text: "Maqsad zanjiri: Qo'ng'iroq → Qiziqish → Og'riqni ochish → Keyingi qadam. Birinchi qo'ng'iroqda SOTISH emas, UCHRASHUV yoki TELEGRAM'ga portfolio olish maqsad. Narxni iloji boricha aytmang." },
    ],
  },
  {
    id: "1",
    title: "1. Salomlashuv va ruxsat (0–15 soniya)",
    open: true,
    items: [
      {
        k: "say",
        text: "Assalomu alaykum! [Do'kon nomi]mi? ... Juda yaxshi. Mening ismim Bilol, men veb-dasturchiman. Bezovta qilmadimmi, 1 daqiqa vaqtingiz bormi?",
      },
      { k: "tip", text: "\"1 daqiqa\" dedingiz — qisqa gapiring. Ruxsat so'rash mudofaani tushiradi." },
      { k: "branch", client: "\"Ha, eshitaman / ayting\"", say: "→ 2-bosqichga o'ting." },
      {
        k: "branch",
        client: "\"Hozir bandman\"",
        say: "Tushunarli, xalaqit bermayman. Qachon qulayroq — bugun soat 5da qo'ng'iroq qilaymi yoki ertaga ertalab?",
        tip: "Aniq vaqt kelishing va O'SHA vaqtda qo'ng'iroq qiling. Natijaga \"Keyinroq\" belgilang.",
      },
      {
        k: "branch",
        client: "\"Egasi yo'q, men sotuvchiman\"",
        say: "Aha, tushunarli. Do'kon rivoji bo'yicha taklif bilan qo'ng'iroq qilyapman — bunday masalani egasi hal qiladimi? Ismi kim, qachon bo'ladi, qanday bog'lansam bo'ladi?",
        tip: "Sotuvchiga pitch qilmang. Egasining ismi + qulay vaqtini oling.",
      },
      {
        k: "branch",
        client: "\"Reklamami? Kerak emas\" (darhol)",
        say: "Yo'q-yo'q, tayyor reklama sotmayapman. Men Toshkentdagi soat do'konlari uchun ishlaydigan dasturchiman, do'koningizni Google xaritada ko'rib qo'ng'iroq qildim. Faqat bitta savol: mijozlaringiz sizni internetdan qidirsa topa oladimi?",
        tip: "Savol bilan tugating — trubka qo'yishga xalaqit beradi.",
      },
    ],
  },
  {
    id: "2",
    title: "2. Qiziqish ilgagi — Hook (15–40 soniya)",
    items: [
      {
        k: "say",
        text: "Rahmat. Gap bundoq: do'koningizni Google xaritadan topdim, [sharhlaringiz zo'r ekan]. Lekin tekshirib ko'rdim: odam Google'da 'Toshkentda original soat' deb qidirsa, siz chiqmaysiz — boshqalar chiqadi. Ya'ni sotib olishga TAYYOR mijoz sizga emas, raqobatchiga ketyapti. Men aynan shu muammoni hal qilaman.",
      },
      { k: "tip", text: "Shu yerda TO'XTANG. Pauza qiling. Mijoz gapirsin." },
      { k: "branch", client: "\"Qiziq, davom eting / qanday qilib?\"", say: "→ 3-bosqichga (savollar). Darhol yechim aytmang!" },
      {
        k: "branch",
        client: "\"Bizga mijoz yetarli\"",
        say: "Zo'r-ku, demak mahsulotingiz kuchli! Bitta savol: hozirgi mijozlar asosan qanday kelishadi — tanish-bilishmi, Instagram'danmi? ... Tasavvur qiling, shu oqimga Google'dan har oy 5–10 mijoz qo'shilsa? Ular allaqachon 'soat sotib olmoqchi' bo'lganlar.",
      },
      {
        k: "branch",
        client: "\"Bizda Instagram bor\"",
        say: "Instagram albatta kerak, yopish demayapman. Farqni ayting-chi: Instagram'da sizni obunachi ko'radi; Google'da esa bugun SOTIB OLMOQCHI bo'lgan qidiruvchi topadi. Ular bir-birini to'ldiradi. Yana: Instagram bloklansa mehnat kuyadi, sayt esa sizning mulkingiz.",
      },
      {
        k: "branch",
        client: "\"Sayt qimmat-ku\" (narxni so'ramay)",
        say: "Hali narx aytganim yo'q-ku :) Avval foydasi bo'ladimi-yo'qmi aniqlaylik. 2 ta savolga javob bering, keyin o'zingiz hal qilasiz. → 3-bosqich.",
      },
      {
        k: "branch",
        client: "\"Kerak emas\" (qat'iy)",
        say: "Xo'p, majburlamayman, rahmat. Faqat raqamimni saqlab qo'ying — Bilol, veb-dasturchi, soat do'konlari uchun sayt qilaman. Kimgadir kerak bo'lsa tavsiya qilarsiz. Barakali savdo!",
        tip: "Natijaga \"Rad → 3 oydan keyin qayta\" belgilang.",
      },
    ],
  },
  {
    id: "3",
    title: "3. Og'riqni ochadigan savollar (40–90 soniya)",
    items: [
      { k: "tip", text: "Eng muhim bosqich. SIZ EMAS, MIJOZ gapirsin." },
      { k: "sub", text: "Savol 1: \"Yangi mijozlar sizni asosan qanday topishadi?\"" },
      { k: "branch", client: "\"Tanish-bilish\"", say: "Demak ishonch bor. Lekin tanish-bilish sekin o'sadi — yangi avlod telefonidan qidiradi." },
      { k: "branch", client: "\"Instagram'dan\"", say: "Kuniga nechta yozadi? Har biriga narx/manzilni alohida yozasizmi? Sayt bo'lsa mijoz o'zi ko'rib, faqat 'olaman' deydi." },
      { k: "branch", client: "\"O'tkinchilar, bozor joyi\"", say: "Joy zo'r. Lekin do'kon yopiq paytda-chi? Sayt — 24 soat ishlaydigan sotuvchingiz." },
      { k: "sub", text: "Savol 2: \"O'zingizni Google'da qidirib ko'rganmisiz?\"" },
      { k: "branch", client: "\"Yo'q\"", say: "Hozir telefonda 10 soniyada tekshiring, kutaman.", tip: "Eng kuchli usul — mijoz muammoni O'Z KO'ZI bilan ko'radi." },
      { k: "branch", client: "\"Xaritada chiqamiz\"", say: "To'g'ri, shuning uchun men topdim. Lekin xaritada faqat manzil-telefon; narx, model, kafolat ko'rinmaydi. Ko'rmagach ishonmaydi, ishonmagach bormaydi. Sayt shu bo'shliqni yopadi." },
      { k: "sub", text: "Savol 3 (yakuniy): \"Oyiga Google orqali qo'shimcha 5–6 xaridor kelsa, qancha savdo bo'lardi?\"" },
      { k: "tip", text: "Mijoz o'zi hisoblasin. U aytgan raqam — sizning eng kuchli argumentingiz." },
      { k: "say", text: "Mana, oyiga [uning raqami] qo'shimcha. Sayt esa BIR MARTA qilinadi — o'zini birinchi oyda qoplaydi." },
    ],
  },
  {
    id: "4",
    title: "4. Taklif — Pitch (90–120 soniya)",
    items: [
      {
        k: "say",
        text: "Taklifim: sizga soat do'koni uchun maxsus sayt qilaman. Unda soatlar katalogi rasm va narx bilan, 'Buyurtma' tugmasi to'g'ridan-to'g'ri Telegram'ingizga olib boradi, manzil-xarita, va Google'da 'Toshkentda soat' deb qidirganlarga chiqadi. Sizdan faqat suratlar kerak, qolganini o'zim qilaman. Telefon va kompyuterda chiroyli ochiladi.",
      },
      { k: "tip", text: "Texnik so'zlarni ishlatmang (hosting, SEO, responsive demang). Faqat NATIJA tilida gapiring." },
      {
        k: "branch",
        client: "\"Necha pul bo'ladi?\" (yaxshi belgi!)",
        say: "Narx sayt hajmiga bog'liq. Taklifim: Telegram'ga tayyor namunamni tashlayman, ko'rasiz, keyin aniq narxni aytaman. Yoki 15 daqiqaga o'zim kirib laptopda ko'rsataman — ertaga 12dami, 4dami?",
        tip: "Qattiq tursa: diapazon ayting ([X]–[Y]), aniq raqam emas.",
      },
      {
        k: "branch",
        client: "\"Namunangiz bormi?\"",
        say: "Bor albatta. Telegram shu raqammi? Hoziroq portfolio va namuna tashlayman. Ertaga soat [X]da qo'ng'iroq qilib fikringizni so'rayman — kelishdikmi?",
        tip: "ANIQ follow-up vaqti kelishing.",
      },
      {
        k: "branch",
        client: "\"O'ylab ko'raman\"",
        say: "Normal. Bitta savol: nima ko'proq o'ylantiryapti — narximi, kerakligiga ishonchsizlikmi, yoki kim bilandir maslahatlashishmi?",
        tip: "\"Narx\" → namunani ko'ring, aniq narx beraman. \"Sherigim bilan\" → ikkalangizga birga ko'rsataman.",
      },
      {
        k: "branch",
        client: "\"Tanishim qilib beradi\"",
        say: "Qilsin! Faqat tajribam: 'tanish qiladi' saytlar ko'pincha 6 oy boshlanmay turadi. Men muddat bilan ishlayman — [X] kunda tayyor. Qilmasa raqamim sizda qolsin.",
      },
      {
        k: "branch",
        client: "\"Bunaqa qo'ng'iroqlar aldamchi\"",
        say: "To'g'ri, sifatsizlari bor. Shuning uchun oldindan pul so'ramayman: avval namuna, keyin shartnoma, ish bosqichma-bosqich. Xohlasangiz to'lovni sayt tayyor bo'lgach qilasiz. Men Toshkentdaman, istalgan payt jonli uchrashamiz.",
      },
    ],
  },
  {
    id: "5",
    title: "5. Yopish — keyingi qadamni qotirish",
    items: [
      { k: "tip", text: "Suhbat ANIQ KELISHUV bilan tugasin. Kuchlilik tartibida:" },
      { k: "say", text: "1) UCHRASHUV: Ertaga soat 12da do'koningizga kirib o'taman, 15 daqiqa. Kelishdikmi? Ismingiz kim edi? Rahmat [ism] aka!" },
      { k: "say", text: "2) TELEGRAM + FOLLOW-UP: Hozir namuna tashlayman, ertaga soat 5da qo'ng'iroq qilib fikringizni so'rayman. Kelishdikmi?" },
      { k: "say", text: "3) QAYTA QO'NG'IROQ: [Kun] soat [X]da qo'ng'iroq qilaman. Yozib qo'ydim. Yaxshi qoling!" },
      { k: "tip", text: "TAQIQLANGAN: \"O'zingiz qo'ng'iroq qilarsiz\", \"Vaqtingiz bo'lganda ko'rarsiz\" — bular hech qachon bo'lmaydi." },
    ],
  },
  {
    id: "6",
    title: "6. Qo'ng'iroqdan keyin (jarayon)",
    items: [
      { k: "check", text: "Natijani darhol CRM'ga belgilang" },
      { k: "check", text: "Va'da qilingan namunani DARHOL yuboring (kechiksangiz ishonch ketadi)" },
      { k: "text", text: "Telegram shablon: \"Assalomu alaykum [ism] aka! Bilolman, hozir gaplashdik. Mana namuna: [link], avvalgi ishlarim: [link]. Ertaga soat [X]da qo'ng'iroq qilaman. Savol bo'lsa yozavering!\"" },
      { k: "sub", text: "Follow-up taqvimi (har qiziqqan lid uchun)" },
      { k: "text", text: "1-kun: material yuborildi · 2-kun: va'da qilingan qo'ng'iroq · 4-kun: \"Ko'rib ulgurdingizmi?\" · 7-kun: foydali maslahat · 14-kun: oxirgi taklif · keyin: 3 oydan so'ng yangi bahona bilan qayta." },
      { k: "sub", text: "Kunlik ritm" },
      { k: "text", text: "20 qo'ng'iroq/kun (~2 soat). Eng yaxshi vaqt: 11:00–13:00 va 16:00–18:00. Kutilma: 20 → ~12 ko'taradi → ~4 qiziqadi → 1–2 uchrashuv." },
    ],
  },
  {
    id: "7",
    title: "7. Uchrashuvda (qisqa reja)",
    items: [
      { k: "text", text: "1. 2 daq: samimiy suhbat (do'kon haqida, soxta bo'lmagan maqtov)" },
      { k: "text", text: "2. 5 daq: laptopda NAMUNA ko'rsatish" },
      { k: "text", text: "3. 3 daq: uning do'koni uchun birga tasavvur qilish" },
      { k: "text", text: "4. 3 daq: narx + 2 paket (oddiy/to'liq) — \"qaysi birini\", \"olaman/olmayman\" emas" },
      { k: "text", text: "5. 2 daq: keyingi qadam — suratlar + 30% oldindan, shartnoma" },
    ],
  },
];

function Line({ item }: { item: Item }) {
  switch (item.k) {
    case "say":
      return (
        <p className="rounded-lg border-l-4 border-green-400 bg-green-50 px-3 py-2 text-slate-800">
          {item.text}
        </p>
      );
    case "tip":
      return (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          💡 {item.text}
        </p>
      );
    case "sub":
      return <p className="pt-1 font-semibold text-slate-900">{item.text}</p>;
    case "check":
      return (
        <p className="flex gap-2 text-slate-700">
          <span className="text-slate-400">☐</span>
          <span>{item.text}</span>
        </p>
      );
    case "text":
      return <p className="text-slate-700">{item.text}</p>;
    case "branch":
      return (
        <div className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="text-[13px] font-medium text-slate-500">Mijoz: {item.client}</p>
          {item.say && <p className="mt-1 text-slate-800">Siz: {item.say}</p>}
          {item.tip && <p className="mt-1 text-[13px] text-amber-800">💡 {item.tip}</p>}
        </div>
      );
  }
}

export function CallScript() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-1 font-semibold text-slate-900">📋 Suhbat skripti</h3>
      <p className="mb-3 text-xs text-slate-400">
        Bosqichni bosib oching. Yashil — siz aytadigan gap, sariq — maslahat.
      </p>
      <div className="space-y-2">
        {STAGES.map((s) => (
          <details
            key={s.id}
            open={s.open}
            className="rounded-xl border border-slate-200 bg-slate-50/60 [&_summary]:list-none"
          >
            <summary className="cursor-pointer select-none rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">
              {s.title}
            </summary>
            <div className="space-y-2 px-3 pb-3 pt-1 text-sm">
              {s.items.map((item, i) => (
                <Line key={i} item={item} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
