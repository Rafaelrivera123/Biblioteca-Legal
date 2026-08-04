import { getAllGuides, getGuideCategories } from "@/content/guias";
import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Guías legales de Honduras",
  description:
    "Guías originales para entender leyes y códigos de Honduras: cómo leer el Código Penal, verificar decretos en La Gaceta, derechos laborales y más.",
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/guias",
  },
  openGraph: {
    title: "Guías legales de Honduras | Biblioteca Legal HN",
    description:
      "Material editorial original para estudiar y consultar el Derecho hondureño con método.",
    url: "https://www.bibliotecalegalhn.com/guias",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
};

export default function GuiasPage() {
  const guides = getAllGuides();
  const categories = getGuideCategories();

  return (
    <div className="container max-w-[950px] mt-24 sm:mt-28 mb-16 sm:mb-20 px-4">
      <div className="text-center mb-10 sm:mb-12">
        <h1 className="font-bold text-[26px] sm:text-[30px] md:text-[40px] leading-[120%] mb-4 text-primary">
          Guías legales de Honduras
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-[700px] mx-auto leading-relaxed">
          Material editorial original para estudiar y consultar el Derecho
          hondureño con método: cómo leer códigos, verificar La Gaceta, entender
          reformas y ubicar derechos básicos. No son transcripciones de leyes;
          son explicaciones prácticas.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((category) => (
          <span
            key={category}
            className="text-xs font-medium px-3 py-1 rounded-full border border-black/10 text-muted-foreground"
          >
            {category}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guias/${guide.slug}`}
            className="block border border-black/10 rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all bg-white"
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                <BookOpen className="w-3 h-3" />
                {guide.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {guide.readingMinutes} min
              </span>
            </div>
            <h2 className="font-semibold text-primary text-[16px] leading-snug mb-2">
              {guide.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {guide.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
