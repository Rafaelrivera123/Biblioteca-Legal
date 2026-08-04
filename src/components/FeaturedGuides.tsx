import { getAllGuides } from "@/content/guias";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

const FEATURED_SLUGS = [
  "como-consultar-leyes-actualizadas-honduras",
  "como-leer-el-codigo-penal-vigente",
  "guia-codigo-del-trabajo-empleados",
  "como-verificar-decreto-en-la-gaceta",
  "como-entender-una-reforma-legal",
  "jerarquia-normativa-honduras",
];

export default function FeaturedGuides() {
  const bySlug = new Map(getAllGuides().map((guide) => [guide.slug, guide]));
  const guides = FEATURED_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (guide): guide is NonNullable<typeof guide> => !!guide
  );
  if (guides.length === 0) return null;

  return (
    <section className="bg-slate-50 py-14 px-4 sm:px-6 lg:px-8 border-b border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <h2 className="text-primary text-[22px] md:text-3xl font-bold leading-tight">
              Guías para estudiar el Derecho hondureño
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">
              Explicaciones originales sobre cómo leer códigos, verificar La
              Gaceta y entender reformas — más allá del texto legal puro.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/guias">
              Ver todas las guías
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guias/${guide.slug}`}
              className="block border border-black/10 rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all bg-white"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary mb-3">
                <BookOpen className="w-3 h-3" />
                {guide.category}
              </span>
              <h3 className="font-semibold text-primary text-[15px] leading-snug mb-2 line-clamp-2">
                {guide.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {guide.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
