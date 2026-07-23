import HeaderSection from "@/components/shared/sections/header";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import { buildSeoTitle, buildSeoDescription, SITE_OG_IMAGE } from "@/lib/seo";
import GacetasPublicList from "./_components/GacetasPublicList";

export const dynamic = "force-dynamic";

const TITLE = buildSeoTitle("Gacetas Oficiales de Honduras");
const DESCRIPTION = buildSeoDescription(
  "Consulta y descarga los PDFs oficiales de La Gaceta de la República de Honduras, organizados por número de publicación."
);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "La Gaceta Honduras",
    "Gaceta oficial Honduras",
    "diario oficial Honduras",
    "decretos Honduras PDF",
    "publicaciones legales Honduras",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.bibliotecalegalhn.com/gacetas",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/gacetas",
  },
};

const Page = async () => {
  // Solo se muestran las Gacetas que de verdad tienen el PDF guardado
  // (fileAvailable: true). Las que se procesaron ANTES de este cambio ya
  // perdieron su PDF (se borraba tras procesar para ahorrar espacio) y no
  // aparecen aquí hasta que se vuelvan a subir.
  const gacetas = await prisma.gaceta.findMany({
    where: { fileAvailable: true },
    orderBy: { uploadedAt: "desc" },
    select: { id: true, number: true, uploadedAt: true },
  });

  return (
    <div>
      <HeaderSection
        imageUrl="https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/86f8cacd-d2d6-42df-a1bd-569b2c5e047c.webp"
        title="Gacetas Oficiales"
        description="Consulta y descarga los PDFs originales de La Gaceta de la República de Honduras"
      />
      <GacetasPublicList
        gacetas={gacetas.map((g) => ({
          id: g.id,
          number: g.number,
          uploadedAt: g.uploadedAt.toISOString(),
        }))}
      />
    </div>
  );
};

export default Page;
