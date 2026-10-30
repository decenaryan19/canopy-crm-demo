import { beforeEach, describe, expect, it } from "vitest";
import { POST, OPTIONS } from "@/app/api/leads/route";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { formRequest, jsonRequest, resetTables } from "./helpers";

const validLead = {
  name: "Mara Ellison",
  email: "Mara.Ellison@Example.com",
  phone: "(415) 555-2671",
  source: "astro-form",
};

describe("phone normalization", () => {
  it("turns a formatted US number into E.164", () => {
    expect(normalizePhone("(415) 555-2671")).toBe("+14155552671");
    expect(normalizePhone("415.555.2671")).toBe("+14155552671");
    expect(normalizePhone("1 415 555 2671")).toBe("+14155552671");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("rejects blank and odd values", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("555-CALL-NOW")).toBeNull();
    expect(normalizePhone("0000000000")).toBeNull();
    expect(normalizePhone("++14155552671")).toBeNull();
  });
});

describe("POST /api/leads", () => {
  beforeEach(resetTables);

  it("rejects a missing phone with a 400", async () => {
    const response = await POST(
      jsonRequest({ name: "Mara Ellison", email: "mara@example.com" }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Phone number is required.");
    expect(body.fieldErrors.phone).toBe("Phone number is required.");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(await prisma.lead.count()).toBe(0);
  });

  it.each(["", "   "])("rejects a blank phone (%j) from JSON", async (phone) => {
    const response = await POST(jsonRequest({ ...validLead, phone }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Phone number is required.");
    expect(await prisma.lead.count()).toBe(0);
  });

  it("rejects a blank phone from a form post", async () => {
    const response = await POST(
      formRequest("/api/leads", {
        name: "Mara Ellison",
        email: "mara@example.com",
        phone: "   ",
        source: "astro-form",
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Phone number is required.");
  });

  it.each(["abc", "123", "555-CALL-NOW", "0000000000", "++14155552671"])(
    "rejects an odd phone (%j)",
    async (phone) => {
      const response = await POST(jsonRequest({ ...validLead, phone }));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Enter a valid phone number.");
      expect(await prisma.lead.count()).toBe(0);
    },
  );

  it("accepts JSON and stores a normalized phone", async () => {
    const response = await POST(jsonRequest(validLead));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.phone).toBe("+14155552671");
    expect(body.email).toBe("mara.ellison@example.com");
    expect(body.source).toBe("astro-form");
    expect(body.division).toBe("unassigned");
    const saved = await prisma.lead.findFirst();
    expect(saved?.phone).toBe("+14155552671");
  });

  it("accepts an Astro-style form post", async () => {
    const response = await POST(
      formRequest("/api/leads", {
        name: "Andre Paulsen",
        email: "andre@example.com",
        phone: "415.555.0199",
        source: "astro-form",
        division: "residential",
      }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.phone).toBe("+14155550199");
    expect(body.division).toBe("residential");
  });

  it("answers a CORS preflight", async () => {
    const response = OPTIONS(
      new Request("http://localhost/api/leads", {
        method: "OPTIONS",
        headers: { origin: "https://marketing.example" },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
  });
});
