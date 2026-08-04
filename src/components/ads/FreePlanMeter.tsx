"use client";

import { Button } from "@/components/ui/button";
import { FREE_AI_CHAT_LIMIT, FREE_SUMMARY_LIMIT } from "@/lib/pricing";
import { Sparkles } from "lucide-react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

interface Props {
  freeChatRemaining?: number | null;
}

/**
 * Soft conversion banner for free readers on law pages.
 */
export default function FreePlanMeter({ freeChatRemaining }: Props) {
  const { openCheckout, loading } = usePaddleCheckout();
  const chatLabel =
    typeof freeChatRemaining === "number"
      ? `${freeChatRemaining} de ${FREE_AI_CHAT_LIMIT} consultas IA gratis`
      : `${FREE_AI_CHAT_LIMIT} consultas IA gratis`;

  return (
    <div className="sticky top-[56px] z-30 border-b border-amber-200 bg-amber-50">
      <div className="container px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-[12px] sm:text-[13px] text-amber-950 leading-snug">
          <Sparkles className="inline w-3.5 h-3.5 mr-1 text-amber-700" />
          Primeros {FREE_SUMMARY_LIMIT} resúmenes IA gratis · {chatLabel}. El
          texto de la ley sigue siendo gratuito.
        </p>
        <Button
          size="sm"
          className="shrink-0 bg-primary hover:bg-primary/90 h-8 text-xs"
          disabled={loading}
          onClick={() => openCheckout("monthly")}
        >
          Activar Plan Personal
        </Button>
      </div>
    </div>
  );
}
