import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { divisionLabel, formatDateTime, sourceLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lead",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      calls: {
        orderBy: { updatedAt: "desc" },
        include: { events: { orderBy: { receivedAt: "asc" } } },
      },
    },
  });

  if (!lead) notFound();

  return (
    <article>
      <p className="text-sm text-muted">
        <Link href="/leads" className="hover:text-canopy-deep hover:underline">
          Leads
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{sourceLabel(lead.source)}</span>
      </p>

      <header className="mt-3 border-b border-line pb-6">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">{lead.name}</h1>
        <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <KeyFact label="Phone">
            <a href={`tel:${lead.phone}`} className="tabular-nums hover:text-canopy-deep">
              {formatPhone(lead.phone)}
            </a>
          </KeyFact>
          <KeyFact label="Status">
            <StatusBadge status={lead.status} />
          </KeyFact>
          <KeyFact label="Next action">
            {lead.nextAction ? (
              <span>{lead.nextAction}</span>
            ) : (
              <span className="text-muted">None scheduled</span>
            )}
          </KeyFact>
        </dl>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Section title="Contact">
          <Field label="Email">
            <a href={`mailto:${lead.email}`} className="hover:text-canopy-deep">
              {lead.email}
            </a>
          </Field>
          <Field label="Phone">
            <span className="tabular-nums">{formatPhone(lead.phone)}</span>
            <span className="mt-1 block font-mono text-xs text-muted">{lead.phone}</span>
          </Field>
        </Section>

        <Section title="Attribution">
          <Field label="Source">{sourceLabel(lead.source)}</Field>
          <Field label="Division">{divisionLabel(lead.division)}</Field>
          <Field label="Created">
            <time dateTime={lead.createdAt.toISOString()}>{formatDateTime(lead.createdAt)} UTC</time>
          </Field>
        </Section>

        <Section title="Notes" className="lg:col-span-2">
          <p className="whitespace-pre-wrap text-base leading-relaxed">
            {lead.notes?.trim() ? lead.notes : <span className="text-muted">No notes.</span>}
          </p>
        </Section>

        <Section title="Calls" className="lg:col-span-2">
          {lead.calls.length === 0 ? (
            <p className="text-muted">No calls yet.</p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {lead.calls.map((call) => (
                <li key={call.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">
                      {call.status}
                      {call.direction ? (
                        <span className="ml-2 text-sm font-normal text-muted">{call.direction}</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted tabular-nums">
                      <time dateTime={call.updatedAt.toISOString()}>
                        {formatDateTime(call.updatedAt)} UTC
                      </time>
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted tabular-nums">
                    {call.fromNumber ? formatPhone(call.fromNumber) : "Unknown"} →{" "}
                    {call.toNumber ? formatPhone(call.toNumber) : "Unknown"}
                    {call.durationSeconds != null ? ` · ${call.durationSeconds}s` : ""}
                  </p>
                  <p className="mt-2 font-mono text-xs text-muted">{call.callSid}</p>
                  {call.events.length > 0 ? (
                    <ol className="mt-3 flex flex-wrap gap-2">
                      {call.events.map((event) => (
                        <li
                          key={event.id}
                          className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"
                        >
                          {event.callStatus}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </article>
  );
}

function KeyFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 text-base text-ink">{children}</dd>
    </div>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted">{label}</h3>
      <div className="mt-1 text-base">{children}</div>
    </div>
  );
}
