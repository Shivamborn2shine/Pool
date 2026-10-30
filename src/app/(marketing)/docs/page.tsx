import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Merchant Setup Documentation & Getting Started Guide",
  description:
    "Step-by-step guide to launching your digital QR loyalty card program on Loopa: rules, staff roles, QR printing, claims, and redemptions.",
  alternates: { canonical: "/docs" },
};

const SETUP_STEPS = [
  {
    step: "1. Create an Owner Account & Business Profile",
    action:
      "Open /register and enter your full name, business name (e.g., Araku Filter Coffee), work email, currency (INR default), and timezone (Asia/Kolkata).",
    expected:
      "Your business workspace, default Main Counter branch location, and initial Loyalty Rules are provisioned inside a single atomic transaction.",
  },
  {
    step: "2. Configure Loyalty Rules & Brand Color",
    action:
      "Navigate to Rules & Settings (/settings). Set points earned per currency unit (default: 1 point per ₹10 spent), minimum purchase (₹50), max points per bill (500), store credit rate (100 pts = ₹100), signup bonus points, and your primary hex color.",
    expected:
      "All new counter purchases and customer claim calculations immediately use your updated rules, and every rule change is recorded in the audit log.",
  },
  {
    step: "3. Invite Store Managers & Counter Cashiers",
    action:
      "In Rules & Settings, enter your staff member's email and select Manager or Cashier. Click Invite Staff Member.",
    expected:
      "An expiring 7-day invitation token is created (with both email dispatch and a copyable direct invite link). Cashiers can record purchases and redeem rewards but cannot change rules or approve claims.",
  },
  {
    step: "4. Add Your First Customer & Capture DPDP Consent",
    action:
      "Open Customers & Cards (/customers) and click Add Customer. Enter their name and 10-digit Indian mobile number, verify the mandatory Loyalty Program Consent checkbox (and optional Marketing Consent), and submit.",
    expected:
      "Loopa checks for duplicate phone/email within your business, creates the customer profile, assigns a unique Card Number (e.g., ARK-4821-9012) and high-entropy public URL (/card/cd_...), and awards any configured signup bonus points.",
  },
  {
    step: "5. Print or Share the Customer QR Card",
    action:
      "Open the customer's detail page (/customers/[id]). Click Print Branded Card to print on a thermal/desktop printer, download the QR as PNG or SVG, or click Copy Public URL to share via WhatsApp.",
    expected:
      "When the customer scans the QR code with their phone camera, their live card opens in under 2 seconds without any app download.",
  },
  {
    step: "6. Record a Counter Purchase",
    action:
      "Open Purchases & POS (/purchases) or the customer's profile. Enter the bill amount (e.g., ₹680) and optional invoice number (INV-104), review the auto-calculated points, and click Confirm Purchase.",
    expected:
      "The customer's points balance and lifetime spend update atomically, and an immutable points_earned row is written to the ledger.",
  },
  {
    step: "7. Review Customer-Submitted Purchase Claims",
    action:
      "When a customer submits a bill from their public card page (verified by the last 4 digits of their phone number), open Claims & Approvals (/claims). Inspect the receipt number/signed photo and click Approve, Edit, or Reject.",
    expected:
      "Approved claims move points from Pending Points into Points Balance and create a ledger transaction. Rejected claims require a reason visible to the customer.",
  },
  {
    step: "8. Redeem Catalog Rewards or Store Credit",
    action:
      "Customers can request a reward redemption on their card page (which deducts points immediately) or convert points into ₹ Store Credit. Staff can fulfill requests in /rewards or redeem directly at the counter.",
    expected:
      "Fulfilled redemptions mark the reward as completed. If a requested redemption is cancelled or rejected, Loopa automatically writes an immutable reversal transaction restoring the customer's balance.",
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      <div className="border-b border-border pb-6 space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          Merchant Documentation · Last updated: {SITE_CONFIG.lastUpdated}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          Getting Started & Counter Operations Guide
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          Complete setup instructions, expected outcomes, and troubleshooting
          for business owners, managers, and cashiers.
        </p>
      </div>

      {/* Numbered 8-Step Setup Walkthrough */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          8-Step Launch Checklist
        </h2>
        <div className="space-y-4">
          {SETUP_STEPS.map((s) => (
            <div
              key={s.step}
              className="p-5 rounded bg-surface border border-border space-y-2"
            >
              <h3 className="text-base font-bold text-foreground">{s.step}</h3>
              <p className="text-xs text-muted leading-relaxed">
                <strong className="text-foreground">Action:</strong> {s.action}
              </p>
              <div className="p-2.5 rounded bg-surface-elevated border border-border text-xs text-foreground">
                <strong className="text-accent">Expected Result:</strong>{" "}
                {s.expected}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Troubleshooting Section */}
      <section className="p-6 rounded bg-surface border border-border space-y-4 text-xs">
        <h2 className="text-base font-bold text-foreground">
          Troubleshooting Common Counter Scenarios
        </h2>
        <div className="space-y-3">
          <div>
            <div className="font-bold text-foreground">
              1. &ldquo;Phone verification failed&rdquo; when a customer submits
              a claim on their QR card:
            </div>
            <p className="text-muted mt-0.5">
              Write actions on the public card page require the last 4 digits of
              the phone number saved on the customer&apos;s profile. Check{" "}
              <code>/customers</code> to verify the customer&apos;s registered
              mobile number.
            </p>
          </div>
          <div>
            <div className="font-bold text-foreground">
              2. Manager manual adjustment says &ldquo;Queued for Owner
              approval&rdquo;:
            </div>
            <p className="text-muted mt-0.5">
              By default, Managers can adjust up to 500 points directly. Larger
              adjustments enter the Owner approval queue in{" "}
              <code>/claims</code>. Owners can change this threshold in{" "}
              <code>/settings</code>.
            </p>
          </div>
          <div>
            <div className="font-bold text-foreground">
              3. Customer claim automatically marked as &ldquo;Expired&rdquo; or
              &ldquo;Duplicate&rdquo;:
            </div>
            <p className="text-muted mt-0.5">
              Claims older than your configured <code>claim_window_days</code>{" "}
              (default 7 days) are rejected automatically as{" "}
              <code>expired</code>. Claims matching an existing receipt number
              or same bill amount + date are flagged as <code>duplicate</code>.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex flex-wrap gap-4">
          <Link href="/faq" className="text-accent font-semibold hover:underline">
            Read Frequently Asked Questions →
          </Link>
          <Link
            href="/contact"
            className="text-accent font-semibold hover:underline"
          >
            Contact Merchant Support →
          </Link>
        </div>
      </section>
    </div>
  );
}

