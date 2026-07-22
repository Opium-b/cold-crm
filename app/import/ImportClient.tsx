"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

// Bizning maydonlar va ular uchun avtomatik taxmin qilinadigan kalit so'zlar
const FIELDS: { key: string; label: string; keywords: string[] }[] = [
  { key: "name", label: "Do'kon nomi", keywords: ["nom", "name", "dokon", "магазин", "назван", "заведен"] },
  { key: "phone", label: "Telefon", keywords: ["tel", "phone", "raqam", "тел", "номер"] },
  { key: "phone2", label: "Qo'shimcha telefon", keywords: ["phone2", "qoshimcha", "доп"] },
  { key: "group", label: "Guruh", keywords: ["guruh", "group", "группа"] },
  { key: "address", label: "Manzil", keywords: ["manzil", "address", "адрес", "hudud"] },
  { key: "rating", label: "Reyting", keywords: ["reyting", "rating", "рейтинг", "ball", "★"] },
  { key: "reviews_count", label: "Sharhlar soni", keywords: ["sharh", "review", "отзыв", "izoh soni"] },
  { key: "work_hours", label: "Ish vaqti", keywords: ["ish vaqti", "work", "часы", "время", "grafik"] },
  { key: "info", label: "Qisqacha ma'lumot", keywords: ["malumot", "ma'lumot", "info", "izoh", "коммент", "описан", "note"] },
  { key: "instagram", label: "Instagram", keywords: ["instagram", "telegram", "инстаграм", " ig ", "soc"] },
];

function guess(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const norm = headers.map((h) => (h || "").toString().toLowerCase().replace(/[''`]/g, ""));
  for (const f of FIELDS) {
    let idx = -1;
    for (let i = 0; i < norm.length; i++) {
      if (f.keywords.some((k) => norm[i].includes(k.trim()))) {
        idx = i;
        break;
      }
    }
    map[f.key] = idx;
  }
  return map;
}

type Report = { added: number; duplicates: number; noPhone: number; total: number };

export function ImportClient() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<string, number>>({});
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  async function handleFile(file: File) {
    setError("");
    setReport(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        raw: false,
        defval: "",
      }) as string[][];
      if (aoa.length < 2) {
        setError("Faylda ma'lumot yo'q yoki faqat sarlavha bor.");
        return;
      }
      const hdr = aoa[0].map((x) => String(x ?? ""));
      const data = aoa.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
      setHeaders(hdr);
      setRows(data);
      setMap(guess(hdr));
      setFileName(file.name);
    } catch (e) {
      setError("Faylni o'qishda xatolik: " + String((e as Error).message));
    }
  }

  function cell(row: string[], key: string): string {
    const idx = map[key];
    if (idx == null || idx < 0) return "";
    return String(row[idx] ?? "").trim();
  }

  async function doImport() {
    if (map["phone"] == null || map["phone"] < 0) {
      setError("Telefon ustunini tanlang.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = rows.map((r) => {
        const o: Record<string, string> = {};
        for (const f of FIELDS) o[f.key] = cell(r, f.key);
        return o;
      });
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Import xatosi");
        return;
      }
      setReport(j);
    } finally {
      setBusy(false);
    }
  }

  const preview = rows.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Yuklash zonasi */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${
          drag ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-white"
        }`}
      >
        <div className="text-3xl">📄</div>
        <p className="mt-2 font-medium text-slate-700">
          {fileName || "Faylni bu yerga tashlang yoki tanlang"}
        </p>
        <p className="text-sm text-slate-400">.xlsx yoki .csv</p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {report && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <h3 className="font-semibold text-green-800">Import yakunlandi ✓</h3>
          <p className="mt-1 text-sm text-green-700">
            {report.added} ta qo&apos;shildi, {report.duplicates} ta dublikat o&apos;tkazildi,{" "}
            {report.noPhone} ta telefonsiz o&apos;tkazildi ({report.total} qatordan).
          </p>
          <a href="/leads" className="mt-3 inline-block text-sm font-medium text-green-800 underline">
            Lidlarga o&apos;tish →
          </a>
        </div>
      )}

      {/* Ustunlarni moslashtirish */}
      {headers.length > 0 && !report && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Ustunlarni moslashtirish</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm">
                  <span className="w-32 shrink-0 text-slate-600">
                    {f.label}
                    {f.key === "name" || f.key === "phone" ? " *" : ""}
                  </span>
                  <select
                    value={map[f.key] ?? -1}
                    onChange={(e) => setMap({ ...map, [f.key]: Number(e.target.value) })}
                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5"
                  >
                    <option value={-1}>— yo&apos;q —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Ustun ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>

          {/* Preview */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">
              Ko&apos;rib chiqish (birinchi {preview.length} qator, jami {rows.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5">Nom</th>
                    <th className="px-2 py-1.5">Telefon</th>
                    <th className="px-2 py-1.5">Guruh</th>
                    <th className="px-2 py-1.5">Manzil</th>
                    <th className="px-2 py-1.5">Reyting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">{cell(r, "name")}</td>
                      <td className="px-2 py-1.5">{cell(r, "phone")}</td>
                      <td className="px-2 py-1.5">{cell(r, "group")}</td>
                      <td className="px-2 py-1.5">{cell(r, "address")}</td>
                      <td className="px-2 py-1.5">{cell(r, "rating")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <button
            onClick={doImport}
            disabled={busy}
            className="btn w-full bg-slate-900 py-3 text-white hover:bg-slate-800"
          >
            {busy ? "Import qilinmoqda..." : `${rows.length} ta qatorni import qilish`}
          </button>
        </>
      )}
    </div>
  );
}
