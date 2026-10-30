"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/marketing/public-shell";
import { trackEvent } from "@/lib/analytics";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    trackEvent("form_submit", { form: "login" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        setLoading(false);
        return;
      }

      trackEvent("form_submit_success", { form: "login" });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while signing in. Please try again.");
      setLoading(false);
    }
  }

  function fillDemoRole(roleEmail: string) {
    setEmail(roleEmail);
    setPassword("Loopa@2026");
    setError(null);
  }

  return (
    <>
      <PublicHeader />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md border border-border bg-surface rounded p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-surface-elevated border border-border text-muted">
              Merchant Access
            </span>
            <Link
              href="/card/cd_araku_ananya_01"
              className="text-xs text-accent hover:underline font-medium"
            >
              Customer Card Demo →
            </Link>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-foreground">
            Sign in to Loopa
          </h1>
          <p className="mt-1 text-sm text-muted">
            Access your counter loyalty terminal, claims queue, and ledger.
          </p>

          {/* Instant Demo Credentials Selector */}
          <div className="mt-5 p-3 rounded bg-surface-elevated border border-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <KeyRound className="w-3.5 h-3.5 text-accent" />
              <span>One-click Demo Credentials (Araku Filter Coffee):</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoRole("owner@arakucoffee.in")}
                className="px-2 py-1.5 text-xs font-medium rounded border border-border bg-surface hover:bg-accent hover:text-white hover:border-accent transition-colors text-foreground"
              >
                Owner + Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoRole("manager@arakucoffee.in")}
                className="px-2 py-1.5 text-xs font-medium rounded border border-border bg-surface hover:bg-accent hover:text-white hover:border-accent transition-colors text-foreground"
              >
                Store Manager
              </button>
              <button
                type="button"
                onClick={() => fillDemoRole("cashier@arakucoffee.in")}
                className="px-2 py-1.5 text-xs font-medium rounded border border-border bg-surface hover:bg-accent hover:text-white hover:border-accent transition-colors text-foreground"
              >
                Counter Cashier
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                Work Email <span className="text-red-600">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@arakucoffee.in"
                className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Password <span className="text-red-600">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted hover:text-foreground underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Signing in..." : "Sign in to Dashboard"}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>New business on Loopa?</span>
            <Link
              href="/register"
              className="font-semibold text-accent hover:underline"
            >
              Create business account →
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Protected by HTTP-only session cookies and role-based access
              controls.
            </span>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

