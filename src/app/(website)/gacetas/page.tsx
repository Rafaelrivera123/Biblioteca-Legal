import { prisma } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import HeaderSection from "@/components/shared/sections/header";
import GacetasPublicList from "./_components/GacetasPublicList";
import { buildSeoDescription, buildSeoTitle } from "@/lib/seo";

export const revalidate = 3600;

const BASE_URL = "https://www.bibliotecalegalhn.com";

export const metadata: Metadata = {
  title: buildSeoTitle("Gacetas Oficiales de Honduras"),
  description: buildSeoDescription(
    "Listado de ediciones de La Gaceta de Honduras que hemos revisado, con las reformas, nuevas leyes y derogaciones que contiene cada una."
  ),
  keywords: [
    "La Gaceta Honduras",
    "Gaceta oficial Honduras",
    "diario oficial Honduras",
    "decretos Honduras",
    "publicaciones legales Honduras",
    "Biblioteca Legal HN",
  ],
  openGraph: {
    title: buildSeoTitle("Gacetas Oficiales de Honduras"),
    description:
      "Listado de ediciones de La Gaceta de Honduras, con las reformas y leyes que contiene cada una.",
    url: `${BASE_URL}/gacetas`,
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: `${BASE_URL}/gacetas`,
  },
};

const TYPE_LABEL: Record<string, string> = {
  REFORM: "Reforma",
  NEW_LAW: "Nueva Ley",
  REPEAL: "Derogación",
};

async function getGacetasWithContext() {
  const gacetas = await prisma.gaceta.findMany({
    where: { status: "processed" },
    orderBy: { number: "desc" },
    select: {
      id: true,
      number: true,
      uploadedAt: true,
      fileAvailable: true,
    },
  });

  const numbers = gacetas.map((g) => g.number);

  const updates = numbers.length
    ? await prisma.legalUpdatePost.findMany({
        where: { status: "published", gacetaNumber: { in: numbers } },
        select: {
          slug: true,
          title: true,
          type: true,
          gacetaNumber: true,
          relatedDocument: { select: { name: true } },
        },
      })
    : [];

  const updatesByGaceta = new Map<string, typeof updates>();
  updates.forEach((u) => {
    if (!u.gacetaNumber) return;
    const list = updatesByGaceta.get(u.gacetaNumber) ?? [];
    list.push(u);
    updatesByGaceta.set(u.gacetaNumber, list);
  });

  return { gacetas, updatesByGaceta };
}

const GacetasPage = async () => {
  const { gacetas, updatesByGaceta } = await getGacetasWithContext();
  const gacetasConContenido = gacetas.filter((g) => updatesByGaceta.has(g.number));

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Gacetas Oficiales de Honduras",
            description:
              "Listado de ediciones de La Gaceta de Honduras revisadas por Biblioteca Legal HN, con las reformas y leyes que contiene cada una.",
            url: `${BASE_URL}/gacetas`,
            isPartOf: {
              "@type": "WebSite",
              name: "Biblioteca Legal HN",
              url: BASE_URL,
            },
            numberOfItems: gacetas.length,
          }),
        }}
      />
      <HeaderSection
        imageUrl="https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/86f8cacd-d2d6-42df-a1bd-569b2c5e047c.webp"
        title="Gacetas Oficiales"
        description="Consulta y descarga los PDFs originales de La Gaceta de la República de Honduras"
      />

      <div className="container max-w-[1100px] py-12">
        <p className="text-muted-foreground text-base leading-relaxed max-w-[750px] mb-10">
          La Gaceta es el diario oficial de la República de Honduras: ahí se publican los
          decretos, leyes, reglamentos y acuerdos que entran en vigencia en el país. En
          Biblioteca Legal HN revisamos cada edición para identificar qué leyes y códigos
          reforma, deroga o crea, y explicamos el cambio en lenguaje claro en{" "}
          <Link href="/actualizaciones" className="text-primary underline">
            Actualizaciones Legales
          </Link>
          . Aquí puedes consultar el listado de ediciones que hemos procesado
          {gacetas.length > 0 ? ` (${gacetas.length} hasta ahora)` : ""} y, mientras el
          PDF original siga disponible, descargarlo directamente sin buscarlo en otro
          lado.
        </p>

        <GacetasPublicList
          gacetas={gacetas.map((g) => ({
            id: g.id,
            number: g.number,
            uploadedAt: g.uploadedAt.toISOString(),
            fileAvailable: g.fileAvailable,
            updatesCount: updatesByGaceta.get(g.number)?.length ?? 0,
          }))}
        />

        {gacetasConContenido.length > 0 && (
          <section
            aria-label="Qué contiene cada Gaceta"
            className="mt-16 pt-16 border-t space-y-10"
          >
            <h2 className="text-xl font-semibold">Qué contiene cada Gaceta</h2>
            <div className="space-y-8">
              {gacetasConContenido.map((g) => (
                <div key={g.id}>
                  <h3 className="font-semibold mb-2">La Gaceta N° {g.number}</h3>
                  <ul className="space-y-1.5">
                    {(updatesByGaceta.get(g.number) ?? []).map((u) => (
                      <li key={u.slug} className="text-sm">
                        <span className="text-muted-foreground">
                          {TYPE_LABEL[u.type] ?? u.type}
                          {u.relatedDocument ? ` · ${u.relatedDocument.name}` : ""}:
                        </span>{" "}
                        <Link
                          href={`/actualizaciones/${u.slug}`}
                          className="text-primary hover:underline"
                        >
                          {u.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GacetasPage;
