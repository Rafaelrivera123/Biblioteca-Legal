import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, PlusCircle, XCircle, ArrowLeft, Eye } from "lucide-react";
import { SITE_OG_IMAGE, buildSeoDescription, buildSeoTitle } from "@/lib/seo";

const TYPE_CONFIG = {
  REFORM: { label: "Reforma", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-200" },
  NEW_LAW: { label: "Nueva Ley", icon: PlusCircle, color: "text-green-600 bg-green-50 border-green-200" },
  REPEAL: { label: "Derogación", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
} as const;

function extractDespuesFromTables(html: string): string {
  return html.replace(/<table[\s\S]*?<\/table>/gi, (table) => {
    const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
    const dataRows = rows.slice(1);
    const texts = dataRows
      .map((row) => {
        const cells = [...row.matchAll(/<td[\s\S]*?<\/td>/gi)].map((m) => m[0]);
        const lastCell = cells[cells.length - 1] ?? "";
        return lastCell.replace(/<[^>]+>/g, "").trim();
      })
      .filter(Boolean);
    return texts.map((t) => `<p>${t}</p>`).join("");
  });
}

async function getPost(slug: string, isAdmin: boolean) {
  if (isAdmin) {
    return prisma.legalUpdatePost.findFirst({
      where: { slug },
      include: { relatedDocument: { select: { name: true, slug: true, id: true } } },
    });
  }
  return prisma.legalUpdatePost.findFirst({
    where: { slug, status: "published" },
    include: { relatedDocument: { select: { name: true, slug: true, id: true } } },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cu = await auth();
  const isAdmin = cu?.user?.role === "admin";
  const post = await getPost(params.slug, isAdmin);
  if (!post) return { title: "Actualización no encontrada | Biblioteca Legal HN" };
  const url = `https://www.bibliotecalegalhn.com/actualizaciones/${post.slug}`;
  const title = buildSeoTitle(post.title);
  const description = buildSeoDescription(post.summary);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: post.status === "draft" ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: "Biblioteca Legal HN",
      locale: "es_HN",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export const revalidate = 3600;

const ActualizacionDetailPage = async ({ params }: { params: { slug: string } }) => {
  const cu = await auth();
  const isAdmin = cu?.user?.role === "admin";
  const post = await getPost(params.slug, isAdmin);
  if (!post) notFound();
  const config = TYPE_CONFIG[post.type];
  const Icon = config.icon;
  const url = `https://www.bibliotecalegalhn.com/actualizaciones/${post.slug}`;
  const isDraftPreview = post.status === "draft";

  return (
    <div className="container max-w-[800px] mt-28 mb-20">
      {!isDraftPreview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.summary,
              url,
              inLanguage: "es-HN",
              datePublished: post.publishedAt?.toISOString(),
              dateModified: post.updatedAt.toISOString(),
              publisher: { "@type": "Organization", name: "Biblioteca Legal HN", url: "https://www.bibliotecalegalhn.com" },
            }),
          }}
        />
      )}
      {isDraftPreview && (
        <div className="flex items-center gap-2 mb-6 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-2.5">
          <Eye className="w-4 h-4 shrink-0" />
          <p>Vista previa de borrador. Esta página no es visible públicamente hasta que la publiques desde el dashboard.</p>
        </div>
      )}
      <Link href="/actualizaciones" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver a actualizaciones
      </Link>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>
        {post.gacetaNumber && <span className="text-xs text-muted-foreground">La Gaceta N° {post.gacetaNumber}</span>}
        {post.publishedAt && (
          <span className="text-xs text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
      </div>
      <h1 className="font-bold text-[26px] md:text-[34px] leading-[125%] mb-4">{post.title}</h1>
      <p className="text-muted-foreground text-base leading-relaxed mb-8 border-l-4 border-primary/20 pl-4">
        {post.summary}
      </p>
      <div
        className="
          space-y-5
          [&_p]:text-[15px] [&_p]:leading-[1.8] [&_p]:text-gray-700
          [&_p+p]:mt-5
          [&_strong]:text-[#1E2A38] [&_strong]:font-semibold
          [&_p:has(strong:only-child)]:inline-block
        "
        dangerouslySetInnerHTML={{ __html: extractDespuesFromTables(post.content) }}
      />
      {post.relatedDocument && (
        <div className="mt-10 border-t pt-6">
          <p className="text-sm text-muted-foreground mb-2">Documento relacionado:</p>
          <Link href={`/collections/${post.relatedDocument.slug || post.relatedDocument.id}`} className="text-primary font-semibold hover:underline">
            {post.relatedDocument.name}
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActualizacionDetailPage;
