import React from "react";
import Link from "next/link";
import {
  QrCode,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Check,
  Terminal,
  Printer,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

export default function HomePage() {
  return (
    <div>
      {/* Above the Fold — Asymmetric Editorial Hero (NON_AI_WEBSITE_GUIDE.md Section 4) */}
      <section className="border-b border-border bg-background py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-mono uppercase tracking-wider bg-surface border border-border rounded-xs text-foreground">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>No mobile app required · DPDP Act 2023 Compliant</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-[1.12]">
              Digital loyalty cards for local businesses.
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
              Issue branded QR loyalty cards in under two minutes. Record
              purchases at the counter, review customer receipt claims, and
              manage separate points and store-credit wallets on an immutable
              PostgreSQL ledger.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
              >
                <span>Create your first loyalty card</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/card/cd_araku_ananya_01"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded border border-border bg-surface hover:bg-surface-elevated text-foreground transition-colors"
              >
                <QrCode className="w-4 h-4 text-accent" />
                <span>Open live customer QR card</span>
              </Link>
            </div>

            <div className="pt-2 grid grid-cols-3 gap-4 border-t border-border text-xs">
              <div>
                <div className="font-mono font-bold text-foreground text-base">
                  &lt; 15 sec
                </div>
                <div className="text-muted">Counter bill recording</div>
              </div>
              <div>
                <div className="font-mono font-bold text-foreground text-base">
                  2 Wallets
                </div>
                <div className="text-muted">Points + ₹ Store Credit</div>
              </div>
              <div>
                <div className="font-mono font-bold text-foreground text-base">
                  100% Audited
                </div>
                <div className="text-muted">Atomic SQL ledger</div>
              </div>
            </div>
          </div>

          {/* Interactive Product Preview Card */}
          <div className="lg:col-span-5">
            <div className="border-2 border-zinc-900 dark:border-zinc-700 bg-surface rounded shadow-lg overflow-hidden">
              <div className="bg-zinc-900 text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    Araku Filter Coffee & Bakehouse
                  </div>
                  <div className="text-base font-bold mt-0.5">
                    Ananya Deshmukh
                  </div>
                  <div className="text-xs font-mono text-zinc-300">
                    ARK-4821-9012 · •••• 8765
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-mono bg-emerald-900/70 text-emerald-300 border border-emerald-700 rounded-xs">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-surface-elevated/50 text-center">
                <div className="p-3">
                  <div className="text-[10px] font-mono uppercase text-muted">
                    Points
                  </div>
                  <div className="text-xl font-extrabold font-mono text-foreground">
                    340
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] font-mono uppercase text-muted">
                    Store Credit
                  </div>
                  <div className="text-xl font-extrabold font-mono text-accent">
                    ₹150
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] font-mono uppercase text-muted">
                    Pending
                  </div>
                  <div className="text-xl font-bold font-mono text-foreground">
                    +65
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="font-mono uppercase text-[11px] text-muted font-semibold">
                  Recent Verified Ledger Entries
                </div>
                <div className="p-2.5 rounded bg-surface-elevated border border-border flex justify-between">
                  <span>2x Pour-over + Sourdough (INV-9012-01)</span>
                  <span className="font-mono font-bold text-emerald-600">
                    +85 pts
                  </span>
                </div>
                <div className="p-2.5 rounded bg-surface-elevated border border-border flex justify-between">
                  <span>Converted 150 pts → Store Credit</span>
                  <span className="font-mono font-bold text-accent">+₹150</span>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href="/card/cd_araku_ananya_01"
                    className="text-accent font-semibold hover:underline"
                  >
                    Try live customer card (PIN: 8765) →
                  </Link>
                  <Link
                    href="/login"
                    className="text-muted hover:text-foreground underline"
                  >
                    Merchant login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Loopa Comparison Table */}
      <section className="py-16 border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              Why Local Businesses Switch
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-foreground">
              Paper punch cards get lost. Spreadsheets get manipulated.
            </h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Loopa gives café owners, salon managers, and retail cashiers a
              single system where every point earned or redeemed is tied to an
              immutable transaction record.
            </p>
          </div>

          <div className="overflow-x-auto border border-border rounded">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-elevated font-mono text-xs uppercase text-muted">
                  <th className="py-3.5 px-4">Capability</th>
                  <th className="py-3.5 px-4">Paper Stamp Cards</th>
                  <th className="py-3.5 px-4">Manual Spreadsheets</th>
                  <th className="py-3.5 px-4 text-foreground font-bold">
                    Loopa Digital QR Ledger
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                <tr>
                  <td className="py-3.5 px-4 font-semibold">
                    Customer Access
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    Forgotten at home or washed in pockets
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    Customer cannot see their own balance
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    Instant mobile browser page via QR scan
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold">
                    Fraud & Staff Controls
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    Anyone with a rubber stamp can add punches
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    Cells can be overwritten without history
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    Role-based access + Manager threshold queue
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold">
                    Missed Counter Scans
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    Argue at counter on next visit
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    Manual WhatsApp messages to owner
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    Self-service receipt claims with duplicate detection
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold">
                    Liability Reporting
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    Zero visibility into unredeemed stamps
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    Requires manual formula maintenance
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    Real-time INR liability & repeat-visit metrics
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Numbered 4-Step How It Works */}
      <section className="py-16 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              Operational Workflow
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-foreground">
              How Loopa works at your counter
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              {
                step: "01",
                icon: Terminal,
                title: "Configure Rules & Roles",
                desc: "Set points per ₹ spent, minimum bill amount, store-credit conversion rate, and invite your Managers and Cashiers.",
              },
              {
                step: "02",
                icon: Printer,
                title: "Issue Customer QR Cards",
                desc: "Enter customer name and phone with explicit DPDP consent. Print their branded card or share the QR link.",
              },
              {
                step: "03",
                icon: Receipt,
                title: "Record Bills or Approve Claims",
                desc: "Cashiers record purchases in 15 seconds, or customers submit receipt claims from their phone for manager approval.",
              },
              {
                step: "04",
                icon: ShieldCheck,
                title: "Redeem Rewards Atomically",
                desc: "Redeem catalog rewards or ₹ store credit with concurrency-safe SQL locks and automatic reversal on cancellation.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-5 rounded bg-surface border border-border flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-surface-elevated border border-border rounded-xs text-accent">
                        STEP {item.step}
                      </span>
                      <Icon className="w-4 h-4 text-muted" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-16 border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
                Transparent INR Pricing
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-foreground">
                Start free. Scale as your repeat customers grow.
              </h2>
            </div>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-accent hover:underline"
            >
              Compare full plan limits →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SITE_CONFIG.pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded bg-background border flex flex-col justify-between ${
                  plan.highlighted
                    ? "border-2 border-accent shadow-sm"
                    : "border-border"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">
                      {plan.name}
                    </h3>
                    {plan.highlighted && (
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-accent text-white rounded-xs font-semibold">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold font-mono text-foreground">
                      {plan.priceLabel}
                    </span>
                    <span className="text-xs text-muted ml-1.5">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{plan.description}</p>
                  <ul className="space-y-2 pt-2 border-t border-border text-xs">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/register"
                  className={`mt-6 w-full text-center py-2.5 text-xs font-semibold rounded transition-colors ${
                    plan.highlighted
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expandable FAQ Section (8+ questions required) */}
      <section className="py-16 border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              Questions & Answers
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 bg-surface">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ready to issue your first digital QR loyalty card?
          </h2>
          <p className="text-sm text-muted max-w-xl mx-auto">
            {SITE_CONFIG.guarantee}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 text-sm font-semibold rounded bg-accent text-white hover:bg-accent-hover"
            >
              Create Free Business Account
            </Link>
            <Link
              href="/docs"
              className="px-6 py-3 text-sm font-semibold rounded border border-border bg-background hover:bg-surface-elevated text-foreground"
            >
              Read Setup Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

