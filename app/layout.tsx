import type { Metadata, Viewport } from "next";
import "./globals.css";
import { isAuthed } from "@/lib/auth";
import { NavBar } from "./_components/NavBar";

export const metadata: Metadata = {
  title: "Cold CRM",
  description: "Cold call ichki CRM tizimi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthed();
  return (
    <html lang="uz">
      <body className="min-h-screen antialiased">
        {authed && <NavBar />}
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4">{children}</main>
      </body>
    </html>
  );
}
