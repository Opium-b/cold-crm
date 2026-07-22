export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl">📞</div>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Cold CRM</h1>
          <p className="text-sm text-slate-500">Kirish uchun parolni kiriting</p>
        </div>
        <form action="/api/login" method="post" className="space-y-4">
          <input
            type="password"
            name="password"
            autoFocus
            required
            placeholder="Parol"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg outline-none focus:border-slate-900"
          />
          {error && (
            <p className="text-sm text-red-600">Parol noto&apos;g&apos;ri. Qayta urining.</p>
          )}
          <button className="btn w-full bg-slate-900 py-3 text-lg text-white hover:bg-slate-800">
            Kirish
          </button>
        </form>
      </div>
    </div>
  );
}
