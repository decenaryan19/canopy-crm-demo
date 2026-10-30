import { recordCallStatus } from "@/lib/call-status";
import { readRequestFields } from "@/lib/read-body";
import { verifyTwilioRequest } from "@/lib/twilio";

export const runtime = "nodejs";

function parseDuration(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

export async function POST(request: Request) {
  const body = await readRequestFields(request);
  if (!body.ok) {
    return new Response(body.error, { status: 400 });
  }

  const callSid = (body.fields.CallSid ?? "").trim();
  const callStatus = (body.fields.CallStatus ?? "").trim().toLowerCase();
  if (!callSid) {
    return new Response("CallSid is required.", { status: 400 });
  }
  if (!callStatus) {
    return new Response("CallStatus is required.", { status: 400 });
  }

  const verification = verifyTwilioRequest(request, body.fields);
  if (!verification.ok) {
    return new Response(verification.error, { status: 403 });
  }

  const result = await recordCallStatus({
    callSid,
    callStatus,
    fromNumber: body.fields.From?.trim() || undefined,
    toNumber: body.fields.To?.trim() || undefined,
    direction: body.fields.Direction?.trim() || undefined,
    durationSeconds: parseDuration(body.fields.CallDuration),
  });

  return Response.json(
    {
      ok: true,
      duplicate: result.duplicate,
      callSid: result.call.callSid,
      status: result.call.status,
    },
    { status: 200 },
  );
}
