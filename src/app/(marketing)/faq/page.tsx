import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Loopa Digital Loyalty Cards",
  description:
    "Answers to common questions about QR loyalty cards, separate points and store credit wallets, DPDP Act 2023 compliance, and staff permissions.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8">
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          Help Center · Last updated: {SITE_CONFIG.lastUpdated}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-muted">
          Everything you need to know about running Loopa at your store counter.
        </p>
      </div>

      <FaqAccordion />

      <div className="p-5 rounded bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <strong className="text-foreground">Still have a question?</strong>{" "}
          <span className="text-muted">
            Our Bengaluru support team responds within 4 business hours.
          </span>
        </div>
        <Link
          href="/contact"
          className="px-4 py-2 font-semibold rounded bg-accent text-white hover:bg-accent-hover text-center"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

