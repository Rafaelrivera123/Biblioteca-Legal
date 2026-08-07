"use client";

import { DEMO_DOCUMENT_SLUG } from "@/lib/guest-tour";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ARROW_WEIGHTS,
  ArrowThumb,
  DEFAULT_TIP_SIZE,
  FreePositionStage,
  LabSavePanel,
  LabShell,
  PhaseBadge,
  labPageUrl,
  loadLabLayouts,
  scrollIframeToSelector,
  snapToIframeSelector,
  type ArrowWeightId,
  type LabLayoutEntry,
  type Pt,
  type TipSize,
} from "../_components/lab-shared";

type TipSceneId =
  | "home-chat"
  | "home-search"
  | "collections"
  | "article-tools"
  | "ai-summary"
  | "doc-chat"
  | "mi-biblioteca";

const DOC = `/collections/${DEMO_DOCUMENT_SLUG}`;

const SCENES: {
  id: TipSceneId;
  label: string;
  tipTitle: string;
  tipBody: string;
  path: string;
  target: string;
  defaultTip: Pt;
  defaultBase: Pt;
  defaultMid: Pt;
  defaultPin: Pt;
}[] = [
  {
    id: "home-chat",
    label: "Home · Chat IA",
    tipTitle: "Chat IA global",
    tipBody:
      "Pregunta sobre cualquier ley hondureña. Con la cuenta gratis tienes 10 consultas.",
    path: "/",
    target: "#tour-global-chat",
    defaultTip: { x: 55, y: 32 },
    defaultBase: { x: 62, y: 36 },
    defaultMid: { x: 75, y: 26 },
    defaultPin: { x: 88, y: 55 },
  },
  {
    id: "home-search",
    label: "Home · Buscador",
    tipTitle: "Buscador de artículos",
    tipBody:
      "Busca por número de artículo, nombre de la ley o en lenguaje natural.",
    path: "/",
    target: "#tour-global-search",
    defaultTip: { x: 22, y: 38 },
    defaultBase: { x: 28, y: 42 },
    defaultMid: { x: 38, y: 30 },
    defaultPin: { x: 50, y: 48 },
  },
  {
    id: "collections",
    label: "Colección",
    tipTitle: "Colección de leyes",
    tipBody:
      "Aquí están todas las leyes. Abre un documento para leer y usar el asistente.",
    path: "/collections",
    target: "#tour-collections-tip-target",
    defaultTip: { x: 50, y: 28 },
    defaultBase: { x: 42, y: 32 },
    defaultMid: { x: 32, y: 28 },
    defaultPin: { x: 22, y: 48 },
  },
  {
    id: "article-tools",
    label: "Doc · Artículo 1",
    tipTitle: "Resalta, guarda o comenta",
    tipBody:
      "En cada artículo puedes resaltar, guardar o dejar notas (Plan Personal).",
    path: DOC,
    target: "#tour-article-tools",
    defaultTip: { x: 18, y: 35 },
    defaultBase: { x: 22, y: 38 },
    defaultMid: { x: 26, y: 28 },
    defaultPin: { x: 32, y: 40 },
  },
  {
    id: "ai-summary",
    label: "Doc · Resumen",
    tipTitle: "Resumen en lenguaje claro",
    tipBody: "Los primeros 20 artículos tienen resumen IA gratis.",
    path: DOC,
    target: "#tour-ai-summary",
    defaultTip: { x: 18, y: 32 },
    defaultBase: { x: 24, y: 34 },
    defaultMid: { x: 32, y: 26 },
    defaultPin: { x: 42, y: 40 },
  },
  {
    id: "doc-chat",
    label: "Doc · Chat",
    tipTitle: "Asistente de este documento",
    tipBody: "Haz preguntas solo sobre esta ley.",
    path: DOC,
    target: "#tour-chatbot",
    defaultTip: { x: 55, y: 40 },
    defaultBase: { x: 65, y: 48 },
    defaultMid: { x: 78, y: 40 },
    defaultPin: { x: 90, y: 72 },
  },
  {
    id: "mi-biblioteca",
    label: "Mi Biblioteca",
    tipTitle: "Tu biblioteca personal",
    tipBody:
      "Aquí viven tus documentos guardados, marcadores, destacados y notas.",
    path: "/mi-biblioteca",
    target: "#tour-mi-biblioteca-tabs",
    defaultTip: { x: 50, y: 28 },
    defaultBase: { x: 42, y: 26 },
    defaultMid: { x: 38, y: 18 },
    defaultPin: { x: 35, y: 22 },
  },
];

