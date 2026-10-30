export async function readRequestFields(
  request: Request,
): Promise<{ ok: true; fields: Record<string, string> } | { ok: false; error: string }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch {
      return { ok: false, error: "Request body is not valid JSON." };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "JSON body must be an object." };
    }
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        fields[key] = value;
      } else if (value == null) {
        fields[key] = "";
      } else {
        return { ok: false, error: `Field "${key}" must be a string.` };
      }
    }
    return { ok: true, fields };
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return { ok: false, error: "Request body is not a valid form." };
    }
    const fields: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value !== "string") {
        return { ok: false, error: `Field "${key}" must be a string.` };
      }
      fields[key] = value;
    }
    return { ok: true, fields };
  }

  return {
    ok: false,
    error:
      "Send JSON (application/json) or a form (application/x-www-form-urlencoded).",
  };
}
