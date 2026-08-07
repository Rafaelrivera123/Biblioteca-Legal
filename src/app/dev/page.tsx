import Link from "next/link";

export const metadata = {
  title: "Dev Labs · Biblioteca Legal HN",
  robots: { index: false, follow: false },
};

export default function DevIndexPage() {
  return (
    <main className="min-h-screen bg-[#e8e6e1] px-6 py-16 text-[#1E2A38]">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6d12]">
          Labs locales
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Tour & Tips — página real
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
          Scroll libre por la página. Cuando quieras, pulsa «Mostrar tip aquí»,
          coloca tip + flecha, guarda y pega el blueprint en el chat.
        </p>
        <ul className="mt-8 space-y-3">
          <li>
            <Link
              href="/dev/tour-lab"
              className="block rounded-xl border border-black/10 bg-[#fbfaf7] px-5 py-4 hover:border-[#1E2A38]"
            >
              <span className="font-semibold">Tour (invitado)</span>
              <span className="mt-1 block text-sm text-[#4b5563]">
                Recorrido guest sobre páginas reales
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/dev/tips-lab"
              className="block rounded-xl border border-black/10 bg-[#fbfaf7] px-5 py-4 hover:border-[#1E2A38]"
            >
              <span className="font-semibold">Tips (logueado)</span>
              <span className="mt-1 block text-sm text-[#4b5563]">
                Tips contextuales sobre la UI real
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
