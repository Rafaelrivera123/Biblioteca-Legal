import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import AppProvider from "@/provider/AppProvider";
import type { Metadata } from "next";
import { Poppins, Raleway } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

export async function generateMetadata(): Promise<Metadata> {
  const data = await prisma.setting.findFirst();
  return {
    title: {
      default: "Biblioteca Legal",
      template: `%s - Biblioteca Legal`,
    },
    description:
      data?.description ??
      "Biblioteca Legal provides expert legal document services, including drafting, reviewing, and managing legal paperwork with accuracy and confidentiality.",
    keywords: data?.keywords ?? [
      "legal document services",
      "legal drafting",
      "contract creation",
      "document review",
      "legal paperwork",
      "business legal documents",
      "remote legal assistance",
      "legal templates",
      "freelance legal support",
      "online legal document services",
      "legal compliance documentation",
      "legal writing services",
      "privacy policy drafting",
      "terms and conditions generator",
    ],
    openGraph: {
      images: [
        "https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/opengraph-image.webp",
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [
        "https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/opengraph-image.webp",
      ],
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://files.edgestore.dev" />
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
        <SpeedInsights />
      </body>
    </html>
  );
}
