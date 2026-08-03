/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js defaults Server Action bodies to 1MB. Raise as a defensive
    // measure for admin flows that post large JSON/HTML (content pages,
    // document metadata). Binary uploads (Gaceta PDFs, avatars) bypass
    // Server Actions via Vercel Blob client upload — see /api/gacetas/upload
    // and /api/uploads. That does NOT remove Vercel's hard 4.5MB Function
    // body limit on Route Handlers; Blob direct upload exists for that.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: "github.com",
        protocol: "https",
      },
      {
        hostname: "*.public.blob.vercel-storage.com",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
