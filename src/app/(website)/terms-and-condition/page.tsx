import ContentViewer from "@/app/dashboard/documents/[documentId]/[sectionId]/[chapterId]/_components/contentViwer";
import HeaderSection from "@/components/shared/sections/header";
import { siteAssets } from "@/helper/assets";
import { prisma } from "@/lib/db";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Lee los términos y condiciones de uso de Biblioteca Legal HN, la biblioteca jurídica virtual de Honduras.",
  openGraph: {
    title: "Términos y Condiciones | Biblioteca Legal HN",
    description:
      "Lee los términos y condiciones de uso de Biblioteca Legal HN.",
    url: "https://www.bibliotecalegalhn.com/terms-and-condition",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/terms-and-condition",
  },
};

const Page = async () => {
  const data = await prisma.termsOfService.findFirst();

  let content;

  if (!data) {
    content = (
      <div className="min-h-[40vh] flex justify-center items-center py-16">
        Contenido no publicado
      </div>
    );
  } else {
    content = <ContentViewer content={data.content} />;
  }

  return (
    <div>
      <HeaderSection
        imageUrl={siteAssets.termsAndCondition}
        title="Términos y Condiciones"
        description=""
      />

      <div className="container mx-auto py-10 lg:py-20 max-w-[850px] px-4">
        {content}
      </div>
    </div>
  );
};

export default Page;
