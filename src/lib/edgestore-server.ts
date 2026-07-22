import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import { initEdgeStoreClient } from "@edgestore/server/core";

const es = initEdgeStore.create();

/**
 * This is the main router for the EdgeStore buckets.
 */
const edgeStoreRouter = es.router({
  publicFiles: es.fileBucket(),
});

export const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

/**
 * Backend client used to interact with EdgeStore directly from server code
 * (ej. borrar el PDF temporal que sube el modal "Generar con IA" en
 * /dashboard/legal-updates una vez que ya se le extrajo el texto). La
 * biblioteca de Gacetas (/dashboard/gacetas) ya NO usa EdgeStore — esos PDFs
 * se guardan directo en Neon (Postgres) para no toparse con el límite de
 * storage de EdgeStore.
 */
export const backendClient = initEdgeStoreClient({
  router: edgeStoreRouter,
});

/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;
