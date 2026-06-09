"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  onboardingCompleted: boolean;
  isLoggedin: boolean;
}

const DEMO_DOCUMENT_SLUG = "codigo-civil-honduras";

function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

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
      tour.on("complete", markCompleted);
      tour.on("cancel", markCompleted);

      // Paso 1 - Bienvenida
      tour.addStep({
        id: "welcome",
        title: "Bienvenido a Biblioteca Legal HN",
        text: "Te mostramos todo lo que tienes disponible en la plataforma. Este tour dura menos de 2 minutos.",
        buttons: [
          {
            text: "Comenzar tour",
            classes: "blhn-btn-primary",
            action() {
              router.push("/collections");
              tour.next();
            },
          },
        ],
      });

      // Paso 2 - Colección
      tour.addStep({
        id: "collections",
        title: "Colección de documentos",
        text: "Aquí encuentras todas las leyes, códigos y reglamentos de Honduras organizados por categoría. Haz clic en cualquier documento para leerlo.",
        attachTo: { element: "#tour-collections-grid", on: "bottom" },
        when: {
          async show() {
            const el = await waitForElement("#tour-collections-grid");
            if (!el) tour.next();
          },
        },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            action() { tour.back(); },
          },
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            action() {
              router.push(`/collections/${DEMO_DOCUMENT_SLUG}`);
              tour.next();
            },
          },
        ],
      });

      // Paso 3 - Artículo
      tour.addStep({
        id: "article-tools",
        title: "Interactúa con los artículos",
        text: "Haz clic en el botón de cualquier artículo para resaltarlo con colores, guardarlo con un marcador o agregar una nota privada. Disponible para suscriptores.",
        attachTo: { element: "#tour-article-tools", on: "bottom" },
        when: {
          async show() {
            const el = await waitForElement("#tour-article-tools");
            if (!el) tour.next();
          },
        },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            action() {
              router.push("/collections");
              tour.back();
            },
          },
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            action() { tour.next(); },
          },
        ],
      });

      // Paso 4 - Resumen IA
      tour.addStep({
        id: "ai-summary",
        title: "Resumen IA por artículo",
        text: "Cada artículo tiene un resumen generado por inteligencia artificial que explica su contenido en lenguaje claro. Exclusivo para suscriptores.",
        attachTo: { element: "#tour-ai-summary", on: "bottom" },
        when: {
          async show() {
            const el = await waitForElement("#tour-ai-summary");
            if (!el) tour.next();
          },
        },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            action() { tour.back(); },
          },
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            action() { tour.next(); },
          },
        ],
      });

      // Paso 5 - Chatbot
      tour.addStep({
        id: "chatbot",
        title: "Asistente legal IA",
        text: "Haz preguntas sobre el documento y obtén respuestas basadas en sus artículos. Hasta 20 consultas diarias para suscriptores.",
        attachTo: { element: "#tour-chatbot", on: "top" },
        when: {
          async show() {
            const el = await waitForElement("#tour-chatbot");
            if (!el) tour.next();
          },
        },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            action() { tour.back(); },
          },
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            action() {
              router.push("/subscriptions");
              tour.next();
            },
          },
        ],
      });

      // Paso 6 - Suscripciones
      tour.addStep({
        id: "finish",
        title: "Desbloquea todo el potencial",
        text: "Suscríbete para acceder a los resúmenes IA, el asistente legal, resaltado de artículos, marcadores y notas privadas.",
        attachTo: { element: "#tour-subscriptions", on: "bottom" },
        when: {
          async show() {
            const el = await waitForElement("#tour-subscriptions");
            if (!el) {
              // si no encuentra el elemento en navbar igual muestra el paso centrado
            }
          },
        },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            action() {
              router.push(`/collections/${DEMO_DOCUMENT_SLUG}`);
              tour.back();
            },
          },
          {
            text: "Ver planes",
            classes: "blhn-btn-primary",
            action() { tour.complete(); },
          },
          {
            text: "Cerrar",
            classes: "blhn-btn-secondary",
            action() { tour.complete(); },
          },
        ],
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
