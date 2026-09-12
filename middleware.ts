import { NextRequest, NextResponse } from "next/server";

// Edge runtime'da HMAC hisoblash (Web Crypto). lib/auth.ts dagi Node
// versiyasi bilan bir xil natija beradi.
async function expectedTokenEdge(): Promise<string> {
  const pw = process.env.APP_PASSWORD || "";
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be configured in production");
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("crm-auth:" + pw));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const COOKIE_NAME = "crm_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ochiq yo'llar: login, login API, cron (o'z sirlarini o'zi tekshiradi)
  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/api/login" ||
    pathname.startsWith("/api/login/") ||
    pathname === "/api/cron/reminders"
  ) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Server authentication is not configured" },
        { status: 503 }
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token && token === (await expectedTokenEdge())) {
    return NextResponse.next();
  }

  // Kirmagan: sahifa bo'lsa /login ga, API bo'lsa 401
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }
  // req.url mijoz kiritgan host'ni beradi (LAN'da 192.168.x.x:3000) — shu
  // asosda absolute URL quramiz. Edge runtime nisbiy Location'ni qabul qilmaydi.
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // static fayllar va rasm optimizatsiyasidan tashqari hammasi
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
