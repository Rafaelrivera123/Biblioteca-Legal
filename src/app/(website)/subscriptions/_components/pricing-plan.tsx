"use client";
import CompanyContactModal from "@/components/shared/modals/compnay-contact-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import {
  ANNUAL_DISCOUNT_PERCENT,
  formatHnl,
  formatUsd,
  USD_ANNUAL_PRICE,
  USD_MONTHLY_PRICE,
} from "@/lib/pricing";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Sub {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  sub_id?: string;
  isActive: boolean;
  userId: string;
}
interface Props {
  subscription?: Sub;
  sub_type: "user" | "company";
  isLoggedin: boolean;
  autoCheckout?: "monthly" | "annual" | null;
}

function FeatureItem({
  included,
  name,
  dark = false,
}: {
  included: boolean;
  name: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {included ? (
        <div
          className={`w-5 h-5 rounded-full flex justify-center items-center flex-shrink-0 ${
            dark ? "bg-white" : "bg-[#E8EDFB]"
          }`}
        >
          <Check className={`w-3 h-3 ${dark ? "text-primary" : "text-black"}`} />
        </div>
      ) : (
        <div className="bg-[#F7F8F9] w-5 h-5 rounded-full flex justify-center items-center flex-shrink-0">
          <X className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <span
        className={`text-sm ${
          included ? (dark ? "text-white" : "text-primary") : "text-gray-400"
        }`}
      >
        {name}
      </span>
    </div>
  );
}

export default function PricingComparison({
  subscription,
  isLoggedin,
  autoCheckout = null,
}: Props) {
  const router = useRouter();
  const { openCheckout, loading, ready } = usePaddleCheckout();

  const freeFeatures = [
    { name: "Acceso ilimitado al texto de las leyes", included: true },
    { name: "Actualizaciones y noticias", included: true },
    { name: "Primeros 20 resúmenes IA por documento", included: true },
    { name: "10 consultas al asistente legal (total)", included: true },
    { name: "Sin anuncios", included: false },
    { name: "Resúmenes IA en todos los artículos", included: false },
    { name: "Asistente legal 20 consultas/día", included: false },
    { name: "Guardar, resaltar y notas", included: false },
    { name: "Acceso multiusuario", included: false },
  ];
  const personalFeatures = [
    { name: "Acceso ilimitado al texto de las leyes", included: true },
    { name: "Actualizaciones y noticias", included: true },
    { name: "Resúmenes IA en todos los artículos", included: true },
    { name: "Asistente legal 20 consultas/día", included: true },
    { name: "Sin anuncios", included: true },
    { name: "Guardar, resaltar y notas", included: true },
    { name: "Acceso multiusuario", included: false },
  ];
  const empresarialFeatures = [
    { name: "Acceso ilimitado al texto de las leyes", included: true },
    { name: "Actualizaciones y noticias", included: true },
    { name: "Resúmenes IA en todos los artículos", included: true },
    { name: "Asistente legal para el equipo", included: true },
    { name: "Sin anuncios", included: true },
    { name: "Guardar, resaltar y notas", included: true },
    { name: "Acceso multiusuario", included: true },
  ];

  const now = new Date();
  const isSubscribed =
    !!subscription?.isActive &&
    new Date(subscription.currentPeriodEnd) > now;

  useEffect(() => {
    if (!autoCheckout || !isLoggedin || isSubscribed || !ready) return;
    openCheckout(autoCheckout);
    // Strip query after triggering once
    router.replace("/subscriptions", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheckout, isLoggedin, isSubscribed, ready]);

  const monthlyLabel = !isLoggedin
    ? "Suscribirse"
    : isSubscribed
      ? "Suscrito"
      : loading
        ? "Cargando..."
        : "Suscribirse mensual";

  const annualLabel = !isLoggedin
    ? "Elegir anual"
    : isSubscribed
      ? "Suscrito"
      : loading
        ? "Cargando..."
        : "Suscribirse anual";

  const freeButtonLabel = isLoggedin ? "Listo" : "Registrarse";

  return (
    <div className="container mx-auto py-[100px]">
      <p className="text-center text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
        El texto completo de las leyes es gratis. Paga solo por velocidad: IA,
        notas y lectura sin anuncios. Anual = {ANNUAL_DISCOUNT_PERCENT}% de
        descuento vs 12 meses mensuales ({formatUsd(USD_ANNUAL_PRICE)}/año en
        lugar de {formatUsd(USD_MONTHLY_PRICE * 12)}).
      </p>
      <div className="flex flex-col md:flex-row justify-center gap-10 flex-wrap">
        {/* Free Plan */}
        <Card className="relative bg-white border-2 border-gray-200 w-full md:max-w-[334px] shadow-[0px_4px_12px_0px_#0000001A]">
          <CardHeader className="text-start pb-8">
            <CardTitle className="text-xl font-semibold text-primary mb-2">
              Plan Gratis
            </CardTitle>
            <div className="flex items-baseline justify-start">
              <span className="text-4xl font-bold text-primary">L0</span>
              <span className="text-gray-500 ml-1">/mes</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isLoggedin}
              onClick={() => !isLoggedin && router.push("/sign-up")}
            >
              {freeButtonLabel}
            </Button>
            <div className="space-y-3">
              {freeFeatures.map((f, i) => (
                <FeatureItem key={i} included={f.included} name={f.name} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personal Monthly */}
        <Card className="relative bg-white border-2 border-primary w-full md:max-w-[334px] shadow-[0px_4px_12px_0px_#0000001A]">
          <CardHeader className="text-start pb-8">
            <CardTitle className="text-xl font-semibold text-primary mb-2">
              Plan Personal
            </CardTitle>
            <div className="flex items-baseline justify-start flex-wrap gap-x-2">
              <span className="text-4xl font-bold text-primary">
                {formatHnl(USD_MONTHLY_PRICE)}
              </span>
              <span className="text-gray-500">/mes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatUsd(USD_MONTHLY_PRICE)} USD / mes
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isSubscribed || loading}
              onClick={() => openCheckout("monthly")}
            >
              {monthlyLabel}
            </Button>
            <div className="space-y-3">
              {personalFeatures.map((f, i) => (
                <FeatureItem key={i} included={f.included} name={f.name} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personal Annual */}
        <Card className="relative bg-white border-2 border-gray-200 w-full md:max-w-[334px] shadow-[0px_4px_12px_0px_#0000001A]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-semibold px-3 py-1 rounded-full">
            {ANNUAL_DISCOUNT_PERCENT}% de descuento
          </div>
          <CardHeader className="text-start pb-8">
            <CardTitle className="text-xl font-semibold text-primary mb-2">
              Plan Personal Anual
            </CardTitle>
            <div className="flex items-baseline justify-start flex-wrap gap-x-2">
              <span className="text-4xl font-bold text-primary">
                {formatHnl(USD_ANNUAL_PRICE)}
              </span>
              <span className="text-gray-500">/año</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatUsd(USD_ANNUAL_PRICE)} USD / año · ≈{" "}
              {formatUsd(USD_ANNUAL_PRICE / 12)}/mes
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={isSubscribed || loading}
              onClick={() => openCheckout("annual")}
            >
              {annualLabel}
            </Button>
            <div className="space-y-3">
              {personalFeatures.map((f, i) => (
                <FeatureItem key={i} included={f.included} name={f.name} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enterprise */}
        <Card className="relative bg-primary border-2 w-full border-black/20 md:max-w-[334px] shadow-[0px_4px_12px_0px_#0000001A]">
          <CardHeader className="text-start pb-8">
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Plan Empresarial
            </CardTitle>
            <p className="text-sm text-white/70">
              Despachos, notarías y equipos
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <CompanyContactModal
              trigger={
                <Button className="w-full bg-white hover:bg-white/80 text-slate-900">
                  Contáctanos
                </Button>
              }
            />
            <div className="space-y-3">
              {empresarialFeatures.map((f, i) => (
                <FeatureItem key={i} included={f.included} name={f.name} dark />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
