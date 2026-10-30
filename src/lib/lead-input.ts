import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

function blankToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export const leadInputSchema = z.object({
  name: z.preprocess(
    blankToUndefined,
    z
      .string({ error: "Name is required." })
      .min(1, "Name is required.")
      .max(120, "Name is too long."),
  ),
  email: z.preprocess(
    blankToUndefined,
    z
      .string({ error: "Email is required." })
      .min(1, "Email is required.")
      .pipe(z.email("Enter a valid email.")),
  ),
  phone: z.preprocess(
    (value) => (typeof value === "string" ? value : value == null ? "" : value),
    z
      .string({ error: "Phone number is required." })
      .superRefine((value, ctx) => {
        if (value.trim() === "") {
          ctx.addIssue({
            code: "custom",
            message: "Phone number is required.",
          });
          return;
        }
        if (!normalizePhone(value)) {
          ctx.addIssue({
            code: "custom",
            message: "Enter a valid phone number.",
          });
        }
      })
      .transform((value) => normalizePhone(value) ?? value),
  ),
  source: z.preprocess(
    blankToUndefined,
    z.string().min(1).max(80, "Source is too long.").optional().default("website"),
  ),
  division: z.preprocess(
    blankToUndefined,
    z
      .string()
      .min(1)
      .max(80, "Division is too long.")
      .optional()
      .default("unassigned"),
  ),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export function parseLeadInput(fields: Record<string, string>):
  | { ok: true; value: LeadInput }
  | { ok: false; error: string; fieldErrors: Record<string, string> } {
  const result = leadInputSchema.safeParse(fields);
  if (!result.success) {
    const flat = result.error.flatten();
    const fieldErrors: Record<string, string> = {};
    for (const [key, messages] of Object.entries(flat.fieldErrors)) {
      const message = messages?.[0];
      if (message) fieldErrors[key] = message;
    }
    const error =
      fieldErrors.phone ??
      fieldErrors.name ??
      fieldErrors.email ??
      flat.formErrors[0] ??
      "Lead could not be saved.";
    return { ok: false, error, fieldErrors };
  }

  return {
    ok: true,
    value: {
      ...result.data,
      email: result.data.email.toLowerCase(),
    },
  };
}
