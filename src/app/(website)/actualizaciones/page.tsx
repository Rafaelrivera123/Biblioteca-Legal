import { prisma } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { FileText, PlusCircle, XCircle } from "lucide-react";
const TYPE_CONFIG = {
  REFORM: { label: "Reforma", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-200" },
  NEW_LAW: { label: "Nueva Ley", icon: PlusCircle, color: "text-green-600 bg-green-50 border-green-200" },
  REPEAL: { label: "Derogación", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
} as const;
export const metadata: Metadata = {
  title: "Actualizaciones Legales de Honduras | Biblioteca Legal HN",
  description:
    "Mantente al día con las reformas, nuevas leyes y derogaciones más recientes publicadas en La Gaceta de Honduras. Resúmenes claros y actualizados semanalmente.",
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/actualizaciones",
  },
  openGraph: {
    title: "Actualizaciones Legales de Honduras | Biblioteca Legal HN",
    description:
      "Reformas, nuevas leyes y derogaciones recientes en la legislación hondureña, explicadas de forma clara.",
    url: "https://www.bibliotecalegalhn.com/actualizaciones",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
};
export const revalidate = 3600;
async function getPublishedUpdates() {
  return prisma.legalUpdatePost.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      type: true,
      gacetaNumber: true,
      publishedAt: true,
      relatedDocument: {
        select: { name: true, slug: true, id: true },
      },
    },
  });
}
const ActualizacionesPage = async () => {
  const posts = await getPublishedUpdates();
  return (
    <div className="container max-w-[900px] mt-28 mb-20">
      <div className="text-center mb-12">
        <h1 className="font-bold text-[30px] md:text-[40px] leading-[120%] mb-4">
          Actualizaciones Legales de Honduras
        </h1>
        <p className="text-muted-foreground text-base max-w-[650px] mx-auto leading-relaxed">
          Reformas, nuevas leyes y derogaciones publicadas en La Gaceta, explicadas de forma
          clara para abogados, estudiantes y ciudadanos.
        </p>
      </div>
      {posts.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          <p>Todavía no hay actualizaciones publicadas. Vuelve pronto.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const config = TYPE_CONFIG[post.type];
            const Icon = config.icon;
            return (
              <Link
                key={post.id}
                href={`/actualizaciones/${post.slug}`}
                className="block border rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                  {post.gacetaNumber && (
                    <span className="text-xs text-muted-foreground">
                      La Gaceta N° {post.gacetaNumber}
                    </span>
                  )}
                  {post.publishedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.publishedAt).toLocaleDateString("es-HN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-lg mb-1">{post.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.summary}</p>
                {post.relatedDocument && (
                  <p className="text-xs text-primary mt-2">
                    Relacionado con: {post.relatedDocument.name}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ActualizacionesPage;
