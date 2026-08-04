import ContentViewer from "@/app/dashboard/documents/[documentId]/[sectionId]/[chapterId]/_components/contentViwer";
import HeaderSection from "@/components/shared/sections/header";
import { siteAssets } from "@/helper/assets";
import { prisma } from "@/lib/db";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Consulta cómo Biblioteca Legal HN recopila, usa y protege tus datos personales al utilizar la plataforma jurídica de Honduras.",
  openGraph: {
    title: "Política de Privacidad | Biblioteca Legal HN",
    description:
      "Consulta cómo Biblioteca Legal HN recopila, usa y protege tus datos personales.",
    url: "https://www.bibliotecalegalhn.com/privacy-policy",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/privacy-policy",
  },
};

const Page = async () => {
  const data = await prisma.privacyPolicy.findFirst();

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
        title="Política de Privacidad"
        description=""
      />

      <div className="container mx-auto py-10 lg:py-20 max-w-[850px] px-4">
        {content}
      </div>
    </div>
  );
};

export default Page;
