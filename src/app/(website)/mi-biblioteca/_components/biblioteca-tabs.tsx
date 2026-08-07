"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { bibliotecaTabs } from "./data";

const BibliotecaTabs = () => {
  const pathname = usePathname();

  return (
    <nav
      id="tour-mi-biblioteca-tabs"
      aria-label="Secciones de Mi Biblioteca"
      className="flex flex-wrap gap-2 border-b border-black/10 pb-1"
    >
      {bibliotecaTabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.id}
            href={tab.path}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-white font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {tab.linkText}
          </Link>
        );
      })}
    </nav>
  );
};

export default BibliotecaTabs;
