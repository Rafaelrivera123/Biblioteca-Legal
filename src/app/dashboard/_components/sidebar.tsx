"use client";
import { logoutAction } from "@/actions/auth/logout";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import { logoSrc } from "@/helper/assets";
import { useSidebarStore } from "@/store/dashboard/sidebar";
import {
  Archive,
  Building,
  ExternalLink,
  FileStack,
  FileText,
  LayoutDashboard,
  ListRestart,
  LogOut,
  Newspaper,
  Settings,
  ShieldCheck,
  TableOfContents,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
const routes = [
  { id: 1, label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { id: 2, label: "Users", icon: Users, href: "/dashboard/users" },
  { id: 3, label: "Documents", icon: FileText, href: "/dashboard/documents" },
  { id: 4, label: "Companies", icon: Building, href: "/dashboard/companies" },
  { id: 5, label: "Category", icon: FileStack, href: "/dashboard/categories" },
  { id: 6, label: "Content", icon: TableOfContents, href: "/dashboard/content" },
  { id: 7, label: "WaitList", icon: ListRestart, href: "/dashboard/waitlist" },
  { id: 8, label: "Validate Laws", icon: ShieldCheck, href: "/dashboard/validate" },
  { id: 9, label: "Actualizaciones Legales", icon: Newspaper, href: "/dashboard/legal-updates" },
  { id: 10, label: "Gacetas", icon: Archive, href: "/dashboard/gacetas" },
  { id: 11, label: "Settings", icon: Settings, href: "/dashboard/settings" },
];
const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const isMobileOpen = useSidebarStore((state) => state.isOpen);
  const closeMobile = useSidebarStore((state) => state.close);
  const onLogout = () => {
    setIsLoading(true);
    startTransition(() => {
      logoutAction().then((res) => {
        if (res && !res.success) {
          console.log(res);
          toast.error(res.message);
          return;
        }
      });
    });
  };
  useEffect(() => {
    return () => { setIsLoading(false); };
  }, []);
  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);
  return (
    <>
      {/* Backdrop (mobile only) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r bg-white transition-transform duration-300 ease-in-out lg:w-64 lg:max-w-none lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b p-4 sm:p-6 flex justify-center items-center relative">
            <div className="relative h-[64px] w-[64px] sm:h-[80px] sm:w-[80px]">
              <Image src={logoSrc} alt="logo" fill />
            </div>
            <button
              type="button"
              onClick={closeMobile}
              className="absolute right-3 top-3 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Navigation Links */}
          <nav className="flex-1 overflow-auto p-3">
            <ul className="space-y-2">
              {routes.map((route) => {
                const Icon = route.icon;
                const isActive =
                  route.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(route.href);
                return (
                  <li key={route.id}>
                    <Link
                      href={route.href}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{route.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {/* Bottom actions */}
          <div className="border-t p-3 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="https://www.bibliotecalegalhn.com" target="_blank">
                <ExternalLink className="h-5 w-5" />
                <span>Ir al sitio</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-primary hover:text-primary/80"
              onClick={() => setOpen(true)}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onLogout}
        loading={isPending || isLoading}
        title="¿Estás seguro que quieres cerrar sesión?"
        message=""
      />
    </>
  );
};
export default Sidebar;
