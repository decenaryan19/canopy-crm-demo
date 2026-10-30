const PHONE_CHARS = /^\+?[\d\s().-]+$/;

/**
 * Normalize a phone number to E.164.
 * 10-digit and 11-digit US numbers get a +1. Anything else must already
 * start with + and be a plausible E.164 value. Returns null when the
 * input is blank or not a phone number.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || !PHONE_CHARS.test(trimmed)) return null;

  const digits = trimmed.replace(/\D/g, "");
  let e164: string;
  if (trimmed.startsWith("+")) {
    e164 = `+${digits}`;
  } else if (digits.length === 10) {
    e164 = `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    e164 = `+${digits}`;
  } else {
    return null;
  }

  if (!/^\+[1-9]\d{9,14}$/.test(e164)) return null;
  if (e164.startsWith("+1") && !/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(e164)) {
    return null;
  }
  return e164;
}

export function formatPhone(e164: string): string {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  if (!match) return e164;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}
