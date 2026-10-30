"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/marketing/public-shell";
import { CopyButton } from "@/components/ui/primitives";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not process request.");
      } else {
        setSuccessMessage(data.message);
        if (data.resetPreviewUrl) setPreviewUrl(data.resetPreviewUrl);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid or expired reset link.");
      } else {
        setSuccessMessage(data.message);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md border border-border bg-surface rounded p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">
        {tokenFromUrl ? "Set a new password" : "Reset your password"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {tokenFromUrl
          ? "Enter a new password of at least 8 characters for your Loopa account."
          : "Enter your work email and we will send an expiring 1-hour password reset link."}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mt-4 p-3 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 space-y-2"
        >
          <div>{successMessage}</div>
          {previewUrl && (
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
              <div className="font-semibold mb-1">
                Direct Reset Link Fallback:
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={previewUrl}
                  className="underline font-mono break-all text-[11px]"
                >
                  Open reset link
                </Link>
                <CopyButton value={previewUrl} label="Copy URL" />
              </div>
            </div>
          )}
        </div>
      )}

      {tokenFromUrl ? (
        <form onSubmit={handleConfirmReset} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="reset-new-password"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              New Password <span className="text-red-600">*</span>
            </label>
            <input
              id="reset-new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Update Password</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequestReset} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Work Email <span className="text-red-600">*</span>
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@arakucoffee.in"
              className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Send Reset Link</span>
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-border text-center text-xs">
        <Link href="/login" className="text-muted hover:text-foreground underline">
          ← Back to Sign in
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <>
      <PublicHeader />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-12"
      >
        <Suspense fallback={<div className="p-8 text-sm">Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

