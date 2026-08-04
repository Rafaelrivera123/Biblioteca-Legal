/**
 * Migrate User.image URLs still on EdgeStore to Vercel Blob.
 *
 *   npx tsx scripts/migrate-edgestore-avatars-to-blob.ts
 */
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

function loadEnvLocal() {
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // rely on process env when .env.local is absent
  }
}

loadEnvLocal();

const prisma = new PrismaClient();

function extensionFromContentType(contentType: string | null): string {
  if (!contentType) return "bin";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "bin";
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required");
  }

  const users = await prisma.user.findMany({
    where: { image: { contains: "edgestore" } },
    select: { id: true, image: true },
  });

  console.log(`Found ${users.length} EdgeStore avatars to migrate.`);

  for (const user of users) {
    const sourceUrl = user.image!;
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      console.error(`Skip ${user.id.slice(0, 8)}: fetch ${res.status}`);
      continue;
    }

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const bytes = Buffer.from(await res.arrayBuffer());
    const ext = extensionFromContentType(contentType);

    const blob = await put(`avatars/migrated/${user.id}.${ext}`, bytes, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { image: blob.url },
    });

    console.log(`Migrated ${user.id.slice(0, 8)} ΓåÆ ${blob.url}`);
  }

  const remaining = await prisma.user.count({
    where: { image: { contains: "edgestore" } },
  });
  console.log(`Done. Remaining EdgeStore avatars: ${remaining}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
