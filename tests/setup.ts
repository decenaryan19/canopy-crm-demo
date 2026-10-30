import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "test.db");
for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  fs.rmSync(dbPath + suffix, { force: true });
}

process.env.DATABASE_URL = `file:${dbPath}`;
process.env.TWILIO_AUTH_TOKEN = "test-auth-token";
process.env.TWILIO_SKIP_SIGNATURE_CHECK = "true";
process.env.LEAD_INTAKE_ORIGIN = "*";

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: process.env,
});
