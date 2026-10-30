import { statusLabel } from "@/lib/labels";

const TONE: Record<string, string> = {
  new: "bg-[#efe8da] text-[#5c5348]",
  contacted: "bg-[#e4eef8] text-[#1d4e89]",
  qualified: "bg-[#f8efd4] text-[#7a5b12]",
  booked: "bg-[#e3f2e8] text-[#14633a]",
  closed: "bg-[#eceae6] text-[#5e5852]",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[status] ?? TONE.new;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${tone}`}
    >
      {statusLabel(status)}
    </span>
  );
}
