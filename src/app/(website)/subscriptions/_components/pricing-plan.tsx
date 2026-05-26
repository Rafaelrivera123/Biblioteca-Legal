"use client";
import CompanyContactModal from "@/components/shared/modals/compnay-contact-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useEffect, useState } from "react";

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
  price: string;
  isLoggedin: boolean;
  paddleCustomerId?: string;
}

export default function PricingComparison({ subscription, price, isLoggedin, paddleCustomerId }: Props) {
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    initializePaddle({
      environment: "production",
      token: process.env.NEXT_PUBLIC_PADDLE_TOKEN!,
    }).then((p) => setPaddle(p));
  }, []);

  const freeFeatures = [
    { name: "Acceso ilimitado a documentos", included: true },
    { name: "Actualizaciones y noticias", included: true },
    { name: "Acceso en múltiples dispositivos", included: true },
    { name: "Herramientas de lectura inteligente", included: true },
    { name: "Sin anuncios", included: false },
    { name: "Guardar y resaltar artículos", included: false },
    { name: "Acceso multiusuario", included: false },
  ];

  const personalFeatures = [
    { name: "Acceso ilimitado a documentos", included: true },
    { name: "Actualizaciones y noticias", included: true },
    { name: "Acceso en múltiples dispositivos", included: true },
    { name: "Herramientas de lectura inteligente", included: true },
    { name: "Sin anuncios", included: true },
    { name: "Guardar y resaltar artículos", included: true },
    { name: "Acceso multiusuario", included: false },
  ];

  const empresarialFeatures = [
    { name: "Acceso ilimitado a documentos", included: true },
    { name: "Actualizaciones y noticias", included: true },
    { name: "Acceso en múltiples dispositivos", included: true },
    { name: "Herramientas de lectura inteligente", included: true },
    { name: "Sin anuncios", included: true },
    { name: "Guardar y resaltar artículos", included: true },
    { name: "Acceso multiusuario", included: true },
  ];

  const now = new Date();
  const isSubscribed = subscription?.isActive && new Date(subscription.currentPeriodEnd) > now;

  const handlePersonalClick = () => {
    if (!isLoggedin) {
      router.push("/sign-up");
      return;
    }
    if (isSubscribed) return;
    if (paddle) {
      paddle.Checkout.open({
        items: [{ priceId: process.env.NEXT_PUBLIC_PRICE_ID!, quantity: 1 }],
        customer: paddleCustomerId ? { id: paddleCustomerId } : undefined,
        settings: {
          successUrl: `https://bibliotecalegalhn.com/collections`,
        },
      });
    }
  };

  const personalButtonLabel = !isLoggedin
    ? "Comenzar"
    : isSubscribed
      ? "Suscrito"
      : "Suscribirse";

  const FeatureItem = ({ included, name, dark = false }: { included: boolean; name: string; dark?: boolean }) => (
    <div className="flex items-center gap-3">
      {included ? (
        <div className={`w-5 h-5 rounded-full flex justify-center items-center flex-shrink-0 ${dark ? "bg-white" : "bg-[#E8EDFB]"}`}>
          <Check className={`w-3 h-3 ${dark ? "text-primary" : "text-black"}`} />
        </div>
      ) : (
        <div className="bg-[#F7F8F9] w-5 h-5 rounded-full flex justify-center items-center flex-shrink-0">
          <X className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <span className={`text-sm ${included ? (dark ? "text-white" : "text-primary") : "text-gray-400"}`}>
        {name}
      </span>
    </div>
  );

  return (
    <div className="container mx-auto py-[100px]">
      <div className="flex flex-col md:flex-row justify-center gap-10">

        {/* Plan Gratis */}
        <Card className="relative bg-white border-2 border-gray-200 w-full md:max-w-[334px] shadow-[0px_4px_12px_0px_#0000001A]">
          <CardHeader className="text-start pb-8">
            <CardTitle className="text-xl font-semibold text-primary mb-2">Plan Gratis</CardTitle>
            <div className="flex items-baseline justify-start">
              <span className="text-4xl font-bold text-primary">L0</span>
              <span className="text-gray-500 ml-1">/mes</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={() => router.push("/sign-up")}>
              Registrarse
            </Button>
            <div className="space-y-3">
              {freeFeatures.map((f, i) => <FeatureItem key={i} included={f.included} name={f.name} />)}
            </div>
          </CardContent>
        </Card>

        {/* Plan Personal */}
        <Card className="relative bg-white border-2 border-gray-200 w-full md:max-w-[334px] shadow-[0px_4px_12px_0px_#0000001A]">
          <CardHeader className="text-start pb-8">
            <CardTitle className="text-xl font-semibold text-primary mb-2">Plan Personal</CardTitle>
            <div className="flex items-baseline justify-start">
              <span className="text-4xl font-bold text-primary">{price}</span>
              <span className="text-gray-500 ml-1">/mes</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isSubscribed}
              onClick={handlePersonalClick}
            >
              {personalButtonLabel}
            </Button>
            <div className="space-y-3">
              {personalFeatures.map((f, i) => <FeatureItem key={i} included={f.included} name={f.name} />)}
            </div>
          </CardContent>
        </Card>

        {/* Plan Empresarial */}
        <Card className="relative bg-primary border-2 w-full border-black/20 md:max-w-[334px] shadow-[0px_4px_12px_0px_#0000001A]">
          <CardHeader className="text-start pb-8">
            <CardTitle className="text-xl font-semibold text-white mb-2">Plan Empresarial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CompanyContactModal
              trigger={
                <Button className="w-full bg-white hover:bg-white/80 text-slate-900">Contáctanos</Button>
              }
            />
            <div className="space-y-3">
              {empresarialFeatures.map((f, i) => <FeatureItem key={i} included={f.included} name={f.name} dark />)}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
