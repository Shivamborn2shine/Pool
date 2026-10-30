import React from "react";
import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Cookie Policy — Loopa Digital Loyalty Platform",
  description:
    "Details on strictly necessary HTTP-only authentication cookies and optional first-party UTM attribution storage used on Loopa.",
  alternates: { canonical: "/cookies" },
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-6 text-sm leading-relaxed text-muted">
      <div className="border-b border-border pb-5">
        <span className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          Cookie & Storage Disclosure · Last updated: {SITE_CONFIG.lastUpdated}
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-foreground">
          Cookie Policy
        </h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          1. Strictly Necessary Cookies
        </h2>
        <p>
          Loopa uses a single HTTP-only, SameSite-protected session cookie (
          <code>loopa_session</code>) to authenticate Business Owners, Managers,
          and Cashiers. This cookie is strictly necessary for security and
          cannot be disabled by merchant users.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          2. First-Party Preferences & UTM Attribution
        </h2>
        <p>
          We store your theme preference (<code>loopa_theme</code>) and cookie
          consent decision (<code>loopa_cookie_consent</code>) in browser{" "}
          <code>localStorage</code>. When you accept analytics cookies, first-party
          campaign parameters (<code>utm_source</code>, <code>utm_medium</code>,{" "}
          <code>utm_campaign</code>) are stored in <code>localStorage</code> to
          measure merchant signup conversions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">
          3. Managing Your Cookie Preferences
        </h2>
        <p>
          You can reset your cookie preference at any time by clearing site
          storage in your browser settings or contacting{" "}
          <a
            href={`mailto:${SITE_CONFIG.privacyEmail}`}
            className="underline text-foreground"
          >
            {SITE_CONFIG.privacyEmail}
          </a>
          .
        </p>
      </section>
    </div>
  );
}

