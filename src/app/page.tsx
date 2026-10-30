import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-wider text-canopy">
        Portfolio sample
      </p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
        A small lead desk for a trades CRM
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        This is sample work built to show a few patterns: a readable lead
        record, a safe way to add a required field, a public intake route an
        Astro form can post to, and a Twilio call-status webhook that can be
        retried. It is not client work, and it is not a Canopy Trades product.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/leads"
          className="inline-flex h-11 items-center rounded-full bg-canopy px-5 text-sm font-medium text-white hover:bg-canopy-deep"
        >
          Open the lead list
        </Link>
        <a
          href="https://github.com/decenaryan19/canopy-crm-demo#what-each-part-demonstrates"
          className="inline-flex h-11 items-center rounded-full border border-line bg-card px-5 text-sm font-medium text-ink hover:border-canopy"
        >
          What each part demonstrates
        </a>
      </div>
      <dl className="mt-12 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
        <div>
          <dt className="font-medium text-ink">Lead record</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted">
            Name, phone, status, and the next action sit at the top. Everything
            else is grouped underneath.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Intake</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted">
            <code className="text-ink">POST /api/leads</code> takes JSON or a
            form post, checks the phone, and answers cross-origin requests.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Calls</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted">
            <code className="text-ink">POST /api/twilio/call-status</code> stores
            one row per CallSid and ignores a second delivery of the same status.
          </dd>
        </div>
      </dl>
    </div>
  );
}
