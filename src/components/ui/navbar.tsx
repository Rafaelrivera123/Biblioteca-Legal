"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { logoutAction } from "@/actions/auth/logout";
import { logoSrc } from "@/helper/assets";
import { cn } from "@/lib/utils";
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

  const pathname = usePathname();

  const menus = [
    { id: 1, href: "/", linkText: "Inicio" },
    { id: 2, href: "/collections", linkText: "Colección" },
    { id: 3, href: "/subscriptions", linkText: "Subscripciones", tourId: "tour-subscriptions" },
    { id: 4, href: "/contact", linkText: "Contacto" },
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
            <div>
              {!isLoggedin && <Button size="sm">Iniciar sesión</Button>}
