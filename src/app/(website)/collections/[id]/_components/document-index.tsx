"use client";
import { FullSectionResponse } from "./article-container";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  sections: FullSectionResponse[];
}

const DocumentIndex = ({ sections }: Props) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((section) => {
      section.chapters.forEach((chapter) => {
        const el = document.getElementById(`chapter-${chapter.id}`);
        if (el) observer.observe(el);
      });
    });
    return () => observer.disconnect();
  }, [sections]);

  const scrollToChapter = (chapterId: string) => {
    const el = document.getElementById(`chapter-${chapterId}`);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(`chapter-${chapterId}`);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <div className="w-[260px] shrink-0 hidden lg:block">
      <div className="sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto pb-10 rounded-xl border border-primary/20 bg-primary shadow-md">
        {/* Header del índice */}
        <div className="px-4 py-3 border-b border-white/20">
          <p className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">
            Índice
          </p>
        </div>

        {/* Lista */}
        <div className="space-y-0.5 p-2">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <div key={section.id}>
                {/* Sección */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-1.5 px-2 py-2 rounded-md text-left hover:bg-white/10 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={13} className="text-white/60 shrink-0" />
                  ) : (
                    <ChevronRight size={13} className="text-white/60 shrink-0" />
                  )}
                  <span className="text-[12px] font-semibold text-white leading-tight">
                    {section.title}
                  </span>
                </button>

                {/* Capítulos */}
                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {section.chapters.map((chapter) => {
                      const isActive = activeId === `chapter-${chapter.id}`;
                      return (
                        <button
                          key={chapter.id}
                          onClick={() => scrollToChapter(chapter.id)}
                          className={cn(
                            "w-full text-left px-2 py-1.5 rounded-md transition-all duration-200",
                            isActive
                              ? "bg-white text-primary font-semibold text-[13px] shadow-sm"
                              : "text-white/70 text-[12px] hover:bg-white/10 hover:text-white"
                          )}
                        >
                          {chapter.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DocumentIndex;
