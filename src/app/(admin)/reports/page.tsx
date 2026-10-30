"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Download, Printer, Calendar, Users, Award } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";

export default function ReportsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10)
  );
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/summary?from=${encodeURIComponent(
          fromDate
        )}&to=${encodeURIComponent(toDate + "T23:59:59Z")}`
      );
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-surface border border-border rounded animate-pulse" />
        <div className="h-64 bg-surface border border-border rounded animate-pulse" />
      </div>
    );
  }

  const { metrics, retention, topCustomers, staffActivity, currency } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Reports, Retention & CSV Exports
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Analyze repeat-customer retention, top spenders, points liability,
            and staff counter activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-border bg-surface hover:bg-surface-elevated"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Date Range Filter & CSV Export Bar (RPT-04, RPT-05) */}
      <div className="p-4 rounded bg-surface border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-accent" />
          <span className="font-semibold text-foreground">Date Range:</span>
          <input
            type="date"
            aria-label="Report start date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-border bg-background"
          />
          <span className="text-muted">to</span>
          <input
            type="date"
            aria-label="Report end date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-border bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-muted">CSV Exports:</span>
          {(["customers", "purchases", "transactions", "claims"] as const).map(
            (type) => (
              <a
                key={type}
                href={`/api/reports/export?type=${type}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 font-medium rounded border border-border bg-surface-elevated hover:bg-surface capitalize text-foreground"
              >
                <Download className="w-3 h-3 text-accent" />
                <span>{type}.csv</span>
              </a>
            )
          )}
        </div>
      </div>

      {/* Retention & Liability Summary (RPT-02, RPT-07) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded bg-surface border border-border">
          <div className="text-xs font-mono uppercase text-muted">
            Period Purchase Value
          </div>
          <div className="mt-1.5 text-2xl font-extrabold font-mono text-foreground">
            {formatCurrency(metrics.purchaseValueInPeriod, currency)}
          </div>
          <div className="text-xs text-muted mt-1">
            {metrics.purchasesInPeriod} purchases in selected range
          </div>
        </div>

        <div className="p-4 rounded bg-surface border border-border">
          <div className="text-xs font-mono uppercase text-muted">
            Repeat-Visit Retention Rate
          </div>
          <div className="mt-1.5 text-2xl font-extrabold font-mono text-accent">
            {retention.repeatRatePercent}%
          </div>
          <div className="text-xs text-muted mt-1">
            {retention.repeatCustomers} of {retention.activeVisitors} customers
            visited 2+ times
          </div>
        </div>

        <div className="p-4 rounded bg-surface border border-border">
          <div className="text-xs font-mono uppercase text-muted">
            Points Redemption Rate
          </div>
          <div className="mt-1.5 text-2xl font-extrabold font-mono text-foreground">
            {metrics.pointsIssued > 0
              ? Math.round(
                  (metrics.pointsRedeemed / metrics.pointsIssued) * 100
                )
              : 0}
            %
          </div>
          <div className="text-xs text-muted mt-1">
            {metrics.pointsRedeemed} redeemed of {metrics.pointsIssued} issued
          </div>
        </div>

        <div className="p-4 rounded bg-surface border border-border">
          <div className="text-xs font-mono uppercase text-muted">
            Total Outstanding Liability
          </div>
          <div className="mt-1.5 text-2xl font-extrabold font-mono text-foreground">
            {formatCurrency(metrics.outstandingLiabilityInr, currency)}
          </div>
          <div className="text-xs text-muted mt-1">
            {metrics.outstandingPoints} unredeemed pts +{" "}
            {formatCurrency(metrics.outstandingCredit, currency)} credit
          </div>
        </div>
      </div>

      {/* Top Customers by Spend & Visits (RPT-06) */}
      <section className="border border-border bg-surface rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          <h2 className="text-base font-bold text-foreground">
            Top Customers by Lifetime Spend & Visits
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Card #</th>
                <th className="py-3 px-4 text-right">Approved Visits</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-right">Points Balance</th>
                <th className="py-3 px-4 text-right">Store Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topCustomers.map(
                (c: {
                  id: string;
                  full_name: string;
                  phone: string;
                  card_number: string;
                  visit_count: number;
                  lifetime_purchase_amount: number;
                  points_balance: number;
                  redeemable_amount: number;
                }) => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-bold text-foreground">
                      {c.full_name}{" "}
                      <span className="font-mono font-normal text-muted">
                        ({c.phone})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{c.card_number}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {c.visit_count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      {formatCurrency(c.lifetime_purchase_amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {c.points_balance} pts
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-accent">
                      {formatCurrency(c.redeemable_amount, currency)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Staff Activity Report (RPT-08) */}
      <section className="border border-border bg-surface rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          <h2 className="text-base font-bold text-foreground">
            Staff Counter Activity Report
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Purchases Recorded</th>
                <th className="py-3 px-4 text-right">Redemptions Processed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffActivity.map(
                (s: {
                  id: string;
                  full_name: string;
                  email: string;
                  role: string;
                  purchases_recorded: number;
                  redemptions_processed: number;
                }) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">
                        {s.full_name}
                      </div>
                      <div className="text-muted font-mono">{s.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.role} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {s.purchases_recorded}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {s.redemptions_processed}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

