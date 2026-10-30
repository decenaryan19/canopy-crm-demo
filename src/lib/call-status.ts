import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { nextCallStatus } from "@/lib/twilio";

export type CallStatusInput = {
  callSid: string;
  callStatus: string;
  fromNumber?: string;
  toNumber?: string;
  direction?: string;
  durationSeconds?: number;
};

function phoneCandidates(...values: Array<string | undefined>): string[] {
  const found = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    found.add(value);
    const normalized = normalizePhone(value);
    if (normalized) found.add(normalized);
  }
  return [...found];
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function recordCallStatus(input: CallStatusInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.call.findUnique({
        where: { callSid: input.callSid },
      });
      const existingEvent = existing
        ? await tx.callStatusEvent.findUnique({
            where: {
              callSid_callStatus: {
                callSid: input.callSid,
                callStatus: input.callStatus,
              },
            },
          })
        : null;

      if (existing && existingEvent) {
        return { call: existing, duplicate: true };
      }

      const status = nextCallStatus(existing?.status ?? null, input.callStatus);
      const candidates = phoneCandidates(input.fromNumber, input.toNumber);
      const lead =
        existing?.leadId || candidates.length === 0
          ? null
          : await tx.lead.findFirst({
              where: { phone: { in: candidates } },
              select: { id: true },
            });

      const call = await tx.call.upsert({
        where: { callSid: input.callSid },
        create: {
          callSid: input.callSid,
          status,
          fromNumber: input.fromNumber,
          toNumber: input.toNumber,
          direction: input.direction,
          durationSeconds: input.durationSeconds,
          leadId: lead?.id,
        },
        update: {
          status,
          fromNumber: input.fromNumber ?? existing?.fromNumber,
          toNumber: input.toNumber ?? existing?.toNumber,
          direction: input.direction ?? existing?.direction,
          durationSeconds: input.durationSeconds ?? existing?.durationSeconds,
          leadId: existing?.leadId ?? lead?.id,
        },
      });

      await tx.callStatusEvent.create({
        data: { callSid: input.callSid, callStatus: input.callStatus },
      });

      return { call, duplicate: false };
    });
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error;
    const call = await prisma.call.findUniqueOrThrow({
      where: { callSid: input.callSid },
    });
    return { call, duplicate: true };
  }
}
