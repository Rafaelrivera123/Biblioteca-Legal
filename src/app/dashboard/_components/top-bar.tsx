"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebarStore } from "@/store/dashboard/sidebar";
import { useArticleSearch } from "@/store/dashboard/document/section-search";
import { CircleUser, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  name: string;
}

const Topbar = ({ name }: Props) => {
  const { query, setQuery } = useArticleSearch();
  const pathName = usePathname();
  const toggleSidebar = useSidebarStore((state) => state.toggle);

  // Split path and check structure
  const pathSegments = pathName.split("/").filter(Boolean); // removes empty segments

  const isOnArticlePage =
    pathName.startsWith("/dashboard/documents/") && pathSegments.length > 3;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b bg-white px-3 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden h-11 w-11"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-base sm:text-lg font-semibold">{name}</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Admin Dashboard
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Only show search input on article page */}
        {isOnArticlePage && (
          <div>
            <Input
              className="w-[140px] sm:w-[220px] md:w-[300px]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by article number..."
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full border">
            <CircleUser className="h-5 w-5 text-primary" />
            <span className="sr-only">Profile</span>
          </Button>
          <div className="hidden text-sm sm:block">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
