import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Pricing Plans — Transparent INR Loyalty SaaS Pricing",
  description:
    "Start free with up to 150 active loyalty cards, or upgrade to Growth (₹999/mo) and Scale (₹2,499/mo) with 14-day free trial.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          Simple INR Pricing · Last updated: {SITE_CONFIG.lastUpdated}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          Predictable pricing that protects your store margins.
        </h1>
        <p className="text-sm sm:text-base text-muted leading-relaxed">
          {SITE_CONFIG.guarantee}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SITE_CONFIG.pricingPlans.map((plan) => (
          <div
            key={plan.id}
            className={`p-6 rounded bg-surface border flex flex-col justify-between ${
              plan.highlighted
                ? "border-2 border-accent shadow-md"
                : "border-border"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  {plan.name}
                </h2>
                {plan.highlighted && (
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-accent text-white rounded-xs font-semibold">
                    Recommended
                  </span>
                )}
              </div>

              <div>
                <span className="text-4xl font-extrabold font-mono text-foreground">
                  {plan.priceLabel}
                </span>
                <span className="text-xs text-muted ml-2">{plan.period}</span>
              </div>

              <p className="text-xs text-muted leading-relaxed">
                {plan.description}
              </p>

              <ul className="space-y-2.5 pt-4 border-t border-border text-xs">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-foreground">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/register"
              className={`mt-8 w-full text-center py-2.5 text-xs font-semibold rounded ${
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

      <section className="p-6 rounded bg-surface border border-border space-y-2 text-xs text-muted">
        <h2 className="text-sm font-bold text-foreground">
          Refund, Cancellation & Data Export Guarantee
        </h2>
        <p>
          You can downgrade or cancel your subscription at any time from your
          business settings. If you cancel within 14 days of a first-time paid
          invoice, email{" "}
          <a
            href={`mailto:${SITE_CONFIG.supportEmail}`}
            className="underline text-foreground"
          >
            {SITE_CONFIG.supportEmail}
          </a>{" "}
          for a full no-questions-asked refund. Your customer and transaction
          CSV exports remain accessible even on the free Starter tier.
        </p>
      </section>
    </div>
  );
}

