import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function PlatformStats() {
  const [documentCount, articleCount, updateCount] = await Promise.all([
    prisma.document.count({ where: { published: true } }),
    prisma.article.count(),
    prisma.legalUpdatePost.count({ where: { status: "published" } }),
  ]);

  return (
    <section className="py-16 px-4 md:py-24 bg-slate-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-[32px] font-bold text-[#1E2A38] mb-6">
          Cómo mantenemos la biblioteca actualizada
        </h2>
        <p className="text-[#1E2A38]/80 text-[14px] md:text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
          Varias veces por semana revisamos La Gaceta, el diario oficial de la República
          de Honduras. Cuando se publica un decreto que reforma, deroga o crea una ley,
          actualizamos el texto vigente del documento afectado en nuestra colección y
          publicamos un resumen en lenguaje claro en{" "}
          <Link href="/actualizaciones" className="text-primary underline">
            Actualizaciones Legales
          </Link>
          , explicando qué cambió y qué implica para abogados, estudiantes y ciudadanos.
          Puedes ver el respaldo oficial de cada cambio en{" "}
          <Link href="/gacetas" className="text-primary underline">
            Gacetas Oficiales
          </Link>
          .
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div>
            <p className="text-3xl font-bold text-primary">{documentCount}+</p>
            <p className="text-sm text-muted-foreground mt-1">
              Leyes y códigos vigentes
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{articleCount}+</p>
            <p className="text-sm text-muted-foreground mt-1">
              Artículos consultables
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{updateCount}+</p>
            <p className="text-sm text-muted-foreground mt-1">
              Actualizaciones legales publicadas
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
