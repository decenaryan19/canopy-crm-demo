-- Step 1 of 2. Add division as nullable so rows that already exist stay valid.
-- Backfill with `npm run db:backfill-division` before applying division_required.
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "division" TEXT;
