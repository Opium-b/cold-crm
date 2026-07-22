"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Boshqaruv" },
  { href: "/call", label: "Qo'ng'iroq" },
  { href: "/leads", label: "Lidlar" },
  { href: "/meetings", label: "Uchrashuvlar" },
  { href: "/import", label: "Import" },
];

export function NavBar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-2 py-2">
        <span className="mr-2 shrink-0 px-2 font-bold text-slate-900">📞 Cold CRM</span>
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <form action="/api/logout" method="post" className="ml-auto shrink-0">
          <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100">
            Chiqish
          </button>
        </form>
      </nav>
    </header>
  );
}
