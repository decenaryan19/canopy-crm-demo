import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.$executeRawUnsafe(
    `UPDATE "Lead" SET "division" = 'unassigned' WHERE "division" IS NULL OR trim("division") = ''`,
  );
  console.log(`Backfilled ${updated} lead(s) with division = 'unassigned'.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
