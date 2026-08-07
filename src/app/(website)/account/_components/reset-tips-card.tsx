"use client";

import { Button } from "@/components/ui/button";
import { resetTipsState } from "@/lib/onboarding-tips";
import { Compass, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  userId: string;
}

export default function ResetTipsCard({ userId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const reset = (andStart: boolean) => {
    setPending(true);
    try {
      resetTipsState(userId);
      toast.success(
        andStart
          ? "Tips reiniciados. Te llevamos al inicio para ver el primero."
          : "Tips reiniciados. Volverán a mostrarse al visitar cada página."
      );
      if (andStart) {
        router.push("/?tips=1");
      }
    } catch {
      toast.error("No se pudieron reiniciar los tips. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 md:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#1E2A38] flex items-center gap-2">
          <Compass className="h-5 w-5 text-[#D4AF37]" />
          Tips de la plataforma
        </h2>
        <p className="text-sm text-gray-600 mt-1 max-w-xl">
          Las guías rápidas aparecen las primeras veces que entras a cada
          sección. Si ya no las ves, puedes reiniciarlas aquí.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => reset(false)}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reiniciar tips
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() => reset(true)}
          className="gap-2"
        >
          <Compass className="h-4 w-4" />
          Reiniciar y ver ahora
        </Button>
      </div>
    </section>
  );
}
