"use client";

import {
  DEMO_DOCUMENT_SLUG,
  GUEST_TOUR_EVENT,
} from "@/lib/guest-tour";
import {
  bindSketchArrowToTour,
  shepherdTourOptions,
} from "@/lib/tour-ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function tipText(body: string) {
  return `<span class="blhn-tip-kicker">Recorrido</span><p>${body}</p>`;
}

function waitForElement(
  selector: string,
  timeout = 10000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const start = Date.now();
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      } else if (Date.now() - start > timeout) {
        observer.disconnect();
        resolve(null);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
}

async function goTo(
  router: ReturnType<typeof useRouter>,
  path: string,
  selector: string
) {
  router.push(path);
  await waitForElement(selector);
  await new Promise((r) => setTimeout(r, 450));
}

export default function GuestTour() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tourRef = useRef<any>(null);
  const runningRef = useRef(false);
  const autoStartedRef = useRef(false);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const startTour = async () => {
      if (runningRef.current) return;
      runningRef.current = true;

      if (tourRef.current) {
        try {
          tourRef.current.cancel();
        } catch {
          /* ignore */
        }
        tourRef.current = null;
      }

      const Shepherd = (await import("shepherd.js")).default;
      const nav = routerRef.current;

      const tour = new Shepherd.Tour(shepherdTourOptions);

      tourRef.current = tour;
      const clearArrow = bindSketchArrowToTour(tour);

      const finish = () => {
        runningRef.current = false;
        tourRef.current = null;
        clearArrow();
        if (new URL(window.location.href).searchParams.get("tour") === "guest") {
          const url = new URL(window.location.href);
          url.searchParams.delete("tour");
          const search = url.searchParams.toString();
          nav.replace(url.pathname + (search ? `?${search}` : ""));
        }
      };

      tour.on("complete", finish);
      tour.on("cancel", finish);

      const nextBtn = {
        text: "Siguiente",
        classes: "blhn-btn-primary",
        action() {
          tour.next();
        },
      };
      const backBtn = {
        text: "Anterior",
        classes: "blhn-btn-secondary",
        action() {
          tour.back();
        },
      };

      tour.addStep({
        id: "welcome",
        title: "Bienvenido a Biblioteca Legal HN",
        text: tipText("Te mostramos todo lo que puedes hacer aquí: leer leyes gratis, buscar artículos, usar IA y, si te suscribes, resaltar, guardar y anotar. Puedes cerrar el tour cuando quieras."),
        buttons: [
          {
            text: "Comenzar",
            classes: "blhn-btn-primary",
            async action() {
              if (window.location.pathname !== "/") {
                await goTo(nav, "/", "#tour-global-search");
              }
              document
                .querySelector("#tour-global-search")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
              await waitForElement("#tour-global-search");
              await new Promise((r) => setTimeout(r, 400));
              tour.next();
            },
          },
        ],
      });

      tour.addStep({
        id: "global-search",
        title: "Buscador de artículos",
        text: tipText("Busca en toda la legislación por número de artículo, nombre de la ley o en lenguaje natural. La IA te ayuda a encontrar el texto relevante. Disponible sin cuenta."),
        attachTo: { element: "#tour-global-search", on: "top" },
        buttons: [
          backBtn,
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            async action() {
              await waitForElement("#tour-global-chat");
              document
                .querySelector("#tour-global-chat")
                ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              await new Promise((r) => setTimeout(r, 300));
              tour.next();
            },
          },
        ],
      });

      tour.addStep({
        id: "global-chat",
        title: "Chat IA global",
        text: tipText("Pregunta sobre cualquier ley hondureña. Con cuenta gratis tienes 10 consultas de IA; con el Plan Personal son ilimitadas y puedes adjuntar archivos."),
        attachTo: { element: "#tour-global-chat", on: "left" },
        buttons: [
          backBtn,
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            async action() {
              await goTo(nav, "/collections", "#tour-collections-grid");
              tour.next();
            },
          },
        ],
      });

      tour.addStep({
        id: "collections",
        title: "Colección de leyes",
        text: tipText("Aquí está la biblioteca completa: códigos, leyes y reglamentos de Honduras. Puedes leer el texto completo gratis, sin crear cuenta."),
        attachTo: { element: "#tour-collections-grid", on: "top" },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            async action() {
              await goTo(nav, "/", "#tour-global-chat");
              tour.back();
            },
          },
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            async action() {
              await goTo(
                nav,
                `/collections/${DEMO_DOCUMENT_SLUG}`,
                "#tour-article-tools"
              );
              tour.next();
            },
          },
        ],
      });

      tour.addStep({
        id: "article-tools",
        title: "Resalta, guarda o comenta",
        text: tipText("En cada artículo puedes resaltar con color, guardar un marcador o dejar una nota privada. Es del Plan Personal. Con cuenta, todo queda en Mi Biblioteca."),
        attachTo: { element: "#tour-article-tools", on: "bottom" },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            async action() {
              await goTo(nav, "/collections", "#tour-collections-grid");
              tour.back();
            },
          },
          nextBtn,
        ],
      });

      tour.addStep({
        id: "ai-summary",
        title: "Resumen en lenguaje claro",
        text: tipText("Cada artículo puede incluir un resumen IA que explica el texto sin jerga. Los primeros 20 artículos de cada documento son gratis; con el plan ves todos."),
        attachTo: { element: "#tour-ai-summary", on: "bottom" },
        beforeShowPromise: async () => {
          const el = await waitForElement("#tour-ai-summary", 4000);
          if (!el) {
            // Primer artículo sin resumen: saltar este paso
            setTimeout(() => {
              if (tour.isActive()) tour.next();
            }, 0);
          }
        },
        buttons: [backBtn, nextBtn],
      });

      tour.addStep({
        id: "doc-chatbot",
        title: "Asistente de este documento",
        text: tipText("Haz preguntas solo sobre esta ley. El asistente responde con base en sus artículos. Ideal para estudiar o preparar un caso."),
        attachTo: { element: "#tour-chatbot", on: "top" },
        buttons: [
          backBtn,
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            async action() {
              await goTo(
                nav,
                "/actualizaciones",
                "#tour-actualizaciones-page"
              );
              tour.next();
            },
          },
        ],
      });

      tour.addStep({
        id: "actualizaciones",
        title: "Actualizaciones legales",
        text: tipText("Reformas, leyes nuevas y derogaciones explicadas en lenguaje claro, con enlace a La Gaceta. Así te enteras de cambios sin leer el PDF completo."),
        attachTo: { element: "#tour-actualizaciones-page", on: "top" },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            async action() {
              await goTo(
                nav,
                `/collections/${DEMO_DOCUMENT_SLUG}`,
                "#tour-chatbot"
              );
              tour.back();
            },
          },
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            async action() {
              await goTo(nav, "/gacetas", "#tour-gacetas-page");
              tour.next();
            },
          },
        ],
      });

      tour.addStep({
        id: "gacetas",
        title: "Gacetas oficiales",
        text: tipText("Consulta las Gacetas Oficiales publicadas. Complementa las actualizaciones cuando necesitas el documento oficial."),
        attachTo: { element: "#tour-gacetas-page", on: "top" },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            async action() {
              await goTo(
                nav,
                "/actualizaciones",
                "#tour-actualizaciones-page"
              );
              tour.back();
            },
          },
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            async action() {
              await goTo(nav, "/guias", "#tour-guias-page");
              tour.next();
            },
          },
        ],
      });

      tour.addStep({
        id: "guias",
        title: "Guías prácticas",
        text: tipText("Guías que explican temas legales de forma práctica: ideales para estudiantes, ciudadanos y profesionales que quieren orientación clara."),
        attachTo: { element: "#tour-guias-page", on: "top" },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            async action() {
              await goTo(nav, "/gacetas", "#tour-gacetas-page");
              tour.back();
            },
          },
          {
            text: "Siguiente",
            classes: "blhn-btn-primary",
            async action() {
              await goTo(nav, "/subscriptions", "#tour-subscriptions-page");
              tour.next();
            },
          },
        ],
      });

      tour.addStep({
        id: "subscriptions",
        title: "Gratis vs Plan Personal",
        text: tipText("Gratis: leer leyes, buscar, 20 resúmenes IA por documento y 10 chats. Plan Personal: resúmenes ilimitados, chat ilimitado, resaltar/guardar/notas y sin anuncios."),
        attachTo: { element: "#tour-subscriptions-page", on: "top" },
        buttons: [
          {
            text: "Anterior",
            classes: "blhn-btn-secondary",
            async action() {
              await goTo(nav, "/guias", "#tour-guias-page");
              tour.back();
            },
          },
          nextBtn,
        ],
      });

      tour.addStep({
        id: "finish",
        title: "Crea tu cuenta gratis",
        text: tipText("Con una cuenta usas el cupo de IA, guardas documentos y, si te suscribes, desbloqueas resaltar, marcadores y notas en Mi Biblioteca. ¿Listo para empezar?"),
        buttons: [
          backBtn,
          {
            text: "Crear cuenta",
            classes: "blhn-btn-primary",
            action() {
              tour.complete();
              nav.push("/sign-up");
            },
          },
          {
            text: "Cerrar",
            classes: "blhn-btn-secondary",
            action() {
              tour.complete();
            },
          },
        ],
      });

      if (window.location.pathname !== "/") {
        await goTo(nav, "/", "#tour-global-search");
      }

      tour.start();
    };

    const onEvent = () => {
      void startTour();
    };

    window.addEventListener(GUEST_TOUR_EVENT, onEvent);

    if (
      !autoStartedRef.current &&
      searchParams.get("tour") === "guest"
    ) {
      autoStartedRef.current = true;
      void startTour();
    }

    return () => {
      window.removeEventListener(GUEST_TOUR_EVENT, onEvent);
    };
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (tourRef.current) {
        try {
          tourRef.current.cancel();
        } catch {
          /* ignore */
        }
        tourRef.current = null;
      }
      runningRef.current = false;
    };
  }, []);

  return null;
}
