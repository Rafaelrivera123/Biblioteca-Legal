"use client";
import useCollectionSearchStore from "@/store/collections";
import { BookOpen, Gavel, Scale, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "./ui/input";

type TabKey = "legislation" | "jurisprudence" | "doctrine";

export default function ResearchTools() {
  const [activeTab, setActiveTab] = useState<TabKey>("legislation");
  const { query, setQuery } = useCollectionSearchStore();
  const router = useRouter();

  const tabContent: Record<TabKey, JSX.Element> = {
    legislation: (
      <div className="space-y-6">
        <div className="relative">
          <Input
            startIcon={Search}
            placeholder="Buscar legislación"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query !== "") {
                router.push("/collections");
              }
            }}
          />
        </div>
      </div>
    ),
    jurisprudence: (
      <div className="space-y-6">
        <div className="relative">
          <Input
            startIcon={Search}
            placeholder="Buscar jurisprudencia"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query !== "") {
                router.push("/collections");
              }
            }}
          />
        </div>
      </div>
    ),
    doctrine: (
      <div className="space-y-6">
        <div className="relative">
          <Input
            startIcon={Search}
            placeholder="Buscar doctrina"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query !== "") {
                router.push("/collections");
              }
            }}
          />
        </div>
      </div>
    ),
  };

  return (
    <section className="py-16 px-4 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="my-8 text-2xl font-bold text-[#D4AF37]">
          Herramientas de Investigación
        </h2>
        <h3 className="my-4 text-2xl font-bold text-[#1E2A38] md:text-[40px]">
          Encuentra Información Legal
        </h3>
        <p className="mb-10 font-medium text-[#1E2A38] md:text-lg">
          Busca en nuestra extensa base de datos de recursos legales para
          encontrar la información que necesitas.
        </p>
        <div className="relative mx-auto max-w-3xl">
          <div className="relative z-10 overflow-hidden rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex justify-between border-b overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setActiveTab("legislation")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-lg font-medium transition-colors md:text-base ${
                  activeTab === "legislation"
                    ? "border-[#0D99FF] text-[#0D99FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Gavel className="h-8 w-8" />
                Legislación
              </button>
              <button
                onClick={() => setActiveTab("jurisprudence")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-lg font-medium transition-colors md:text-base ${
                  activeTab === "jurisprudence"
                    ? "border-[#0D99FF] text-[#0D99FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Scale className="h-8 w-8" />
                Jurisprudencia
              </button>
              <button
                onClick={() => setActiveTab("doctrine")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-lg font-medium transition-colors md:text-base ${
                  activeTab === "doctrine"
                    ? "border-[#0D99FF] text-[#0D99FF]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <BookOpen className="h-8 w-8" />
                Doctrina
              </button>
            </div>
            <div className="py-4">{tabContent[activeTab]}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
