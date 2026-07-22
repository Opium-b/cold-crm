// Server ishga tushganda eslatmalar uchun ichki scheduler ishga tushadi.
// Node.js runtime'da bo'lgan node:sqlite kodini alohida faylga ajratamiz,
// shunda Edge runtime buni bundle qilishga urinmaydi.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
