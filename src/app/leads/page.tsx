import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import {
  PAGE_SIZE,
  STATUSES,
  divisionLabel,
  formatDate,
  sourceLabel,
} from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leads",
};

type Search = {
  q?: string;
  status?: string;
  page?: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = STATUSES.some((item) => item.value === params.status)
    ? params.status!
    : "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);

  const where: Prisma.LeadWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { source: { contains: q } },
    ];
  }
  if (status) where.status = status;

  const total = await prisma.lead.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted">
            {total === 0
              ? "No leads match."
              : `Showing ${from.toLocaleString("en-US")}–${to.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`}
          </p>
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="block text-sm font-medium text-ink">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Name, email, phone, or source"
            className="mt-1 h-11 w-full rounded-lg border border-line bg-card px-3 text-sm outline-none"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="mt-1 h-11 rounded-lg border border-line bg-card px-3 text-sm"
          >
            <option value="">Any</option>
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg bg-canopy px-4 text-sm font-medium text-white hover:bg-canopy-deep"
        >
          Filter
        </button>
      </form>

      {leads.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-line bg-card px-5 py-8 text-sm leading-relaxed text-muted">
          {total === 0 && !q && !status
            ? "No leads yet. From the project root, run npx prisma db seed."
            : "Nothing matches that filter."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <caption className="sr-only">Leads</caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Phone
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">
                  Division
                </th>
                <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">
                  Source
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-line last:border-0 hover:bg-[#faf7f1]">
                  <th scope="row" className="px-4 py-3 font-medium">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-ink underline-offset-4 hover:text-canopy-deep hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3 tabular-nums">
                    <a href={`tel:${lead.phone}`} className="hover:text-canopy-deep">
                      {formatPhone(lead.phone)}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted md:table-cell">
                    {divisionLabel(lead.division)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted sm:table-cell">
                    {sourceLabel(lead.source)}
                  </td>
                  <td className="px-4 py-3 text-muted tabular-nums">
                    <time dateTime={lead.createdAt.toISOString()}>{formatDate(lead.createdAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <PageLink
            page={page - 1}
            q={q}
            status={status}
            disabled={page <= 1}
            label="Previous"
          />
          <p className="text-muted">
            Page {page} of {pageCount}
          </p>
          <PageLink
            page={page + 1}
            q={q}
            status={status}
            disabled={page >= pageCount}
            label="Next"
          />
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({
  page,
  q,
  status,
  disabled,
  label,
}: {
  page: number;
  q: string;
  status: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="text-muted">{label}</span>;
  }
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  params.set("page", String(page));
  return (
    <Link href={`/leads?${params.toString()}`} className="font-medium text-canopy-deep hover:underline">
      {label}
    </Link>
  );
}
