"use client";
import { FullSectionResponse } from "./article-container";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChapterStore } from "@/store/collections";

interface Props {
  sections: FullSectionResponse[];
}

const DocumentIndex = ({ sections }: Props) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );
  const { activeChapterId } = useActiveChapterStore();
  const indexRef = useRef<HTMLDivElement>(null);

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

  // Cuando ArticleWrapper encuentra el artículo buscado, sincroniza el índice
  useEffect(() => {
    if (!activeChapterId) return;

    const chapterElementId = `chapter-${activeChapterId}`;
    setActiveId(chapterElementId);

    // Asegura que la sección padre esté expandida
    sections.forEach((section) => {
      const chapterExists = section.chapters.some((c) => c.id === activeChapterId);
      if (chapterExists) {
        setExpandedSections((prev) => {
          const next = new Set(prev);
          next.add(section.id);
          return next;
        });
      }
    });

    // Hace scroll dentro del índice hasta el capítulo activo
    setTimeout(() => {
      const indexContainer = indexRef.current;
      const activeButton = indexContainer?.querySelector(
        `[data-chapter-id="${activeChapterId}"]`
      ) as HTMLElement | null;

      if (indexContainer && activeButton) {
        const containerTop = indexContainer.scrollTop;
        const containerHeight = indexContainer.clientHeight;
        const buttonTop = activeButton.offsetTop;
        const buttonHeight = activeButton.clientHeight;
        const targetScroll = buttonTop - containerHeight / 2 + buttonHeight / 2;
        indexContainer.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    }, 300);
  }, [activeChapterId, sections]);

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
    <div
      ref={indexRef}
      className="max-h-[calc(100vh-100px)] overflow-y-auto pb-10 rounded-xl border border-primary/20 bg-primary shadow-md"
    >
      <div className="px-4 py-3 border-b border-white/20 sticky top-0 bg-primary z-10">
        <p className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">
          Índice
        </p>
      </div>
      <div className="space-y-0.5 p-2">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <div key={section.id}>
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
              {isExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {section.chapters.map((chapter) => {
                    const isActive = activeId === `chapter-${chapter.id}`;
                    return (
                      <button
                        key={chapter.id}
                        data-chapter-id={chapter.id}
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
  );
};

export default DocumentIndex;
