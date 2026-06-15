import { prisma } from "@/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, PlusCircle, XCircle, ArrowLeft } from "lucide-react";
const TYPE_CONFIG = {
  REFORM: { label: "Reforma", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-200" },
  NEW_LAW: { label: "Nueva Ley", icon: PlusCircle, color: "text-green-600 bg-green-50 border-green-200" },
  REPEAL: { label: "Derogación", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
} as const;
async function getPost(slug: string) {
  return prisma.legalUpdatePost.findFirst({
    where: { slug, status: "published" },
    include: {
      relatedDocument: {
        select: { name: true, slug: true, id: true },
      },
    },
  });
}
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) {
    return { title: "Actualización no encontrada | Biblioteca Legal HN" };
  }
  const url = `https://www.bibliotecalegalhn.com/actualizaciones/${post.slug}`;
  return {
    title: `${post.title} | Biblioteca Legal HN`,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.summary,
      url,
      siteName: "Biblioteca Legal HN",
      locale: "es_HN",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}
export const revalidate = 3600;
const ActualizacionDetailPage = async ({ params }: { params: { slug: string } }) => {
  const post = await getPost(params.slug);
  if (!post) notFound();
  const config = TYPE_CONFIG[post.type];
  const Icon = config.icon;
  const url = `https://www.bibliotecalegalhn.com/actualizaciones/${post.slug}`;
  return (
    <div className="container max-w-[800px] mt-28 mb-20">
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
            publisher: {
              "@type": "Organization",
              name: "Biblioteca Legal HN",
              url: "https://www.bibliotecalegalhn.com",
            },
          }),
        }}
      />
      <Link
        href="/actualizaciones"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a actualizaciones
      </Link>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}
        >
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>
        {post.gacetaNumber && (
          <span className="text-xs text-muted-foreground">La Gaceta N° {post.gacetaNumber}</span>
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
      <h1 className="font-bold text-[26px] md:text-[34px] leading-[125%] mb-4">{post.title}</h1>
      <p className="text-muted-foreground text-base leading-relaxed mb-8">{post.summary}</p>
      <div
        className="prose prose-sm md:prose-base max-w-none [&_table]:border [&_table]:border-gray-200 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:p-2 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 [&_table]:w-full"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      {post.relatedDocument && (
        <div className="mt-10 border-t pt-6">
          <p className="text-sm text-muted-foreground mb-2">Documento relacionado:</p>
          <Link
            href={`/collections/${post.relatedDocument.slug || post.relatedDocument.id}`}
            className="text-primary font-semibold hover:underline"
          >
            {post.relatedDocument.name}
          </Link>
        </div>
      )}
    </div>
  );
};
export default ActualizacionDetailPage;
