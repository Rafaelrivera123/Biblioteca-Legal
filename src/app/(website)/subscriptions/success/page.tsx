import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUserSubscription } from "@/helper/subscription";
import { CheckCircle2, MessageSquare, Sparkles, Highlighter } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import PurchaseTracker from "./_components/purchase-tracker";

export const metadata: Metadata = {
  title: "Suscripción activada",
  robots: { index: false, follow: false },
};

export default async function SubscriptionSuccessPage() {
  const cu = await auth();
  const subscription = await getCurrentUserSubscription();
  const isActive = !!subscription?.subscription?.isActive;

  return (
    <div className="container max-w-lg mx-auto py-16 px-4 text-center">
      <PurchaseTracker isActive={isActive} />
      <div className="flex justify-center mb-4">
        <CheckCircle2 className="w-14 h-14 text-primary" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary">
        {isActive ? "¡Plan Personal activado!" : "Estamos confirmando tu pago"}
      </h1>
      <p className="text-muted-foreground mt-3 text-sm md:text-base leading-relaxed">
        {isActive
          ? "Ya puedes usar IA, notas y resaltados en toda la biblioteca. Empieza con uno de estos pasos:"
          : "Si acabas de pagar, la confirmación puede tardar unos segundos. Actualiza esta página o abre la colección."}
      </p>

      <ul className="text-left mt-8 space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-5">
        <li className="flex items-start gap-3 text-sm text-slate-700">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          Abre un código y toca <strong className="mx-1">Resumen claro</strong>{" "}
          en cualquier artículo.
        </li>
        <li className="flex items-start gap-3 text-sm text-slate-700">
          <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          Usa el <strong className="mx-1">Asistente Legal</strong> (20 consultas
          al día).
        </li>
        <li className="flex items-start gap-3 text-sm text-slate-700">
          <Highlighter className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          Resalta y guarda artículos para tus parciales o escritos.
        </li>
      </ul>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Button asChild className="bg-primary">
          <Link href="/collections">Ir a la colección</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={cu ? "/account" : "/login"}>
            {cu ? "Mi cuenta" : "Iniciar sesión"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
