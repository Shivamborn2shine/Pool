import React from "react";
import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy & DPDP Act 2023 Compliance",
  description:
    "How Loopa collects, processes, retains, and deletes personal data in accordance with the Digital Personal Data Protection Act, 2023.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-6 text-sm leading-relaxed text-muted">
      <div className="border-b border-border pb-5">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          Legal & Compliance · Last updated: {SITE_CONFIG.lastUpdated}
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-foreground">
          Privacy Policy
        </h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          1. Overview & DPDP Act 2023 Alignment
        </h2>
        <p>
          {SITE_CONFIG.legalName} (&ldquo;{SITE_CONFIG.name}&rdquo;) processes
          personal data on behalf of participating local businesses (Data
          Fiduciaries) and their customers (Data Principals) in compliance with
          India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          2. Data Collected & Purpose
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-foreground">Merchant & Staff Data:</strong>{" "}
            Full name, work email, phone number, role, and IP/user-agent logs
            for authentication and security auditing.
          </li>
          <li>
            <strong className="text-foreground">Customer Loyalty Data:</strong>{" "}
            Full name, phone number, optional email/birthday, purchase history,
            and receipt images uploaded for purchase claims.
          </li>
          <li>
            <strong className="text-foreground">
              Explicit Separate Consent:
            </strong>{" "}
            Loyalty card creation requires explicit loyalty processing consent.
            Marketing communication consent is collected via a separate,
            optional toggle that customers can withdraw at any time from their
            QR card page.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          3. Receipt Storage & QR Privacy
        </h2>
        <p>
          Customer receipt files are stored in a private Supabase Storage bucket
          and accessed solely via time-limited signed URLs. QR codes never
          contain customer phone numbers, balances, or internal database UUIDs.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          4. Data Retention & Deletion Rights
        </h2>
        <p>
          Customers can submit a data export, correction, or deletion request
          directly from the <strong>Privacy</strong> tab on their digital
          loyalty card page or by emailing{" "}
          <a
            href={`mailto:${SITE_CONFIG.privacyEmail}`}
            className="underline text-foreground"
          >
            {SITE_CONFIG.privacyEmail}
          </a>
          . Upon verified deletion, personal identifiers are scrubbed while
          anonymized financial ledger totals are retained as required for tax
          and audit compliance.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          5. Grievance Officer & Contact
        </h2>
        <p>
          Data Protection & Grievance Officer, {SITE_CONFIG.legalName},{" "}
          {SITE_CONFIG.address}. Email:{" "}
          <a
            href={`mailto:${SITE_CONFIG.privacyEmail}`}
            className="underline text-foreground"
          >
            {SITE_CONFIG.privacyEmail}
          </a>{" "}
          · Phone: {SITE_CONFIG.phone}.
        </p>
      </section>
    </div>
  );
}

