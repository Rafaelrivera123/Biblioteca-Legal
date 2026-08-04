import type { Guide } from "@/content/guias";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";

type Props = {
  guide: Guide;
};

export default function GuideArticle({ guide }: Props) {
  return (
    <article className="container max-w-[800px] mt-24 sm:mt-28 mb-16 sm:mb-20 px-4">
      <Link
        href="/guias"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a guías
      </Link>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary">
          <BookOpen className="w-3.5 h-3.5" />
          {guide.category}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {guide.readingMinutes} min de lectura
        </span>
        <span className="text-xs text-muted-foreground">
          Actualizado:{" "}
          {new Date(`${guide.updatedAt}T12:00:00`).toLocaleDateString("es-HN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <h1 className="font-bold text-[26px] md:text-[34px] leading-[125%] mb-4 text-primary">
        {guide.title}
      </h1>
      <p className="text-muted-foreground text-base leading-relaxed mb-10 border-l-4 border-primary/20 pl-4">
        {guide.description}
      </p>

      <div className="space-y-10">
        {guide.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-xl font-semibold text-primary leading-snug">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-[15px] leading-[1.8] text-gray-700"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-gray-700">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {guide.relatedCollections && guide.relatedCollections.length > 0 && (
        <div className="mt-12 border-t pt-6">
          <p className="text-sm font-semibold text-primary mb-3">
            Documentos relacionados en la Colección
          </p>
          <ul className="space-y-2">
            {guide.relatedCollections.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/collections/${doc.slug}`}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  {doc.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <aside className="mt-10 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 leading-relaxed">
        <p className="font-semibold mb-1">Aviso educativo</p>
        <p>
          Esta guía es material informativo de Biblioteca Legal HN. No constituye
          asesoría legal, ni crea relación abogado-cliente. Para un caso concreto,
          consulta a un profesional del Derecho.
        </p>
      </aside>
    </article>
  );
}
