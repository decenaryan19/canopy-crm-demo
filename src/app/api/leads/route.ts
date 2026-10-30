import { jsonWithCors, corsHeaders } from "@/lib/cors";
import { parseLeadInput } from "@/lib/lead-input";
import { prisma } from "@/lib/prisma";
import { readRequestFields } from "@/lib/read-body";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const body = await readRequestFields(request);
  if (!body.ok) {
    return jsonWithCors(request, { error: body.error }, 400);
  }

  const parsed = parseLeadInput(body.fields);
  if (!parsed.ok) {
    return jsonWithCors(
      request,
      { error: parsed.error, fieldErrors: parsed.fieldErrors },
      400,
    );
  }

  const lead = await prisma.lead.create({
    data: {
      name: parsed.value.name,
      email: parsed.value.email,
      phone: parsed.value.phone,
      source: parsed.value.source,
      division: parsed.value.division,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      source: true,
      division: true,
      status: true,
      createdAt: true,
    },
  });

  return jsonWithCors(request, lead, 201);
}
