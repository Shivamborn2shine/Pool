"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Search, Download, Loader2 } from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchasesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customers, setCustomers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [category, setCategory] = useState("Counter Order");
  const [notes, setNotes] = useState("");
  const [overridePoints, setOverridePoints] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadData = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const [custRes, purRes] = await Promise.all([
        fetch("/api/customers"),
        fetch(`/api/purchases${q ? `?q=${encodeURIComponent(q)}` : ""}`),
      ]);
      const custJson = await custRes.json();
      const purJson = await purRes.json();

      if (custRes.ok) {
        const list = custJson.customers || [];
        setCustomers(list);
        if (list.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(list[0].id);
        }
      }
      if (purRes.ok) {
        setPurchases(purJson.purchases || []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery, loadData]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const estimatedPoints =
    Number(amount) >= 50 ? Math.min(500, Math.floor(Number(amount) / 10)) : 0;

  async function handleRecordPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) return;
    setFeedback(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          cardId: selectedCustomer.card_id,
          amount: Number(amount),
          receiptNumber: receiptNumber || null,
          category: category || null,
          notes: notes || null,
          overridePoints: overridePoints ? Number(overridePoints) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Failed to record purchase.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `Recorded ₹${amount} for ${selectedCustomer.full_name} (+${json.purchase.points_awarded} points granted).`,
        });
        setAmount("");
        setReceiptNumber("");
        setNotes("");
        setOverridePoints("");
        await loadData(searchQuery);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Counter Purchases & Points Terminal
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Record customer bills at the counter and grant loyalty points
            atomically.
          </p>
        </div>

        <a
          href="/api/reports/export?type=purchases"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Purchases CSV</span>
        </a>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded border text-xs font-medium ${
            feedback.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Counter Purchase Recording Form */}
      <form
        onSubmit={handleRecordPurchase}
        className="p-5 rounded bg-surface border border-border space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <span>Record New Counter Purchase</span>
          </div>
          {Number(amount) > 0 && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-xs bg-surface-elevated border border-border text-accent font-bold">
              Auto-Calculated: +{overridePoints || estimatedPoints} pts
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label
              htmlFor="pos-customer"
              className="block font-semibold uppercase tracking-wider text-foreground"
            >
              Select Customer Card <span className="text-red-600">*</span>
            </label>
            <select
              id="pos-customer"
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} — {c.phone} ({c.card_number} ·{" "}
                  {c.points_balance} pts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="pos-amount"
              className="block font-semibold uppercase tracking-wider text-foreground"
            >
              Purchase Amount (₹) <span className="text-red-600">*</span>
            </label>
            <input
              id="pos-amount"
              type="number"
              step="0.01"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 680"
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="pos-receipt"
              className="block font-semibold uppercase tracking-wider text-foreground"
            >
              Receipt / Invoice #
            </label>
            <input
              id="pos-receipt"
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="INV-2026-109"
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label
              htmlFor="pos-category"
              className="block font-semibold uppercase tracking-wider text-foreground"
            >
              Category
            </label>
            <input
              id="pos-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="pos-notes"
              className="block font-semibold uppercase tracking-wider text-foreground"
            >
              Order Notes
            </label>
            <input
              id="pos-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional order notes"
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="pos-override"
              className="block font-semibold uppercase tracking-wider text-foreground"
            >
              Override Points (Owner/Manager)
            </label>
            <input
              id="pos-override"
              type="number"
              min="0"
              value={overridePoints}
              onChange={(e) => setOverridePoints(e.target.value)}
              placeholder="Leave blank for auto rule"
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !selectedCustomer}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Confirm Purchase & Issue Points</span>
          </button>
        </div>
      </form>

      {/* Search & Filter Purchase History */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search purchases by customer name, phone, card #, or receipt number..."
          aria-label="Search purchase history"
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded border border-border bg-surface text-foreground"
        />
      </div>

      {loading ? (
        <div className="h-48 bg-surface border border-border rounded animate-pulse" />
      ) : purchases.length === 0 ? (
        <EmptyState
          title="No purchases found"
          description="Use the terminal above to record a customer purchase."
        />
      ) : (
        <div className="border border-border bg-surface rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer & Card</th>
                  <th className="py-3 px-4">Receipt & Notes</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Points Granted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-elevated/50">
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {formatDate(p.purchase_date, true)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">
                        {p.customer_name}
                      </div>
                      <div className="font-mono text-muted">{p.card_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-foreground">
                        {p.receipt_number || "—"}
                      </div>
                      <div className="text-muted">{p.notes || p.category}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.source} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{p.points_awarded} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

