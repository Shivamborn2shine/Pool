import React from "react";
import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service — Loopa Digital Loyalty Platform",
  description:
    "Terms of Service governing merchant subscriptions, loyalty ledger usage, and customer card access on Loopa.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-6 text-sm leading-relaxed text-muted">
      <div className="border-b border-border pb-5">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          Legal Agreement · Last updated: {SITE_CONFIG.lastUpdated}
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-foreground">
          Terms of Service
        </h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          1. Acceptance of Terms
        </h2>
        <p>
          By registering a business account or using a digital loyalty card on{" "}
          {SITE_CONFIG.name} (operated by {SITE_CONFIG.legalName}), you agree to
          these Terms of Service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          2. Service Description & Merchant Responsibilities
        </h2>
        <p>
          {SITE_CONFIG.name} provides software infrastructure to issue digital
          QR loyalty cards, calculate points, review purchase claims, and track
          redemptions. Each participating business is solely responsible for
          honoring the rewards and store credit published on its loyalty cards
          and for obtaining customer consent at the counter.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          3. Subscriptions, Billing & Refunds
        </h2>
        <p>
          Paid plans (Growth and Scale) are billed monthly in INR plus
          applicable GST. Merchants may cancel anytime; first-time paid
          subscriptions cancelled within 14 days qualify for a full refund upon
          request to {SITE_CONFIG.supportEmail}.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          4. Account Suspension & Fraud Prevention
        </h2>
        <p>
          Submitting fabricated receipts, attempting to bypass rate limits, or
          using the platform for unlawful activity may result in immediate card
          freezing or business account suspension.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          5. Limitation of Liability & Governing Law
        </h2>
        <p>
          To the maximum extent permitted by Indian law, {SITE_CONFIG.legalName}
          &apos;s aggregate liability shall not exceed the subscription fees
          paid by the merchant in the preceding 12 months. These terms are
          governed by the laws of India, with exclusive jurisdiction in the
          courts of Bengaluru, Karnataka.
        </p>
      </section>
    </div>
  );
}

