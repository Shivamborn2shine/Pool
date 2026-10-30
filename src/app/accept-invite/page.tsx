"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/marketing/public-shell";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not accept invitation.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while joining workspace.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md border border-border bg-surface rounded p-6 sm:p-8 shadow-sm">
      <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-surface-elevated border border-border text-accent">
        Staff Invitation
      </span>
      <h1 className="mt-3 text-2xl font-bold text-foreground">
        Accept Staff Invitation
      </h1>
      <p className="mt-1 text-sm text-muted">
        Complete your staff profile and set a password to access your business
        loyalty workspace.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="invite-name"
            className="block text-xs font-semibold uppercase tracking-wider text-foreground"
          >
            Your Full Name <span className="text-red-600">*</span>
          </label>
          <input
            id="invite-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Rohan Kulkarni"
            className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
          />
        </div>

        <div>
          <label
            htmlFor="invite-phone"
            className="block text-xs font-semibold uppercase tracking-wider text-foreground"
          >
            Phone Number
          </label>
          <input
            id="invite-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98450 00000"
            className="mt-1.5 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
          />
        </div>

        <div>
          <label
            htmlFor="invite-password"
            className="block text-xs font-semibold uppercase tracking-wider text-foreground"
          >
            Choose Password (8+ characters) <span className="text-red-600">*</span>
          </label>
          <input
            id="invite-password"
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
          disabled={loading || !token}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Join Business Workspace</span>
        </button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <>
      <PublicHeader />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-12"
      >
        <Suspense fallback={<div className="p-8 text-sm">Loading...</div>}>
          <AcceptInviteForm />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}

