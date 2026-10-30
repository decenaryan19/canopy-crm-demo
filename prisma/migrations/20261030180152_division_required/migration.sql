-- Step 2 of 2: make `division` required and default new rows to 'unassigned'.
-- SQLite cannot ALTER a column to NOT NULL, so the table is rebuilt.
-- coalesce covers any row the backfill script missed. New inserts omit the
-- column and receive DEFAULT 'unassigned'.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "nextAction" TEXT,
    "notes" TEXT,
    "division" TEXT NOT NULL DEFAULT 'unassigned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Lead" ("createdAt", "division", "email", "id", "name", "nextAction", "notes", "phone", "source", "status") SELECT "createdAt", coalesce("division", 'unassigned') AS "division", "email", "id", "name", "nextAction", "notes", "phone", "source", "status" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
