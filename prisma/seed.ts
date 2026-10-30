import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "../scripts/load-env";

loadLocalEnv();

const prisma = new PrismaClient();

const LEAD_COUNT = 3000;

const FIRST_NAMES = [
  "Mara", "Andre", "Priya", "Jonah", "Elena", "Chris", "Noah", "Amina",
  "Luis", "Hannah", "Owen", "Sofia", "Jamal", "Greta", "Felix", "Nina",
  "Hugo", "Leah", "Samir", "Ruth", "Diego", "Clara", "Ivan", "Willa",
  "Omar", "Beth", "Theo", "June", "Malik", "Ada", "Paolo", "Irene",
];

const LAST_NAMES = [
  "Ellison", "Paulsen", "Shah", "Okada", "Vasquez", "Nguyen", "Adler",
  "Brooks", "Keller", "Morales", "Santos", "Ibrahim", "Cho", "Berg",
  "Duarte", "Singh", "Hart", "Novak", "Perkins", "Ali", "Costa", "Walsh",
  "Bennett", "Rahman", "Vogel", "Park", "Holland", "Meyer", "Grant", "Sato",
];

const SOURCES = ["website", "astro-form", "referral", "google-ads", "phone"];
const DIVISIONS = ["residential", "commercial", "service", "unassigned"];

type LeadRow = {
  name: string;
  email: string;
  phone: string;
  source: string;
  division: string;
  status: string;
  nextAction: string | null;
  notes: string | null;
  createdAt: Date;
};

const FEATURED: LeadRow[] = [
  {
    name: "Mara Ellison",
    email: "mara.ellison@example.com",
    phone: "+14155550148",
    source: "astro-form",
    division: "residential",
    status: "booked",
    nextAction: "Confirm Thursday arrival window",
    notes: "South-facing roof. Asked for a morning visit and a written estimate the same day.",
    createdAt: new Date(),
  },
  {
    name: "Andre Paulsen",
    email: "andre.paulsen@example.com",
    phone: "+15035550119",
    source: "referral",
    division: "commercial",
    status: "qualified",
    nextAction: "Prepare the roof estimate",
    notes: "Warehouse on Division Street. Property manager is the decision maker.",
    createdAt: new Date(),
  },
  {
    name: "Priya Shah",
    email: "priya.shah@example.com",
    phone: "+12065550177",
    source: "website",
    division: "service",
    status: "contacted",
    nextAction: "Send a follow-up text",
    notes: "Leak above the kitchen. Photos are in the shared inbox.",
    createdAt: new Date(),
  },
  {
    name: "Jonah Okada",
    email: "jonah.okada@example.com",
    phone: "+13035550164",
    source: "google-ads",
    division: "residential",
    status: "new",
    nextAction: "Call within the hour",
    notes: null,
    createdAt: new Date(),
  },
  {
    name: "Elena Vasquez",
    email: "elena.vasquez@example.com",
    phone: "+15125550132",
    source: "phone",
    division: "unassigned",
    status: "new",
    nextAction: "Confirm the inquiry and assign a division",
    notes: "Called the main line. Did not say whether this is a house or a shop.",
    createdAt: new Date(),
  },
  {
    name: "Chris Nguyen",
    email: "chris.nguyen@example.com",
    phone: "+16175550190",
    source: "astro-form",
    division: "residential",
    status: "closed",
    nextAction: null,
    notes: "Job finished in March. Left a referral for a neighbor.",
    createdAt: new Date(),
  },
];

function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AREAS = ["415", "503", "206", "303", "512", "617", "312", "404", "702", "919", "480", "615"];

function buildGeneratedLeads(count: number, now: number): LeadRow[] {
  const rng = mulberry32(20261030);
  const rows: LeadRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const area = AREAS[i % AREAS.length];
    const exchange = 200 + Math.floor(rng() * 800);
    const line = String(Math.floor(rng() * 10000)).padStart(4, "0");
    const roll = rng();
    let status = "closed";
    let nextAction: string | null = null;
    if (roll < 0.28) {
      status = "new";
      nextAction = "Call within the hour";
    } else if (roll < 0.52) {
      status = "contacted";
      nextAction = "Send a follow-up text";
    } else if (roll < 0.72) {
      status = "qualified";
      nextAction = "Prepare the estimate";
    } else if (roll < 0.88) {
      status = "booked";
      nextAction = "Confirm the arrival window";
    }
    const divisionRoll = rng();
    const division =
      divisionRoll < 0.08 ? "unassigned" : DIVISIONS[Math.floor(rng() * 3)];
    rows.push({
      name: `${first} ${last}`,
      email: `lead.${i}@example.com`,
      phone: `+1${area}${exchange}${line}`,
      source: SOURCES[Math.floor(rng() * SOURCES.length)],
      division,
      status,
      nextAction,
      notes: rng() < 0.35 ? "Seeded sample lead for the demo desk." : null,
      createdAt: new Date(now - Math.floor(rng() * 90 * 24 * 60 * 60 * 1000) - 60_000),
    });
  }
  return rows;
}

async function main() {
  const now = Date.now();
  const featured = FEATURED.map((lead, index) => ({
    ...lead,
    createdAt: new Date(now - index * 60_000),
  }));
  const generated = buildGeneratedLeads(LEAD_COUNT - featured.length, now);
  const leads = [...featured, ...generated];
  if (leads.length !== LEAD_COUNT) {
    throw new Error(`Expected ${LEAD_COUNT} leads, built ${leads.length}.`);
  }

  await prisma.callStatusEvent.deleteMany();
  await prisma.call.deleteMany();
  await prisma.lead.deleteMany();

  const chunkSize = 100;
  for (let offset = 0; offset < leads.length; offset += chunkSize) {
    await prisma.lead.createMany({ data: leads.slice(offset, offset + chunkSize) });
  }

  const mara = await prisma.lead.findFirst({
    where: { email: "mara.ellison@example.com" },
  });
  const priya = await prisma.lead.findFirst({
    where: { email: "priya.shah@example.com" },
  });

  if (mara) {
    await prisma.call.create({
      data: {
        callSid: "CA-seed-mara-ellison",
        leadId: mara.id,
        fromNumber: mara.phone,
        toNumber: "+14155550100",
        status: "completed",
        direction: "inbound",
        durationSeconds: 186,
        events: {
          create: [
            { callStatus: "ringing" },
            { callStatus: "in-progress" },
            { callStatus: "completed" },
          ],
        },
      },
    });
  }

  if (priya) {
    await prisma.call.create({
      data: {
        callSid: "CA-seed-priya-shah",
        leadId: priya.id,
        fromNumber: "+12065550100",
        toNumber: priya.phone,
        status: "ringing",
        direction: "outbound",
        events: { create: [{ callStatus: "ringing" }] },
      },
    });
  }

  const count = await prisma.lead.count();
  console.log(`Seeded ${count} leads.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
