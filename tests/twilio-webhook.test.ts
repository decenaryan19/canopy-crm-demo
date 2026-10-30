import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/twilio/call-status/route";
import { prisma } from "@/lib/prisma";
import { formRequest, resetTables } from "./helpers";

const WEBHOOK = "/api/twilio/call-status";

function signature(url: string, params: Record<string, string>, token: string) {
  const payload =
    url +
    Object.keys(params)
      .sort()
      .map((key) => key + params[key])
      .join("");
  return createHmac("sha1", token).update(payload, "utf8").digest("base64");
}

describe("POST /api/twilio/call-status", () => {
  beforeEach(async () => {
    process.env.TWILIO_SKIP_SIGNATURE_CHECK = "true";
    process.env.TWILIO_AUTH_TOKEN = "test-auth-token";
    await resetTables();
  });

  it("stores one Call when the same webhook is delivered twice", async () => {
    const fields = {
      CallSid: "CA1234567890",
      CallStatus: "ringing",
      From: "+14155552671",
      To: "+14155550100",
      Direction: "inbound",
    };

    const first = await POST(formRequest(WEBHOOK, fields));
    const second = await POST(formRequest(WEBHOOK, fields));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.duplicate).toBe(true);

    expect(await prisma.call.count()).toBe(1);
    expect(await prisma.callStatusEvent.count()).toBe(1);
    const call = await prisma.call.findUnique({ where: { callSid: fields.CallSid } });
    expect(call?.status).toBe("ringing");
  });

  it("does not move status backward when events arrive out of order", async () => {
    const sid = "CA-out-of-order";
    const completed = await POST(
      formRequest(WEBHOOK, {
        CallSid: sid,
        CallStatus: "completed",
        CallDuration: "42",
        From: "+14155552671",
        To: "+14155550100",
      }),
    );
    const ringing = await POST(
      formRequest(WEBHOOK, {
        CallSid: sid,
        CallStatus: "ringing",
        From: "+14155552671",
        To: "+14155550100",
      }),
    );

    expect(completed.status).toBe(200);
    expect(ringing.status).toBe(200);
    const call = await prisma.call.findUnique({ where: { callSid: sid } });
    expect(call?.status).toBe("completed");
    expect(call?.durationSeconds).toBe(42);
    expect(await prisma.call.count()).toBe(1);
    expect(await prisma.callStatusEvent.count()).toBe(2);
  });

  it("advances status and links a matching lead", async () => {
    const lead = await prisma.lead.create({
      data: {
        name: "Priya Shah",
        email: "priya@example.com",
        phone: "+12065550177",
        source: "website",
      },
    });

    await POST(
      formRequest(WEBHOOK, {
        CallSid: "CA-priya",
        CallStatus: "ringing",
        From: "+12065550100",
        To: "(206) 555-0177",
        Direction: "outbound",
      }),
    );
    await POST(
      formRequest(WEBHOOK, {
        CallSid: "CA-priya",
        CallStatus: "in-progress",
        From: "+12065550100",
        To: "+12065550177",
      }),
    );

    const call = await prisma.call.findUnique({ where: { callSid: "CA-priya" } });
    expect(call?.status).toBe("in-progress");
    expect(call?.leadId).toBe(lead.id);
    expect(await prisma.callStatusEvent.count()).toBe(2);
  });

  it("rejects a bad signature and accepts a valid one", async () => {
    process.env.TWILIO_SKIP_SIGNATURE_CHECK = "false";
    const fields = {
      CallSid: "CA-signed",
      CallStatus: "completed",
      From: "+14155552671",
      To: "+14155550100",
    };
    const url = `http://localhost${WEBHOOK}`;

    const rejected = await POST(
      formRequest(WEBHOOK, fields, { "x-twilio-signature": "not-a-real-signature" }),
    );
    expect(rejected.status).toBe(403);
    expect(await prisma.call.count()).toBe(0);

    const signed = await POST(
      formRequest(WEBHOOK, fields, {
        "x-twilio-signature": signature(url, fields, "test-auth-token"),
      }),
    );
    expect(signed.status).toBe(200);
    expect(await prisma.call.count()).toBe(1);

    const replay = await POST(
      formRequest(WEBHOOK, fields, {
        "x-twilio-signature": signature(url, fields, "test-auth-token"),
      }),
    );
    expect(replay.status).toBe(200);
    expect(await prisma.call.count()).toBe(1);
    expect(await prisma.callStatusEvent.count()).toBe(1);
  });
});
