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
      <div className="sticky top-[80px] max-h-[calc(100vh-100px)] overflow-y-auto pr-2 pb-10">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4 px-2">
          Índice
        </p>
        <div className="space-y-1">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <div key={section.id}>
                {/* Sección */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-left hover:bg-gray-100 transition-colors group"
                >
                  {isExpanded ? (
                    <ChevronDown size={13} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight size={13} className="text-gray-400 shrink-0" />
                  )}
                  <span className="text-[12px] font-semibold text-primary leading-tight">
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
                              ? "bg-primary/10 text-primary font-semibold text-[13px]"
                              : "text-gray-500 text-[12px] hover:bg-gray-100 hover:text-primary"
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
