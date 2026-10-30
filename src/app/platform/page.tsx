"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Eye, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PlatformAdminPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impersonationReason, setImpersonationReason] = useState(
    "Merchant support ticket investigation"
  );

  const loadPlatform = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Access denied.");
      } else {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatform();
  }, [loadPlatform]);

  async function handleUpdateStatus(businessId: string, status: string) {
    await fetch("/api/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_status",
        businessId,
        status,
      }),
    });
    await loadPlatform();
  }

  async function handleUpdatePlan(businessId: string, subscriptionPlan: string) {
    await fetch("/api/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_plan",
        businessId,
        subscriptionPlan,
      }),
    });
    await loadPlatform();
  }

  async function handleImpersonate(businessId: string) {
    const res = await fetch("/api/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "impersonate",
        businessId,
        reason: impersonationReason,
      }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="max-w-6xl mx-auto p-6">
        <div className="h-64 bg-surface border border-border rounded animate-pulse" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main id="main-content" className="max-w-xl mx-auto p-8 text-center">
        <div className="p-6 border border-red-200 bg-red-50 rounded text-sm text-red-700">
          {error || "Platform Admin access required."}
        </div>
        <Link
          href="/dashboard"
          className="inline-block mt-4 text-xs underline text-accent"
        >
          ← Back to Merchant Dashboard
        </Link>
      </main>
    );
  }

  const { businesses, fraudAlerts, platformLogs } = data;

  return (
    <main
      id="main-content"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-amber-100 text-amber-800">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Loopa SaaS Platform Administration
            </h1>
            <p className="text-xs text-muted">
              Manage tenant businesses, subscription tiers, fraud alerts, and
              audit-logged support impersonation (PLAT-01..05).
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-border bg-surface hover:bg-surface-elevated"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Merchant Workspace</span>
        </Link>
      </div>

      {/* Impersonation Reason Input (PLAT-03) */}
      <div className="p-4 rounded bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <strong className="text-foreground">
            Support Impersonation Audit Reason (Required for PLAT-03):
          </strong>
          <span className="text-muted ml-2">
            Every impersonation session is recorded in the immutable audit log.
          </span>
        </div>
        <input
          type="text"
          value={impersonationReason}
          onChange={(e) => setImpersonationReason(e.target.value)}
          aria-label="Impersonation audit reason"
          className="w-full sm:w-80 px-3 py-1.5 rounded border border-border bg-background text-foreground"
        />
      </div>

      {/* Tenant Businesses Table (PLAT-01, PLAT-02, PLAT-05) */}
      <section className="border border-border bg-surface rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-bold text-sm text-foreground">
          Tenant Businesses ({businesses.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-3 px-4">Business</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Customers / Cards</th>
                <th className="py-3 px-4 text-right">Purchases</th>
                <th className="py-3 px-4 text-right">Platform Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {businesses.map(
                (b: {
                  id: string;
                  name: string;
                  slug: string;
                  email: string | null;
                  subscription_plan: string;
                  status: string;
                  customer_count: number;
                  card_count: number;
                  purchase_count: number;
                }) => (
                  <tr key={b.id}>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{b.name}</div>
                      <div className="font-mono text-muted">
                        {b.slug} · {b.email || "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Subscription plan for ${b.name}`}
                        value={b.subscription_plan}
                        onChange={(e) =>
                          handleUpdatePlan(b.id, e.target.value)
                        }
                        className="px-2 py-1 rounded border border-border bg-background capitalize font-semibold"
                      >
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="scale">Scale</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {b.customer_count} / {b.card_count}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {b.purchase_count}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleImpersonate(b.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Impersonate</span>
                        </button>
                        {b.status === "suspended" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b.id, "active")}
                            className="px-2.5 py-1 rounded border border-emerald-300 text-emerald-700 font-semibold"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(b.id, "suspended")
                            }
                            className="px-2.5 py-1 rounded border border-red-300 text-red-700 font-semibold"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Abuse & Fraud Alerts (PLAT-04) */}
      <section className="border border-border bg-surface rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <h2 className="text-base font-bold text-foreground">
            Platform Fraud & Duplicate Claim Alerts ({fraudAlerts.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Business</th>
                <th className="py-2.5 px-4">Customer & Card</th>
                <th className="py-2.5 px-4">Flag</th>
                <th className="py-2.5 px-4">Reason</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fraudAlerts.map(
                (f: {
                  id: string;
                  created_at: string;
                  business_name: string;
                  customer_name: string;
                  card_number: string;
                  status: string;
                  review_note: string | null;
                  amount: number;
                }) => (
                  <tr key={f.id}>
                    <td className="py-2.5 px-4 text-muted">
                      {formatDate(f.created_at, true)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold">
                      {f.business_name}
                    </td>
                    <td className="py-2.5 px-4">
                      {f.customer_name} ({f.card_number})
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="py-2.5 px-4 text-muted">
                      {f.review_note || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      {formatCurrency(f.amount)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Platform Audit Trail */}
      <section className="border border-border bg-surface rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-bold text-sm text-foreground">
          Global Platform Audit Trail ({platformLogs.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Business</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {platformLogs.map(
                (l: {
                  id: string;
                  created_at: string;
                  business_name: string | null;
                  actor_email: string | null;
                  actor_role: string;
                  action: string;
                }) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-4 text-muted">
                      {formatDate(l.created_at, true)}
                    </td>
                    <td className="py-2.5 px-4">
                      {l.business_name || "Platform"}
                    </td>
                    <td className="py-2.5 px-4 font-mono">
                      {l.actor_email || l.actor_role}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-accent font-semibold">
                      {l.action}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

