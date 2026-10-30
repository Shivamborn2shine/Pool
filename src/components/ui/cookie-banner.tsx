"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { captureUtmParamsFromUrl } from "@/lib/analytics";

const CONSENT_KEY = "loopa_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    captureUtmParamsFromUrl();
    const existing = window.localStorage.getItem(CONSENT_KEY);
    if (!existing) {
      setVisible(true);
    }
  }, []);

  function handleDecision(choice: "accepted" | "rejected" | "custom") {
    const value =
      choice === "custom"
        ? analyticsEnabled
          ? "accepted"
          : "rejected"
        : choice;
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie consent preferences"
      className="cookie-banner no-print fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-50 bg-surface border border-border rounded p-4 shadow-xl"
    >
      <div className="text-sm font-semibold text-foreground">
        Privacy & Cookie Preferences (DPDP Act 2023)
      </div>
      <p className="mt-1 text-xs text-muted leading-relaxed">
        Loopa uses essential HTTP-only session cookies to keep your loyalty card
        and merchant dashboard secure, plus optional first-party analytics to
        measure signup conversions. Read our{" "}
        <Link href="/cookies" className="underline hover:text-foreground">
          Cookie Policy
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>

      {showManage && (
        <div className="mt-3 p-2.5 bg-surface-elevated border border-border rounded space-y-2 text-xs">
          <label className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">
              Strictly Necessary Security Cookies
            </span>
            <input
              type="checkbox"
              checked
              disabled
              className="rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between gap-2 cursor-pointer">
            <span className="text-foreground">
              First-Party UTM & Conversion Analytics
            </span>
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="rounded border-border accent-accent"
            />
          </label>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleDecision("accepted")}
          className="px-3 py-1.5 text-xs font-medium rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={() => handleDecision("rejected")}
          className="px-3 py-1.5 text-xs font-medium rounded border border-border bg-surface text-foreground hover:bg-surface-elevated"
        >
          Reject non-essential
        </button>
        {showManage ? (
          <button
            type="button"
            onClick={() => handleDecision("custom")}
            className="px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent-hover"
          >
            Save preferences
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowManage(true)}
            className="px-2.5 py-1.5 text-xs font-medium text-muted hover:text-foreground underline"
          >
            Manage preferences
          </button>
        )}
      </div>
    </aside>
  );
}

