# Canopy CRM demo

Sample lead desk for a job application. It illustrates patterns from a Next.js + Prisma/SQLite CRM, an Astro marketing site posting into that CRM, and a Twilio call-status webhook.

This is not client work. It is not affiliated with Canopy Trades, and it does not use their data.

## What it is

A small App Router app with three jobs:

- A lead list and a lead detail page. The detail page puts name, phone, status, and the next action at the top, and groups contact, attribution, notes, and calls underneath.
- A committed migration history that adds a required `division` column to `Lead` without breaking rows that already exist.
- `POST /api/leads` for a public intake form, and `POST /api/twilio/call-status` for call status callbacks.

## Setup

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
npm test
```

The app is at [http://localhost:3000](http://localhost:3000). The seed replaces whatever is in the local database with 3,000 sample leads.

Copy `.env.example` to `.env` if you do not already have one. `npm install` generates the Prisma client. `npx prisma migrate dev` creates `prisma/dev.db` and applies the migrations. In CI, `npx prisma migrate deploy` applies the same files without a prompt.

`npm run build` generates the client and builds the Next.js app.

## Migration and backup

`division` was not on the original `Lead` table. Adding a `NOT NULL` column in one step fails as soon as a row has no value, and SQLite cannot `ALTER` a column from nullable to required. The history in `prisma/migrations` does it in two steps:

1. `20261030180142_init` creates `Lead` and the call tables. There is no `division` column.
2. `20261030180148_add_division_nullable` adds `division` as nullable text, so existing rows stay valid.
3. Run the backfill (below) while the column is still nullable. It sets `unassigned` where the value is null or blank, and prints how many rows changed.
4. `20261030180152_division_required` rebuilds the table with `division TEXT NOT NULL DEFAULT 'unassigned'`. The copy uses `coalesce`, so a row the script missed still gets `unassigned`. New inserts that omit `division` get that default.

On a fresh clone, `npx prisma migrate dev` applies all three files. You do not re-run them one at a time. The files are the procedure. `tests/division-migration.test.ts` replays them on an in-memory database: it inserts a null `division`, runs the backfill, applies the required migration, and checks that a later insert picks up the default. A second case skips the backfill and checks that `coalesce` still fills the gap.

Before the backfill or the required migration, take a backup:

```bash
npm run db:backup
```

`scripts/backup-db` reads `DATABASE_URL` (or `file:./dev.db`). Prisma resolves that relative path from `prisma/`. The script writes `backups/<name>-<utc-timestamp>.db`. It uses `sqlite3 .backup` when the `sqlite3` CLI is installed, and a file copy otherwise. `.backup` is the one to use on a database that might be open: it copies a consistent snapshot. Backups are gitignored.

Then backfill:

```bash
npm run db:backfill-division
```

The script is safe to run more than once. After step 4 it updates zero rows.

## What each part demonstrates

- **Lead list and detail.** A CRM record should be scannable. The list is paginated for a few thousand rows. The detail page leads with the four things a caller needs, and puts email, source, division, notes, and call history in groups.
- **`division` migration.** Expand, then backfill, then contract. The nullable migration is the expand. The script is the data change you can read and re-run. The required migration is the contract, with a default for new rows and a `coalesce` so a missed row does not abort the rebuild. Backup first.
- **`POST /api/leads`.** A public intake route. It accepts `application/json` and `application/x-www-form-urlencoded` (an Astro form can post straight at it). `OPTIONS` and the CORS headers let a marketing origin call it with `fetch`. Phone numbers are checked with Zod and stored as E.164. A blank phone is `400` with `Phone number is required.` Odd input such as `abc`, `123`, or `0000000000` is `400` with `Enter a valid phone number.` `LEAD_INTAKE_ORIGIN` defaults to `*` for the demo. Set a real origin before this is public, and add a rate limit. This demo does not have one.
- **`POST /api/twilio/call-status`.** Twilio retries callbacks. The route verifies `X-Twilio-Signature` (HMAC-SHA1 over the webhook URL and the sorted form fields) unless `TWILIO_SKIP_SIGNATURE_CHECK=true`, which is the local setting in `.env.example`. Leave that unset in production and set `TWILIO_AUTH_TOKEN`. Each call is upserted on a unique `CallSid`. Each status is stored in `CallStatusEvent` with a unique `(CallSid, CallStatus)`, so a second delivery of the same status returns `200` and does not insert another call. Status moves forward only: `completed` arriving before `ringing` stays `completed`, and the late `ringing` event is still recorded.

## Tests

`npm test` covers blank and odd phones, JSON and form intake, a CORS preflight, a webhook delivered twice (one `Call` row), out-of-order statuses, signature pass/fail, and the division migration replay.

## Stack

Next.js App Router, TypeScript, Tailwind, Prisma 6 with SQLite, Zod. No hosted database and no live Twilio account are required.
