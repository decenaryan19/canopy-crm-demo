export function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const configured = (process.env.LEAD_INTAKE_ORIGIN ?? "*").trim();
  const requestOrigin = request.headers.get("origin");

  let allow = "*";
  if (configured !== "*") {
    const allowed = configured
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (requestOrigin && allowed.includes(requestOrigin)) {
      allow = requestOrigin;
    } else {
      allow = allowed[0] ?? "null";
    }
  }

  headers.set("Access-Control-Allow-Origin", allow);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  return headers;
}

export function jsonWithCors(request: Request, body: unknown, status: number): Response {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}
