"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  onboardingCompleted: boolean;
  isLoggedin: boolean;
}

const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Bienvenido a Biblioteca Legal HN",
    text: "Te mostramos todo lo que tienes disponible en la plataforma. Este tour dura menos de 2 minutos.",
    attachTo: null,
  },
  {
    id: "nav-collections",
    title: "Colección de documentos",
    text: "Aquí encuentras todas las leyes, códigos y reglamentos de Honduras organizados por categoría.",
    attachTo: { element: "#tour-collections", on: "bottom" as const },
  },
  {
    id: "nav-subscriptions",
    title: "Planes y precios",
    text: "Consulta los planes disponibles para desbloquear todas las funciones premium de la plataforma.",
    attachTo: { element: "#tour-subscriptions", on: "bottom" as const },
  },
  {
    id: "article-tools",
    title: "Resalta y marca artículos",
    text: "Como suscriptor puedes resaltar artículos con colores, guardarlos con marcadores y agregar notas privadas.",
    attachTo: { element: "#tour-article-tools", on: "bottom" as const },
  },
  {
    id: "ai-summary",
    title: "Resumen IA por artículo",
    text: "Cada artículo tiene un resumen generado por inteligencia artificial que explica su contenido en lenguaje claro. Exclusivo para suscriptores.",
    attachTo: { element: "#tour-ai-summary", on: "bottom" as const },
  },
  {
    id: "chatbot",
    title: "Asistente legal IA",
    text: "Haz preguntas sobre el documento y obtén respuestas basadas en sus artículos. Hasta 20 consultas diarias para suscriptores.",
    attachTo: { element: "#tour-chatbot", on: "top" as const },
  },
  {
    id: "profile",
    title: "Tu cuenta",
    text: "Gestiona tu perfil, suscripción y preferencias desde aquí.",
    attachTo: { element: "#tour-profile", on: "bottom" as const },
  },
  {
    id: "finish",
    title: "Listo para comenzar",
    text: "Ya conoces todo lo que ofrece Biblioteca Legal HN. Suscríbete para desbloquear los resúmenes IA, el asistente legal y más herramientas.",
    attachTo: null,
  },
];

export default function OnboardingTour({ onboardingCompleted, isLoggedin }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourRef = useRef<any>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedin) return;

    const forceStart = searchParams.get("tour") === "1";
    const shouldStart = forceStart || !onboardingCompleted;
    if (!shouldStart) return;
    if (startedRef.current) return;

    let cancelled = false;

    const initTour = async () => {
      const Shepherd = (await import("shepherd.js")).default;
      await import("shepherd.js/dist/css/shepherd.css");

      if (cancelled) return;
      startedRef.current = true;

      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          scrollTo: { behavior: "smooth", block: "center" },
          classes: "blhn-tour-step",
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 8,
        },
      });

      tourRef.current = tour;

      const markCompleted = async () => {
        try {
          await fetch("/api/users/onboarding", { method: "POST" });
        } catch {}
        if (forceStart) {
          const url = new URL(window.location.href);
          url.searchParams.delete("tour");
          router.replace(url.pathname + (url.search !== "?" ? url.search : ""));
        }
      };

      tour.on("complete", markCompleted);
      tour.on("cancel", markCompleted);

      TOUR_STEPS.forEach((step, index) => {
        const isFirst = index === 0;
        const isLast = index === TOUR_STEPS.length - 1;

        const buttons = [];

        if (!isFirst) {
          buttons.push({
            text: "Anterior",
            classes: "blhn-btn-secondary",
            action() {
              tour.back();
            },
          });
        }

        if (isLast) {
          buttons.push({
            text: "Ver planes",
            classes: "blhn-btn-primary",
            action() {
              tour.complete();
              router.push("/subscriptions");
            },
          });
          buttons.push({
            text: "Continuar gratis",
            classes: "blhn-btn-secondary",
            action() {
              tour.complete();
            },
          });
        } else {
          buttons.push({
            text: isFirst ? "Comenzar tour" : "Siguiente",
            classes: "blhn-btn-primary",
            action() {
              tour.next();
            },
          });
        }

        tour.addStep({
          id: step.id,
          title: step.title,
          text: step.text,
          attachTo: step.attachTo ?? undefined,
          buttons,
          when: step.attachTo
            ? {
                show() {
                  const el = document.querySelector(step.attachTo!.element);
                  if (!el) tour.next();
                },
              }
            : undefined,
        });
      });

      tour.start();
    };

    initTour();

    return () => {
      cancelled = true;
      if (tourRef.current) {
        tourRef.current.complete();
        tourRef.current = null;
        startedRef.current = false;
      }
    };
  }, [isLoggedin, onboardingCompleted, searchParams]);

  return null;
}
