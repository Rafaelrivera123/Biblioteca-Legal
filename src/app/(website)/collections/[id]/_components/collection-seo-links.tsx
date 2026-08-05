import Link from "next/link";

interface RelatedItem {
  name: string;
  slug: string;
  hrefPrefix: "/collections" | "/guias";
}

interface Props {
  relatedGuides: { name: string; slug: string }[];
  siblingCodes: { name: string; slug: string }[];
}

export default function CollectionSeoLinks({
  relatedGuides,
  siblingCodes,
}: Props) {
  if (relatedGuides.length === 0 && siblingCodes.length === 0) return null;

  const guides: RelatedItem[] = relatedGuides.map((g) => ({
    ...g,
    hrefPrefix: "/guias",
  }));
  const siblings: RelatedItem[] = siblingCodes.map((s) => ({
    ...s,
    hrefPrefix: "/collections",
  }));

  return (
    <aside className="container px-4 py-10 border-t border-black/5">
      <div className="max-w-3xl mx-auto space-y-8">
        {siblings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-primary mb-3">
              Códigos relacionados
            </h2>
            <ul className="flex flex-wrap gap-2">
              {siblings.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`${item.hrefPrefix}/${item.slug}`}
                    className="inline-block text-sm border border-primary/20 text-primary px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {guides.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-primary mb-3">
              Guías relacionadas
            </h2>
            <ul className="space-y-2">
              {guides.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`${item.hrefPrefix}/${item.slug}`}
                    className="text-sm text-primary underline-offset-2 hover:underline"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
