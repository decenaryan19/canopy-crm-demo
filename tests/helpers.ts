import { prisma } from "@/lib/prisma";

export async function resetTables() {
  await prisma.callStatusEvent.deleteMany();
  await prisma.call.deleteMany();
  await prisma.lead.deleteMany();
}

export function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://marketing.example",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export function formRequest(
  path: string,
  fields: Record<string, string>,
  headers: Record<string, string> = {},
) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body: new URLSearchParams(fields),
  });
}
