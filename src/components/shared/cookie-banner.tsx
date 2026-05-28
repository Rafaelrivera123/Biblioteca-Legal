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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/10 shadow-lg px-6 py-4">
      <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="text-[13px] text-gray-600 leading-relaxed max-w-2xl">
          Usamos cookies propias y de terceros (incluyendo Google AdSense) para
          mejorar tu experiencia, analizar el tráfico y mostrarte publicidad
          relevante. Puedes aceptar todas las cookies o solo las esenciales.{" "}
          <Link href="/privacy-policy" className="text-primary underline">
            Política de Privacidad
          </Link>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            className="text-primary border-primary hover:bg-primary/5 text-[13px]"
            onClick={handleDecline}
          >
            Solo esenciales
          </Button>
          <Button
            className="bg-primary text-white hover:bg-primary/90 text-[13px]"
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