export default function TipsLabClient() {
  const [sceneId, setSceneId] = useState<TipSceneId>("home-search");
  const scene = SCENES.find((s) => s.id === sceneId)!;
  const [tipPos, setTipPos] = useState<Pt>(scene.defaultTip);
  const [tipSize, setTipSize] = useState<TipSize>(DEFAULT_TIP_SIZE);
  const [basePos, setBasePos] = useState<Pt>(scene.defaultBase);
  const [midPos, setMidPos] = useState<Pt>(scene.defaultMid);
  const [pinPos, setPinPos] = useState<Pt>(scene.defaultPin);
  const [weight, setWeight] = useState<ArrowWeightId>("md");
  const [showArrow, setShowArrow] = useState(true);
  const [tipOn, setTipOn] = useState(false);
  const [layouts, setLayouts] = useState<Record<string, LabLayoutEntry>>({});
  const [skipSnap, setSkipSnap] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayQuery = () =>
    iframeRef.current?.parentElement?.querySelector<HTMLElement>(
      ".pointer-events-none.absolute"
    ) ?? null;

  useEffect(() => {
    setLayouts(loadLabLayouts("tips"));
  }, []);

  useEffect(() => {
    setTipOn(false);
  }, [sceneId]);

  useEffect(() => {
    const saved = layouts[scene.id];
    if (saved) {
      setTipPos(saved.tip);
      setTipSize(saved.tipSize);
      setBasePos(saved.base);
      setMidPos(saved.mid);
      setPinPos(saved.pin);
      if (saved.flecha === "ninguna") {
        setShowArrow(false);
      } else {
        setShowArrow(true);
        setWeight(saved.flecha);
      }
      setSkipSnap(true);
    } else {
      setTipPos(scene.defaultTip);
      setTipSize(DEFAULT_TIP_SIZE);
      setBasePos(scene.defaultBase);
      setMidPos(scene.defaultMid);
      setPinPos(scene.defaultPin);
      setShowArrow(true);
      setSkipSnap(false);
    }
  }, [scene, layouts]);

  useEffect(() => {
    if (!tipOn || skipSnap) return;
    const snapped = snapToIframeSelector(
      iframeRef,
      overlayQuery(),
      scene.target
    );
    if (snapped) setPinPos(snapped);
  }, [tipOn, sceneId, scene.target, skipSnap]);

  const showTipHere = () => setTipOn(true);

  return (
    <LabShell
      title="Tips (logueado) · editable"
      subtitle="Scroll libre. Cuando quieras colocar el tip, pulsa «Mostrar tip aquí»."
      nav={
        <div className="flex gap-2 text-sm">
          <Link className="rounded-lg border bg-white px-3 py-1.5" href="/dev/tour-lab">
            Tour
          </Link>
          <Link className="rounded-lg bg-[#1E2A38] px-3 py-1.5 text-white" href="/dev/tips-lab">
            Tips
          </Link>
          <Link className="rounded-lg border bg-white px-3 py-1.5" href="/dev">
            Índice
          </Link>
        </div>
      }
    >
      <div className="mx-auto grid max-w-[1800px] gap-3 p-3 lg:grid-cols-[170px_minmax(0,1fr)_210px]">
        <aside className="max-h-[calc(100vh-7.5rem)] space-y-1.5 overflow-y-auto rounded-xl border border-black/10 bg-[#fbfaf7] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6d12]">
            Tip
          </p>
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSceneId(s.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                sceneId === s.id ? "bg-[#1E2A38] text-white" : "bg-white hover:bg-black/5"
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void scrollIframeToSelector(iframeRef, scene.target)}
            className="mt-3 w-full rounded-lg border bg-white px-3 py-2 text-sm"
          >
            Ir al target (solo scroll)
          </button>
          <button
            type="button"
            onClick={showTipHere}
            className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white"
          >
            {tipOn ? "Tip ya visible" : "Mostrar tip aquí"}
          </button>
          {tipOn && (
            <button
              type="button"
              onClick={() => setTipOn(false)}
              className="w-full rounded-lg border border-[#1E2A38] px-3 py-2 text-sm font-medium"
            >
              Ocultar tip (seguir scrolleando)
            </button>
          )}
          <div className="pt-2">
            <PhaseBadge tipOn={tipOn} />
          </div>
          <p className="pt-2 text-[10px] leading-relaxed text-[#6b7280]">
            {scene.path} → {scene.target}
          </p>
        </aside>

        <FreePositionStage
          iframeRef={iframeRef}
          pageSrc={labPageUrl(scene.path)}
          tipPos={tipPos}
          setTipPos={setTipPos}
          tipSize={tipSize}
          setTipSize={setTipSize}
          basePos={basePos}
          setBasePos={setBasePos}
          midPos={midPos}
          setMidPos={setMidPos}
          pinPos={pinPos}
          setPinPos={setPinPos}
          weight={weight}
          showArrow={showArrow}
          popupVisible={tipOn}
          tipTitle={scene.tipTitle}
          tipBody={scene.tipBody}
          tipKicker="Guía rápida"
        />

        <aside className="max-h-[calc(100vh-7.5rem)] space-y-3 overflow-y-auto rounded-xl border border-black/10 bg-[#fbfaf7] p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArrow}
              onChange={(e) => setShowArrow(e.target.checked)}
            />
            Mostrar flecha
          </label>
          <button
            type="button"
            className="w-full rounded-lg border bg-white px-3 py-2 text-left text-xs"
            onClick={() => {
              const snapped = snapToIframeSelector(
                iframeRef,
                overlayQuery(),
                scene.target
              );
              if (snapped) setPinPos(snapped);
            }}
          >
            Snap Fin → target
          </button>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8a6d12]">
              Grosor de flecha
            </p>
            <div className="space-y-1">
              {ARROW_WEIGHTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setWeight(a.id)}
                  className={`w-full rounded-lg border px-2 py-1 text-left ${
                    weight === a.id ? "border-black bg-white" : "border-transparent bg-white/70"
                  }`}
                >
                  <p className="text-xs font-semibold">{a.label}</p>
                  <ArrowThumb id={a.id} />
                </button>
              ))}
            </div>
          </div>
          <LabSavePanel
            lab="tips"
            stepId={scene.id}
            stepLabel={scene.label}
            tipPos={tipPos}
            tipSize={tipSize}
            basePos={basePos}
            midPos={midPos}
            pinPos={pinPos}
            flecha={showArrow ? weight : "ninguna"}
            layouts={layouts}
            onLayoutsChange={setLayouts}
          />
        </aside>
      </div>
    </LabShell>
  );
}
