"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COOKIE_KEY = "cookie_consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  useEffect(() => {
    if (visible) {
      document.documentElement.classList.add("cookie-banner-visible");
    } else {
      document.documentElement.classList.remove("cookie-banner-visible");
    }
    return () => {
      document.documentElement.classList.remove("cookie-banner-visible");
    };
  }, [visible]);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/10 shadow-lg px-4 sm:px-6 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="container mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <p className="text-[12px] sm:text-[13px] text-gray-600 leading-relaxed max-w-2xl">
          Usamos cookies propias y de terceros (incluyendo Google AdSense) para
          mejorar tu experiencia, analizar el tráfico y mostrarte publicidad
          relevante. Puedes aceptar todas las cookies o solo las esenciales.{" "}
          <Link href="/cookie-policy" className="text-primary underline">
            Política de Cookies
          </Link>
          {" · "}
          <Link href="/privacy-policy" className="text-primary underline">
            Privacidad
          </Link>
        </p>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none text-primary border-primary hover:bg-primary/5 text-[13px] min-h-10"
            onClick={handleDecline}
          >
            Solo esenciales
          </Button>
          <Button
            className="flex-1 sm:flex-none bg-primary text-white hover:bg-primary/90 text-[13px] min-h-10"
            onClick={handleAccept}
          >
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
