"use client";

import { getCheckoutConfig } from "@/actions/subscription/checkout-config";
import { trackEvent } from "@/lib/analytics";
import { USD_ANNUAL_PRICE, USD_MONTHLY_PRICE } from "@/lib/pricing";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type CheckoutPlan = "monthly" | "annual";

const SUCCESS_URL = "https://www.bibliotecalegalhn.com/subscriptions/success";

export function usePaddleCheckout() {
  const router = useRouter();
  const paddleRef = useRef<Paddle | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const configRef = useRef<Awaited<ReturnType<typeof getCheckoutConfig>> | null>(
    null
  );

  const ensureConfig = useCallback(async () => {
    if (configRef.current?.paddleToken) return configRef.current;
    const config = await getCheckoutConfig();
    configRef.current = config;
    return config;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await ensureConfig();
      if (cancelled || !config.paddleToken) return;
      try {
        const paddle = await initializePaddle({
          environment: "production",
          token: config.paddleToken,
        });
        if (cancelled || !paddle) return;
        paddleRef.current = paddle;
        setReady(true);
      } catch (err) {
        console.error("Paddle initialization error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureConfig]);

  const openCheckout = useCallback(
    async (plan: CheckoutPlan = "monthly") => {
      setLoading(true);
      try {
        const config = await ensureConfig();

        if (!config.isLoggedin) {
          router.push("/sign-up?intent=subscribe");
          return;
        }
        if (config.isSubscribed) {
          toast.info("Ya tienes una suscripción activa.");
          return;
        }

        const priceId =
          plan === "annual" ? config.annualPriceId : config.monthlyPriceId;

        if (!priceId) {
          toast.error(
            plan === "annual"
              ? "El plan anual no está configurado aún. Elige el plan mensual o contactanos."
              : "No se pudo iniciar el pago. Intenta de nuevo."
          );
          return;
        }

        if (!paddleRef.current) {
          if (!config.paddleToken) {
            toast.error("Pagos no disponibles en este momento.");
            return;
          }
          const paddle = await initializePaddle({
            environment: "production",
            token: config.paddleToken,
          });
          if (!paddle) {
            toast.error("No se pudo cargar el checkout.");
            return;
          }
          paddleRef.current = paddle;
          setReady(true);
        }

        trackEvent("begin_checkout", {
          plan,
          currency: "USD",
          value: plan === "annual" ? USD_ANNUAL_PRICE : USD_MONTHLY_PRICE,
        });

        paddleRef.current.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: config.paddleCustomerId
            ? { id: config.paddleCustomerId }
            : undefined,
          customData: { userId: config.userId, plan },
          settings: {
            successUrl: SUCCESS_URL,
          },
        });
      } catch (err) {
        console.error("Checkout error:", err);
        toast.error("No se pudo abrir el checkout.");
      } finally {
        setLoading(false);
      }
    },
    [ensureConfig, router]
  );

  return { openCheckout, ready, loading };
}
