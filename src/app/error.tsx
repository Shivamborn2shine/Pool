"use client";

import React from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      className="flex-1 flex items-center justify-center px-4 py-20"
    >
      <div className="max-w-lg w-full border border-border bg-surface rounded p-8 text-center">
        <span className="inline-block px-2.5 py-1 text-xs font-mono uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 rounded-xs">
          System Error 500
        </span>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Something went wrong while loading this view
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          We apologize for the interruption. No points or ledger transactions
          were lost—all balance changes on Loopa run inside atomic PostgreSQL
          transactions.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs font-mono text-muted">
            Reference ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 text-sm font-medium rounded bg-accent text-white hover:bg-accent-hover"
          >
            Retry request
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
          >
            Return to Homepage
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2 text-sm font-medium rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}

