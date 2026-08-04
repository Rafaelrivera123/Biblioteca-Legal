import { auth } from "@/auth";
import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import CookieBanner from "@/components/shared/cookie-banner";
import { prisma } from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { GoogleAnalytics } from "@next/third-parties/google";
import NextTopLoader from "nextjs-toploader";
import { ReactNode } from "react";

const WebsiteLayout = async ({ children }: { children: ReactNode }) => {
  const cu = await auth();
  let user;
  if (cu?.user?.id) {
    // Select only navbar fields — avoid SELECT * so additive User columns
    // cannot take down every website page before db push lands.
    user = await prisma.user.findUnique({
      where: { id: cu.user.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        image: true,
        role: true,
      },
    });
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/site/logo.webp`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "es-HN",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar isLoggedin={!!cu} user={user ?? null} />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
      <NextTopLoader showSpinner={false} color="#FFFFFF" />
      <GoogleAnalytics gaId={process.env.GOOGLE_ANALYTICS_ID!} />
    </div>
  );
};
export default WebsiteLayout;
