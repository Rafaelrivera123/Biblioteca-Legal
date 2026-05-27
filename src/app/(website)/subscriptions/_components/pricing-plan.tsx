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
  paddleToken: string;
  priceId: string;
}

export default function PricingComparison({
  subscription,
  price,
  isLoggedin,
  paddleCustomerId,
  paddleToken,
  priceId,
}: Props) {
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    console.log("Token received:", paddleToken);
    console.log("Price ID received:", priceId);
    if (!paddleToken) {
      console.error("Paddle token is empty");
      return;
    }
    initializePaddle({
      environment: "production",
      token: paddleToken,
    })
      .then((p) => {
        console.log("Paddle initialized successfully:", p);
        setPaddle(p);
      })
      .catch((err) => {
        console.error("Paddle initialization error:", err);
      });
  }, [paddleToken]);

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
  const isSubscribed =
    subscription?.isActive && new Date(subscription.currentPeriodEnd) > now;

  const handlePersonalClick = () => {
    if (!isLoggedin) {
      router.push("/sign-up");
      return;
    }
    if (isSubscribed) return;
    if (!paddle) {
      console.error("Paddle not initialized yet");
      return;
    }
    paddle.Checkout.open({
      items: [{ priceId: priceId, quantity: 1 }],
      customer: paddleCustomerId ? { id: paddleCustomerId } : undefined,
      settings: {
        successUrl: `https://www.bibliotecalegalhn.com/collections`,
      },
    });
  };

  const personalButtonLabel = !isLoggedin
    ? "Comenzar"
    : isSubscribed
      ? "Suscrito"
      : !paddle
        ? "Loading..."
        : "Suscribirse";

  const FeatureItem = ({
    included,
    name,
    dark = false,
  }: {
    included: boolean;
    name: string;
    dark?: boolean;
  }) => (
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
        }`
