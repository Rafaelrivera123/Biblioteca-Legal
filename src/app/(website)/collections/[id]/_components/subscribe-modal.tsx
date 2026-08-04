"use client";
import { logoSrc } from "@/helper/assets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { trackEvent } from "@/lib/analytics";
import {
  formatHnl,
  formatUsd,
  USD_ANNUAL_PRICE,
  USD_MONTHLY_PRICE,
} from "@/lib/pricing";
import { Crown, Sparkles, Bookmark, MessageSquare, Scale } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  source?: string;
}

const SubscribeModal = ({ open, onClose, source = "paywall" }: Props) => {
  const { openCheckout, loading } = usePaddleCheckout();

  useEffect(() => {
    if (open) {
      trackEvent("paywall_view", { source });
    }
  }, [open, source]);

  const handleSubscribe = async (plan: "monthly" | "annual") => {
    onClose();
    await openCheckout(plan);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex justify-center mb-2">
          <Image
            src={logoSrc}
            alt="Biblioteca Legal"
            width={70}
            height={70}
            className="object-contain"
          />
        </div>
        <DialogHeader>
          <DialogTitle className="text-center text-primary text-[18px]">
            Estudia derecho más rápido
          </DialogTitle>
        </DialogHeader>
        <p className="text-gray-500 text-[13px] leading-[160%] mt-1">
          El texto de la ley sigue gratis. El{" "}
          <strong className="text-primary">Plan Personal</strong> te da IA,
          notas y lectura sin anuncios.
        </p>
        <ul className="text-left space-y-2 mt-3">
          <li className="flex items-start gap-2 text-[13px] text-gray-700">
            <Scale className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              <strong>Asistente Legal</strong> — consulta cualquier ley
              hondureña al instante
            </span>
          </li>
          <li className="flex items-start gap-2 text-[13px] text-gray-700">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              <strong>Resúmenes IA por artículo</strong> — entiende el contenido
              al instante
            </span>
          </li>
          <li className="flex items-start gap-2 text-[13px] text-gray-700">
            <Bookmark className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              <strong>Favoritos y resaltado</strong> — marca lo que entra en el
              parcial
            </span>
          </li>
          <li className="flex items-start gap-2 text-[13px] text-gray-700">
            <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>
              <strong>Notas por artículo</strong> — agrega tus apuntes
              directamente en la ley
            </span>
          </li>
        </ul>
        <p className="text-[12px] text-gray-400 mt-2">
          {formatUsd(USD_MONTHLY_PRICE)}/mes ({formatHnl(USD_MONTHLY_PRICE)}) ·
          Anual {formatUsd(USD_ANNUAL_PRICE)}/año — 50% menos que 12 meses
        </p>
        <div className="flex flex-col gap-3 mt-3">
          <Button
            className="w-full bg-primary text-white hover:bg-primary/90"
            disabled={loading}
            onClick={() => handleSubscribe("monthly")}
          >
            <Crown className="mr-2 h-4 w-4" />
            Activar mensual
          </Button>
          <Button
            variant="outline"
            className="w-full text-primary border-primary/30"
            disabled={loading}
            onClick={() => handleSubscribe("annual")}
          >
            Activar anual (50% off)
          </Button>
          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={onClose}
          >
            Continuar sin suscripción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscribeModal;
