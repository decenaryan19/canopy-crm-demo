import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Canopy CRM demo",
    template: "%s · Canopy CRM demo",
  },
  description:
    "Sample lead desk built to illustrate a Next.js, Prisma, and Twilio workflow. Not client work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="font-serif text-xl tracking-tight text-ink">Canopy CRM</span>
              <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">
                Demo
              </span>
            </Link>
            <nav>
              <Link
                href="/leads"
                className="text-sm font-medium text-ink underline-offset-4 hover:text-canopy-deep hover:underline"
              >
                Leads
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
