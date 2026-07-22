import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Por defecto Next.js limita el body de un Server Action a 1MB. Los PDF
    // de La Gaceta suben directo a Neon (Postgres) vía Server Action, y
    // fácilmente pesan varios MB, así que subimos el límite.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: "files.edgestore.dev",
        protocol: "https",
      },
      {
        hostname: "res.cloudinary.com",
        protocol: "https",
      },
      {
        hostname: "github.com",
        protocol: "https",
      },
    ],
  },
  async redirects() {
    try {
      const documents = await prisma.document.findMany({
        where: {
          oldSlug: { not: null },
          slug: { not: null },
          published: true,
        },
        select: {
          slug: true,
          oldSlug: true,
        },
      });

      return documents.map((doc) => ({
        source: `/collections/${doc.oldSlug}`,
        destination: `/collections/${doc.slug}`,
        permanent: true,
      }));
    } catch (error) {
      console.error("Error generando redirects:", error);
      return [];
    } finally {
      await prisma.$disconnect();
    }
  },
};

export default nextConfig;
