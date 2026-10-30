import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-4xl tracking-tight">That page is not here</h1>
      <p className="mt-3 text-muted">The lead may have been removed, or the address is wrong.</p>
      <Link
        href="/leads"
        className="mt-6 inline-flex text-sm font-medium text-canopy-deep underline-offset-4 hover:underline"
      >
        Back to leads
      </Link>
    </div>
  );
}
