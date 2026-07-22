import { Lead } from "@/lib/types";

// Yangi lid va tahrirlash formalarida ishlatiladigan umumiy maydonlar.
export function LeadFields({ lead }: { lead?: Lead }) {
  const groups = ["A", "B", "C", "D"];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Do'kon nomi *" full>
        <input name="name" required defaultValue={lead?.name || ""} className={input} />
      </Field>
      <Field label="Telefon *">
        <input name="phone" required defaultValue={lead?.phone || ""} placeholder="+998..." className={input} />
      </Field>
      <Field label="Qo'shimcha telefon">
        <input name="phone2" defaultValue={lead?.phone2 || ""} className={input} />
      </Field>
      <Field label="Guruh">
        <select name="group" defaultValue={lead?.group || "C"} className={input}>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Reyting">
        <input name="rating" type="number" step="0.1" defaultValue={lead?.rating ?? ""} className={input} />
      </Field>
      <Field label="Sharhlar soni">
        <input name="reviews_count" type="number" defaultValue={lead?.reviews_count ?? ""} className={input} />
      </Field>
      <Field label="Ish vaqti">
        <input name="work_hours" defaultValue={lead?.work_hours || ""} className={input} />
      </Field>
      <Field label="Manzil" full>
        <input name="address" defaultValue={lead?.address || ""} className={input} />
      </Field>
      <Field label="Instagram" full>
        <input name="instagram" defaultValue={lead?.instagram || ""} className={input} />
      </Field>
      <Field label="Qisqacha ma'lumot" full>
        <textarea name="info" defaultValue={lead?.info || ""} rows={2} className={input} />
      </Field>
    </div>
  );
}

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
