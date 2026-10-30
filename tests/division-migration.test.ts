import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

function migrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.existsSync(path.join(migrationsDir, name, "migration.sql")))
    .sort()
    .map((name) => path.join(migrationsDir, name, "migration.sql"));
}

function execFile(db: DatabaseSync, file: string) {
  db.exec(fs.readFileSync(file, "utf8"));
}

describe("division migration", () => {
  const files = migrationFiles();

  it("is the nullable add, then a backfill, then a required column with a default", () => {
    expect(files).toHaveLength(3);
    expect(path.basename(path.dirname(files[1]))).toContain("add_division_nullable");
    expect(path.basename(path.dirname(files[2]))).toContain("division_required");
    expect(fs.readFileSync(files[1], "utf8")).toContain(
      'ADD COLUMN "division" TEXT',
    );
    expect(fs.readFileSync(files[1], "utf8")).not.toContain("NOT NULL");
    const required = fs.readFileSync(files[2], "utf8");
    expect(required).toContain(`"division" TEXT NOT NULL DEFAULT 'unassigned'`);
    expect(required.toLowerCase()).toContain("coalesce(\"division\", 'unassigned')");
  });

  it("keeps existing rows when division is backfilled and then required", () => {
    const db = new DatabaseSync(":memory:");
    execFile(db, files[0]);
    execFile(db, files[1]);

    db.exec(`
      INSERT INTO "Lead" ("id", "name", "email", "phone", "source", "division")
      VALUES
        ('lead_null', 'No Division', 'none@example.com', '+14155550101', 'website', NULL),
        ('lead_set', 'Has Division', 'set@example.com', '+14155550102', 'referral', 'residential');
    `);

    const updated = db
      .prepare(
        `UPDATE "Lead" SET "division" = 'unassigned' WHERE "division" IS NULL OR trim("division") = ''`,
      )
      .run();
    expect(Number(updated.changes)).toBe(1);

    execFile(db, files[2]);

    db.exec(`
      INSERT INTO "Lead" ("id", "name", "email", "phone", "source")
      VALUES ('lead_default', 'Defaulted', 'default@example.com', '+14155550103', 'phone');
    `);

    const rows = db
      .prepare(`SELECT "id", "division" FROM "Lead" ORDER BY "id"`)
      .all() as Array<{ id: string; division: string }>;

    expect(rows).toEqual([
      { id: "lead_default", division: "unassigned" },
      { id: "lead_null", division: "unassigned" },
      { id: "lead_set", division: "residential" },
    ]);
    db.close();
  });

  it("still fills a missed null inside the required migration", () => {
    const db = new DatabaseSync(":memory:");
    execFile(db, files[0]);
    execFile(db, files[1]);
    db.exec(`
      INSERT INTO "Lead" ("id", "name", "email", "phone", "source", "division")
      VALUES ('lead_missed', 'Missed', 'missed@example.com', '+14155550104', 'website', NULL);
    `);
    execFile(db, files[2]);
    const row = db.prepare(`SELECT "division" FROM "Lead" WHERE "id" = 'lead_missed'`).get() as {
      division: string;
    };
    expect(row.division).toBe("unassigned");
    db.close();
  });
});
