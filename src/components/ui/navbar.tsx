"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { logoutAction } from "@/actions/auth/logout";
import { logoSrc } from "@/helper/assets";
import { cn } from "@/lib/utils";
import GlobalSearch from "@/components/shared/global-search";
import { useGlobalSearchStore } from "@/store/search";
import { User } from "@prisma/client";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "../ui/sheet";
import FramerDropdown from "./framer-dropdown";

interface Props {
  isLoggedin: boolean;
  user: User | null;
}

const Navbar = ({ isLoggedin, user }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [scrolling, setScrolling] = useState(false);
  const { open: openSearch } = useGlobalSearchStore();

  const pathname = usePathname();

  const menus = [
    { id: 1, href: "/", linkText: "Inicio", tourId: undefined },
    { id: 2, href: "/collections", linkText: "Colección", tourId: undefined },
    { id: 3, href: "/subscriptions", linkText: "Subscripciones", tourId: "tour-subscriptions" },
    { id: 4, href: "/contact", linkText: "Contacto", tourId: undefined },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolling(true);
      } else {
        setScrolling(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onLogout = async () => {
    startTransition(() => {
      logoutAction().then((res) => {
        if (res && !res.success) {
          toast.error(res.message);
        }
      });
    });
  };

  return (
    <div
      className={cn(
        "py-3 fixed top-0 z-50 w-full h-[60px] transition duration-300",
        scrolling && "bg-white",
        pathname === "/"
          ? "text-primary"
          : pathname.startsWith("/collections/") ||
              pathname.startsWith("/account")
            ? "text-black"
            : scrolling
              ? "text-primary"
              : "text-white"
      )}
    >
      <div className="container mx-auto h-full">
        <div className="flex justify-between items-center">
          <div>
            <Link href={"/"} className="bg-red-500">
              <Image src={logoSrc} width={40} height={40} alt="Logo" />
            </Link>
          </div>
          <div className="hidden md:flex items-center md:gap-x-5 lg:gap-x-10">
            {menus.map((menu) => (
              <Link
                key={menu.id}
                href={menu.href}
                id={menu.tourId}
                className={cn(
                  pathname === menu.href ? "font-semibold" : "font-light"
                )}
              >
                {menu.linkText}
              </Link>
            ))}
          </div>
          <div className="hidden md:flex items-center">
            <button
              onClick={openSearch}
              aria-label="Buscar en Biblioteca Legal"
              className="mr-4 flex items-center gap-2 rounded-full border border-current/20 px-3 py-1.5 text-sm hover:bg-black/5 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Buscar</span>
              <kbd className="hidden lg:inline-flex items-center rounded border border-current/30 px-1.5 py-0.5 text-[10px] font-mono opacity-70">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="hidden md:block">
            {isLoggedin ? (
              <>
                <FramerDropdown
                  trigger={
                    <Image
                      id="tour-profile"
                      src={user?.image ?? "https://github.com/shadcn.png"}
                      alt={user?.first_name + " " + user?.last_name}
                      height={30}
                      width={30}
                      className="rounded-full cursor-pointer"
                    />
                  }
                >
                  {(close) => (
                    <div>
                      <Button
                        className="w-full text-primary hover:text-primary/90 border-none"
                        variant="outline"
                        asChild
                        onClick={close}
                      >
                        <Link href="/account" className="w-full">
                          Cuenta
                        </Link>
                      </Button>
                      <Button
                        onClick={async () => {
                          close();
                          await onLogout();
                        }}
                        className="cursor-pointer w-full text-primary hover:text-primary/90 border-none"
                        variant="outline"
                        disabled={isPending}
                      >
                        Cerrar sesión
                      </Button>
                    </div>
                  )}
                </FramerDropdown>
              </>
            ) : (
              <Button asChild>
                <Link href="/login" className="w-full h-full">
                  Iniciar sesión
                </Link>
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-x-4">
            <button onClick={openSearch} aria-label="Buscar" className="p-1">
              <Search className="h-5 w-5" />
            </button>
            <div>
              {!isLoggedin && <Button size="sm">Iniciar sesión</Button>}
              {isLoggedin && (
                <Link href="/account" className="flex items-center">
                  <Image
                    src={user?.image ?? "https://github.com/shadcn.png"}
                    alt={user?.first_name + " " + user?.last_name}
                    height={30}
                    width={30}
                    className="rounded-full"
                  />
                </Link>
              )}
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-1" size="icon">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="bg-white text-primary">
                <div className="flex flex-col items-center gap-y-8 mt-6">
                  <div className="flex flex-col items-center gap-y-5">
                    {menus.map((menu) => (
                      <Link
                        key={menu.id}
                        href={menu.href}
                        className={`${
                          pathname === menu.href ? "font-semibold" : "font-light"
                        }`}
                      >
                        <SheetClose>{menu.linkText}</SheetClose>
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <GlobalSearch />
    </div>
  );
};

export default Navbar;
