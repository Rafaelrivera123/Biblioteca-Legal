import { prisma } from "@/lib/db";
import { filterSubstantialLegalUpdates } from "@/lib/legal-update-quality";
import { parseGacetaNumber } from "@/lib/utils";
import { FileText, PlusCircle, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG = {
  REFORM: {
    label: "Reforma",
    icon: FileText,
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  NEW_LAW: {
    label: "Nueva Ley",
    icon: PlusCircle,
    color: "text-green-700 bg-green-50 border-green-200",
  },
  REPEAL: {
    label: "Derogación",
    icon: XCircle,
    color: "text-red-700 bg-red-50 border-red-200",
  },
} as const;

async function getFeaturedUpdates() {
  try {
    const posts = await prisma.legalUpdatePost.findMany({
      where: { status: "published" },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        content: true,
        type: true,
        gacetaNumber: true,
        publishedAt: true,
        relatedDocumentId: true,
        relatedDocument: { select: { name: true } },
      },
      orderBy: { publishedAt: "desc" },
    });

    return filterSubstantialLegalUpdates(posts)
      .sort(
        (a, b) =>
          parseGacetaNumber(b.gacetaNumber) - parseGacetaNumber(a.gacetaNumber)
      )
      .slice(0, 6);
  } catch (error) {
    console.error("Error cargando actualizaciones destacadas:", error);
    return [];
  }
}

export default async function FeaturedLegalUpdates() {
  const posts = await getFeaturedUpdates();
  if (posts.length === 0) return null;

  return (
    <section className="bg-white py-14 px-4 sm:px-6 lg:px-8 border-b border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <h2 className="text-primary text-[22px] md:text-3xl font-bold leading-tight">
              Actualizaciones legales recientes
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">
              Reformas, nuevas leyes y derogaciones publicadas en La Gaceta,
              explicadas en lenguaje claro con el texto antes y después.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/actualizaciones">
              Ver todas
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => {
            const config = TYPE_CONFIG[post.type as keyof typeof TYPE_CONFIG];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <Link
                key={post.id}
                href={`/actualizaciones/${post.slug}`}
                className="block border border-black/10 rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all bg-slate-50/40"
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  {post.gacetaNumber && (
                    <span className="text-[11px] text-muted-foreground">
                      Gaceta N° {post.gacetaNumber}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-primary text-[15px] leading-snug mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {post.summary}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
