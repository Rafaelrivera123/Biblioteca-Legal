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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "../ui/sheet";
import FramerDropdown from "./framer-dropdown";

interface Props {
  isLoggedin: boolean;
  user: User | null;
}

function getUserInitials(user: User | null) {
  const first = user?.first_name?.trim()?.[0] ?? "";
  const last = user?.last_name?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "U";
}

function UserAvatar({
  user,
  id,
  className,
}: {
  user: User | null;
  id?: string;
  className?: string;
}) {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const rawImage = user?.image?.trim();
  const imageSrc =
    rawImage &&
    rawImage !== "/default-profile.jpg" &&
    rawImage !== "/placeholder.svg"
      ? rawImage
      : undefined;

  return (
    <Avatar id={id} className={cn("h-[30px] w-[30px]", className)}>
      <AvatarImage src={imageSrc} alt={name || "Usuario"} />
      <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-medium">
        {getUserInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
}

const Navbar = ({ isLoggedin, user }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [scrolling, setScrolling] = useState(false);

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
    <nav
      aria-label="Principal"
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
            <Link href={"/"}>
              <Image
                src={logoSrc}
                width={40}
                height={40}
                alt="Biblioteca Legal HN"
              />
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
              <FramerDropdown
                label="Menú de cuenta"
                trigger={<UserAvatar id="tour-profile" user={user} />}
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
              {!isLoggedin && (
                <Button size="sm" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              )}
              {isLoggedin && (
                <Link href="/account" className="flex items-center">
                  <UserAvatar user={user} />
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
    </nav>
  );
};

export default Navbar;
