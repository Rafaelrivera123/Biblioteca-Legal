/**
 * Verify User.freeChatUsed / User.nurtureEmailStep exist.
 *
 *   node --env-file=.env.local scripts/check-user-freemium-columns.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rows = await prisma.$queryRaw`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'User'
    AND column_name IN ('freeChatUsed', 'nurtureEmailStep')
  ORDER BY 1
`;

console.log(rows);
await prisma.$disconnect();
