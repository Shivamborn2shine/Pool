"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  ShoppingBag,
  ClipboardCheck,
  Gift,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardSummary {
  metrics: {
    totalCustomers: number;
    activeCards: number;
    totalCards: number;
    purchasesInPeriod: number;
    purchaseValueInPeriod: number;
    pointsIssued: number;
    pointsRedeemed: number;
    pendingClaims: number;
    pendingRedemptions: number;
    outstandingPoints: number;
    outstandingCredit: number;
    outstandingLiabilityInr: number;
  };
  recentTransactions: Array<{
    id: string;
    card_number: string;
    customer_name: string;
    type: string;
    points_change: number;
    amount_change: number;
    description: string;
    created_at: string;
  }>;
  currency: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reports/summary");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Could not load dashboard metrics.");
        } else {
          setData(json);
        }
      } catch {
        setError("Network error loading dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-surface border border-border rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-surface border border-border rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded text-sm text-red-700">
        {error || "Failed to load dashboard."}
      </div>
    );
  }

  const { metrics, recentTransactions, currency } = data;

  const statCards = [
    {
      label: "Total Customers",
      value: metrics.totalCustomers.toLocaleString(),
      sub: `${metrics.activeCards} active QR cards`,
    },
    {
      label: "Active Loyalty Cards",
      value: metrics.activeCards.toLocaleString(),
      sub: `${metrics.totalCards} total cards issued`,
    },
    {
      label: "Purchases This Month",
      value: metrics.purchasesInPeriod.toLocaleString(),
      sub: "Approved counter & claim bills",
    },
    {
      label: "Purchase Value (Month)",
      value: formatCurrency(metrics.purchaseValueInPeriod, currency),
      sub: "Tracked loyalty revenue",
    },
    {
      label: "Lifetime Points Issued",
      value: metrics.pointsIssued.toLocaleString(),
      sub: "Across all active cards",
    },
    {
      label: "Lifetime Points Redeemed",
      value: metrics.pointsRedeemed.toLocaleString(),
      sub: `${metrics.pendingRedemptions} requests awaiting fulfillment`,
    },
    {
      label: "Pending Purchase Claims",
      value: metrics.pendingClaims.toLocaleString(),
      sub: "Customer receipt submissions",
      highlight: metrics.pendingClaims > 0,
    },
    {
      label: "Outstanding Liability",
      value: formatCurrency(metrics.outstandingLiabilityInr, currency),
      sub: `${metrics.outstandingPoints} pts + ${formatCurrency(
        metrics.outstandingCredit,
        currency
      )} credit`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Quick Actions (PRD Section 10.2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Loyalty Program Overview
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Real-time customer card balances, counter activity, and points
            liability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/customers?new=1"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </Link>
          <Link
            href="/purchases"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Record Purchase</span>
          </Link>
          <Link
            href="/claims"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Review Claims ({metrics.pendingClaims})</span>
          </Link>
          <Link
            href="/rewards"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Create Reward</span>
          </Link>
        </div>
      </div>

      {/* Pending Action Alert Banner */}
      {(metrics.pendingClaims > 0 || metrics.pendingRedemptions > 0) && (
        <div className="p-4 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Action Required:</strong> You have{" "}
              <strong>{metrics.pendingClaims}</strong> pending customer purchase
              claim(s) and <strong>{metrics.pendingRedemptions}</strong> reward
              redemption request(s) awaiting staff fulfillment.
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/claims"
              className="px-3 py-1.5 rounded bg-amber-800 text-white font-semibold hover:bg-amber-900"
            >
              Open Claims Queue
            </Link>
            <Link
              href="/rewards"
              className="px-3 py-1.5 rounded border border-amber-300 bg-white dark:bg-zinc-900 text-foreground font-semibold"
            >
              Fulfill Redemptions
            </Link>
          </div>
        </div>
      )}

      {/* 8 KPI Metric Cards */}
      <section
        aria-label="Program performance metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`p-4 rounded bg-surface border ${
              card.highlight
                ? "border-accent"
                : "border-border"
            }`}
          >
            <div className="text-xs font-mono uppercase tracking-wider text-muted">
              {card.label}
            </div>
            <div className="mt-2 text-2xl font-extrabold text-foreground font-mono">
              {card.value}
            </div>
            <div className="mt-1 text-xs text-muted">{card.sub}</div>
          </div>
        ))}
      </section>

      {/* Recent Ledger Activity */}
      <section className="border border-border bg-surface rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Recent Ledger Transactions
            </h2>
            <p className="text-xs text-muted">
              Immutable audit log of earned points, store credit, and
              redemptions.
            </p>
          </div>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            <span>Full Reports & CSV</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No ledger activity yet"
              description="Record your first customer purchase to start issuing loyalty points."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Customer & Card</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Points Δ</th>
                  <th className="py-2.5 px-4 text-right">Amount Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-elevated/50">
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {formatDate(tx.created_at, true)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">
                        {tx.customer_name}
                      </div>
                      <div className="font-mono text-[11px] text-muted">
                        {tx.card_number}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tx.type} />
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          tx.points_change > 0
                            ? "text-emerald-600"
                            : tx.points_change < 0
                            ? "text-red-600"
                            : "text-muted"
                        }
                      >
                        {tx.points_change > 0
                          ? `+${tx.points_change}`
                          : tx.points_change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {Number(tx.amount_change) !== 0
                        ? formatCurrency(tx.amount_change, currency)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

