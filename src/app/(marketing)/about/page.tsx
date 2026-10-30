import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About Loopa — Digital Loyalty Ledger for Indian Local Businesses",
  description:
    "Learn why Loopa built an auditable, app-free QR loyalty card platform for cafés, salons, and independent retailers across India.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      <div className="space-y-3 border-b border-border pb-6">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          Company & Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          Built for neighbourhood counters where every repeat customer matters.
        </h1>
        <p className="text-base text-muted leading-relaxed">
          {SITE_CONFIG.name} ({SITE_CONFIG.legalName}) builds practical loyalty
          infrastructure for independent cafés, bakeries, salons, fitness
          studios, and specialty retailers.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-muted">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Why Loopa Exists</h2>
          <p>
            Most local businesses face an uncomfortable choice: either rely on
            paper punch cards that customers lose and anyone can stamp, or pay
            for bloated enterprise POS suites that force customers to download a
            mobile app just to check their points.
          </p>
          <p>
            We built Loopa in Bengaluru after watching specialty coffee bars and
            salons struggle to reconcile loyalty discounts at the end of every
            month. With Loopa, the customer scans a QR code that opens in under
            two seconds in their browser, while the business owner gets a
            double-checked PostgreSQL transaction ledger.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            Our Engineering & Privacy Principles
          </h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong className="text-foreground">
                Immutable Financial Ledger:
              </strong>{" "}
              Every point earned, converted to store credit, redeemed, or
              adjusted writes an immutable transaction row inside an atomic SQL
              transaction.
            </li>
            <li>
              <strong className="text-foreground">
                Consent-First (DPDP Act 2023):
              </strong>{" "}
              Separate loyalty and marketing consent flags, zero hidden
              third-party ad trackers, and built-in data deletion workflows.
            </li>
            <li>
              <strong className="text-foreground">Zero Vendor Lock-in:</strong>{" "}
              Business owners can export 100% of their customer cards,
              purchases, claims, and transactions to CSV at any time.
            </li>
          </ul>
        </div>
      </section>

      <section className="p-6 rounded bg-surface border border-border grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
        <div>
          <div className="font-mono uppercase text-muted">Registered Office</div>
          <div className="mt-1 font-semibold text-foreground">
            {SITE_CONFIG.address}
          </div>
        </div>
        <div>
          <div className="font-mono uppercase text-muted">Merchant Support</div>
          <div className="mt-1 font-semibold text-foreground">
            {SITE_CONFIG.supportEmail} · {SITE_CONFIG.phone}
          </div>
          <div className="text-muted mt-0.5">{SITE_CONFIG.hours}</div>
        </div>
        <div>
          <div className="font-mono uppercase text-muted">Last Updated</div>
          <div className="mt-1 font-semibold text-foreground">
            {SITE_CONFIG.lastUpdated}
          </div>
          <Link
            href="/contact"
            className="inline-block mt-1 text-accent font-semibold hover:underline"
          >
            Contact our team →
          </Link>
        </div>
      </section>
    </div>
  );
}

