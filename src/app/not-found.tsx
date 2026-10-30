import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="flex-1 flex items-center justify-center px-4 py-20"
    >
      <div className="max-w-lg w-full border border-border bg-surface rounded p-8 text-center">
        <span className="inline-block px-2.5 py-1 text-xs font-mono uppercase tracking-wider bg-surface-elevated border border-border rounded-xs text-accent">
          Error 404
        </span>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Page or loyalty card not found
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          The page or customer card link you requested could not be found. Verify
          that the QR code URL is complete or use the links below to navigate.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
          >
            Back to {SITE_CONFIG.name} Home
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
          >
            Merchant Dashboard
          </Link>
          <Link
            href="/card/cd_araku_ananya_01"
            className="px-4 py-2 text-sm font-medium rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
          >
            View Live Demo Card
          </Link>
        </div>

        <div className="mt-6 pt-5 border-t border-border flex flex-wrap justify-center gap-4 text-xs text-muted">
          <Link href="/docs" className="hover:text-foreground underline">
            Setup Documentation
          </Link>
          <Link href="/pricing" className="hover:text-foreground underline">
            Pricing Plans
          </Link>
          <Link href="/faq" className="hover:text-foreground underline">
            FAQs
          </Link>
          <Link href="/contact" className="hover:text-foreground underline">
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}

