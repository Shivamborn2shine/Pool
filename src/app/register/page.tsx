"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/marketing/public-shell";
import { getStoredUtmParams, trackEvent } from "@/lib/analytics";
import { SITE_CONFIG } from "@/lib/site-config";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const utms = getStoredUtmParams();
    trackEvent("signup_start", { businessName });

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          businessName,
          email,
          phone,
          password,
          currency,
          timezone,
          utmSource: utms.utm_source,
          utmMedium: utms.utm_medium,
          utmCampaign: utms.utm_campaign,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        setLoading(false);
        return;
      }

      trackEvent("signup_success", { businessName });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main id="main-content" className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-5">
            <span className="inline-block px-2.5 py-1 text-xs font-mono uppercase tracking-wider bg-surface-elevated border border-border rounded-xs text-accent">
              2-Minute Merchant Setup
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Launch your digital QR loyalty program today.
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              Replace paper stamp cards and messy spreadsheets with an auditable
              points and store-credit ledger that works in any mobile browser.
            </p>

            <ul className="space-y-3 text-sm text-foreground pt-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Default rules pre-configured:</strong> 1 point per ₹10
                  spent, 100 points = ₹100 store credit (customizable anytime).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant printable QR cards:</strong> Download SVG/PNG
                  QR codes or print branded counter cards immediately.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Role-based staff security:</strong> Invite Managers
                  and Cashiers with strict adjustment limits.
                </span>
              </li>
            </ul>

            <div className="p-4 border border-border bg-surface rounded text-xs text-muted">
              <strong>Guarantee:</strong> {SITE_CONFIG.guarantee}
            </div>
          </div>

          <div className="lg:col-span-7 border border-border bg-surface rounded p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">
              Create your Owner & Business Profile
            </h2>
            <p className="text-xs text-muted mt-1">
              All fields marked with <span className="text-red-600">*</span> are
              required.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 p-3 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Your Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aditi Sharma"
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-business"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Business Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="reg-business"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Copper Kettle Café"
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Work Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aditi@copperkettle.in"
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Business Phone
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-currency"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Default Currency
                  </label>
                  <select
                    id="reg-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  >
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="reg-timezone"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Business Timezone
                  </label>
                  <select
                    id="reg-timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Password (8+ characters) <span className="text-red-600">*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {loading
                    ? "Creating business workspace..."
                    : "Launch Loyalty Program"}
                </span>
              </button>

              <p className="text-[11px] text-muted text-center">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

