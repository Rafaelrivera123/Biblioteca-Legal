"use client";
import { BookOpen, Hash, Sparkles } from "lucide-react";
import GlobalSearchBox from "./global-search-box";

const FEATURES = [
  {
    icon: BookOpen,
    label: "Por ley o código",
  },
  {
    icon: Hash,
    label: "Por número de artículo",
  },
  {
    icon: Sparkles,
    label: "Por pregunta en lenguaje natural",
  },
];

export default function ResearchTools() {
  return (
    <section className="py-16 px-4 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="my-8 text-2xl font-bold text-[#D4AF37]">
          Buscador Legal
        </h2>
        <h3 className="my-4 text-2xl font-bold text-[#1E2A38] md:text-[40px]">
          Encuentra Información Legal
        </h3>
        <p className="mb-10 font-medium text-[#1E2A38] md:text-lg">
          Busca por número de artículo, nombre de la ley o decreto, una
          palabra o frase exacta dentro del texto, o hazlo en lenguaje
          natural para que la IA localice el artículo relevante. Cubre todas
          las leyes y códigos vigentes de Honduras publicados en la
          plataforma.
        </p>
        <div className="relative mx-auto max-w-3xl">
          <div className="relative z-10 overflow-hidden rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500"
                >
                  <Icon className="h-4 w-4 text-[#D4AF37]" />
                  {label}
                </span>
              ))}
            </div>
            <GlobalSearchBox placeholder="Buscar por artículo, ley, decreto o palabra clave..." />
          </div>
        </div>
      </div>
    </section>
  );
}
