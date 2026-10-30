export const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
] as const;

export const DIVISIONS = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "service", label: "Service" },
  { value: "unassigned", label: "Unassigned" },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  "astro-form": "Astro form",
  referral: "Referral",
  "google-ads": "Google ads",
  phone: "Phone",
};

export function statusLabel(value: string): string {
  return STATUSES.find((item) => item.value === value)?.label ?? value;
}

export function divisionLabel(value: string): string {
  return DIVISIONS.find((item) => item.value === value)?.label ?? value;
}

export function sourceLabel(value: string): string {
  return (
    SOURCE_LABELS[value] ??
    value
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

const dateOnly = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDate(value: Date): string {
  return dateOnly.format(value);
}

export function formatDateTime(value: Date): string {
  return dateTime.format(value);
}

export const PAGE_SIZE = 40;
