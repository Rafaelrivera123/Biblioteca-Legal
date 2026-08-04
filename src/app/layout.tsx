import { prisma } from "@/lib/db";
import { SITE_OG_IMAGE } from "@/lib/seo";
import { cn } from "@/lib/utils";
import AppProvider from "@/provider/AppProvider";
import type { Metadata, Viewport } from "next";
import { Poppins, Raleway } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import Script from "next/script";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-raleway",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await prisma.setting.findFirst();
  return {
    metadataBase: new URL("https://www.bibliotecalegalhn.com"),
    title: {
      default: "Biblioteca Legal HN",
      template: "%s | Biblioteca Legal HN",
    },
    description:
      data?.description ??
      "Biblioteca Legal HN es la biblioteca jurídica virtual de Honduras. Accede a leyes, códigos, decretos y reglamentos actualizados — Código Penal, Código Civil, Constitución Política y más.",
    keywords: data?.keywords ?? [
      "biblioteca legal Honduras",
      "leyes Honduras",
      "códigos legales Honduras",
      "legislación hondureña",
      "Código Penal Honduras",
      "Código Civil Honduras",
      "Constitución Política Honduras",
      "decretos Honduras",
      "reglamentos Honduras",
      "biblioteca jurídica virtual",
      "derecho hondureño",
      "leyes actualizadas Honduras",
    ],
    openGraph: {
      siteName: "Biblioteca Legal HN",
      locale: "es_HN",
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [SITE_OG_IMAGE],
    },
    other: {
      "google-adsense-account": "ca-pub-5685390714020326",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googletagmanager.com" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5685390714020326"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className={cn(raleway.className, poppins.variable, "")}>
        <AppProvider>{children}</AppProvider>
        <Toaster richColors position="bottom-right" />
        <NextTopLoader showSpinner={false} color="#1E2A38" />
      </body>
    </html>
  );
}
