import { createHmac, timingSafeEqual } from "node:crypto";

const CALL_STATUS_RANK: Record<string, number> = {
  queued: 10,
  initiated: 20,
  ringing: 30,
  "in-progress": 40,
  answered: 40,
  completed: 50,
  busy: 50,
  failed: 50,
  "no-answer": 50,
  canceled: 50,
  cancelled: 50,
};

/**
 * Status only moves forward. Equal ranks (two terminal statuses, or a retry
 * of the current one) keep the status already stored. Unknown incoming
 * statuses never overwrite a known one.
 */
export function nextCallStatus(current: string | null, incoming: string): string {
  if (!current) return incoming;
  const currentRank = CALL_STATUS_RANK[current];
  const incomingRank = CALL_STATUS_RANK[incoming];
  if (incomingRank === undefined) return current;
  if (currentRank === undefined) return incoming;
  return incomingRank > currentRank ? incoming : current;
}

export function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
): string {
  const payload =
    url +
    Object.keys(params)
      .sort()
      .map((key) => key + params[key])
      .join("");
  return createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
}

function signaturesMatch(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyTwilioRequest(
  request: Request,
  params: Record<string, string>,
): { ok: true } | { ok: false; error: string } {
  if (process.env.TWILIO_SKIP_SIGNATURE_CHECK === "true") {
    return { ok: true };
  }

  const token = process.env.TWILIO_AUTH_TOKEN ?? "";
  if (!token) {
    return { ok: false, error: "Twilio signature verification is not configured." };
  }

  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!signature) {
    return { ok: false, error: "Missing Twilio signature." };
  }

  const url = process.env.TWILIO_WEBHOOK_URL || request.url;
  const expected = computeTwilioSignature(token, url, params);
  if (!signaturesMatch(expected, signature)) {
    return { ok: false, error: "Invalid Twilio signature." };
  }
  return { ok: true };
}
