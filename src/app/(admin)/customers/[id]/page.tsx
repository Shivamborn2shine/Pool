"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Printer,
  Download,
  ExternalLink,
  ShoppingBag,
  Gift,
  Sliders,
  Snowflake,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  CopyButton,
  StatusBadge,
  ConfirmModal,
} from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Quick Record Purchase
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [recordingPurchase, setRecordingPurchase] = useState(false);

  // Quick Redemption
  const [redeemType, setRedeemType] = useState<"reward" | "store_credit">(
    "reward"
  );
  const [selectedRewardId, setSelectedRewardId] = useState("");
  const [creditRedeemAmt, setCreditRedeemAmt] = useState("");
  const [processingRedeem, setProcessingRedeem] = useState(false);

  // Manual Balance Adjustment (BAL-08, BAL-09)
  const [walletType, setWalletType] = useState<"points" | "credit">("points");
  const [deltaValue, setDeltaValue] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [applyingAdj, setApplyingAdj] = useState(false);

  // Card status confirmation modal
  const [statusModalTarget, setStatusModalTarget] = useState<
    "active" | "frozen" | "closed" | null
  >(null);

  const loadDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.rewards?.[0]?.id && !selectedRewardId) {
          setSelectedRewardId(json.rewards[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [customerId, selectedRewardId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function handleQuickPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.card) return;
    setFeedback(null);
    setRecordingPurchase(true);

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customer.id,
          cardId: data.card.id,
          amount: Number(purchaseAmount),
          receiptNumber: receiptNumber || null,
          notes: purchaseNotes || null,
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
          text: `Purchase recorded! +${json.purchase.points_awarded} points added immediately.`,
        });
        setPurchaseAmount("");
        setReceiptNumber("");
        setPurchaseNotes("");
        await loadDetail();
      }
    } finally {
      setRecordingPurchase(false);
    }
  }

  async function handleQuickRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.card) return;
    setFeedback(null);
    setProcessingRedeem(true);

    try {
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: data.card.id,
          redemptionType: redeemType,
          rewardId: redeemType === "reward" ? selectedRewardId : null,
          creditAmount:
            redeemType === "store_credit" ? Number(creditRedeemAmt) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Redemption failed.",
        });
      } else {
        setFeedback({
          type: "success",
          text: "Redemption fulfilled and immutable transaction written!",
        });
        setCreditRedeemAmt("");
        await loadDetail();
      }
    } finally {
      setProcessingRedeem(false);
    }
  }

  async function handleManualAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.card) return;
    setFeedback(null);
    setApplyingAdj(true);

    try {
      const res = await fetch("/api/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: data.card.id,
          walletType,
          pointsDelta: walletType === "points" ? Number(deltaValue) : 0,
          amountDelta: walletType === "credit" ? Number(deltaValue) : 0,
          reason: adjReason,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Adjustment failed.",
        });
      } else if (json.queuedForApproval) {
        setFeedback({
          type: "success",
          text: json.message,
        });
        setDeltaValue("");
        setAdjReason("");
      } else {
        setFeedback({
          type: "success",
          text: "Manual adjustment applied and logged to audit trail.",
        });
        setDeltaValue("");
        setAdjReason("");
        await loadDetail();
      }
    } finally {
      setApplyingAdj(false);
    }
  }

  async function handleCardStatusChange() {
    if (!statusModalTarget) return;
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardStatus: statusModalTarget }),
    });
    if (res.ok) {
      setFeedback({
        type: "success",
        text: `Card status updated to ${statusModalTarget}.`,
      });
      setStatusModalTarget(null);
      await loadDetail();
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-surface border border-border rounded animate-pulse" />
        <div className="h-64 bg-surface border border-border rounded animate-pulse" />
      </div>
    );
  }

  if (!data?.customer || !data?.card) {
    return (
      <div className="p-6 border border-border bg-surface rounded">
        Customer not found.{" "}
        <Link href="/customers" className="underline text-accent">
          Back to Customers
        </Link>
      </div>
    );
  }

  const { customer, card, qrDataUrl, publicCardUrl, transactions, rewards, business, role } =
    data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-border bg-surface hover:bg-surface-elevated"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Branded Card</span>
          </button>

          <a
            href={`/api/customers/${customer.id}/cards/${card.id}/qr?format=png`}
            download={`${card.card_number}.png`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-border bg-surface hover:bg-surface-elevated"
          >
            <Download className="w-3.5 h-3.5" />
            <span>QR PNG</span>
          </a>

          <a
            href={`/api/customers/${customer.id}/cards/${card.id}/qr?format=svg`}
            download={`${card.card_number}.svg`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-border bg-surface hover:bg-surface-elevated"
          >
            <Download className="w-3.5 h-3.5" />
            <span>QR SVG</span>
          </a>

          <Link
            href={`/card/${card.public_id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-accent text-white"
          >
            <span>Open Public Card</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded border text-xs font-medium no-print ${
            feedback.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Printable Loyalty Card & Customer Summary (CARD-05, CARD-06) */}
      <section className="print-card border border-border bg-surface rounded p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
                {business.name}
              </span>
              <StatusBadge status={card.status} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {customer.full_name}
            </h1>
            <div className="text-xs text-muted font-mono space-x-2">
              <span>Phone: {customer.phone}</span>
              {customer.email && <span>· Email: {customer.email}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-surface-elevated border border-border rounded-xs">
                Card #{card.card_number}
              </span>
              <CopyButton value={card.card_number} label="Copy #" />
              {publicCardUrl && (
                <CopyButton value={publicCardUrl} label="Copy Public URL" />
              )}
            </div>
          </div>

          {/* QR Code for Print / Counter Scan */}
          {qrDataUrl && (
            <div className="flex items-center gap-4 bg-white p-3 border border-zinc-200 rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Code for ${card.card_number}`}
                width={112}
                height={112}
                className="w-28 h-28"
              />
              <div className="text-xs text-zinc-800 max-w-[160px] space-y-1">
                <div className="font-bold">{business.name}</div>
                <div className="text-[11px] text-zinc-600">
                  Scan with any phone camera to check points, rewards & submit
                  bills.
                </div>
                <div className="font-mono text-[10px] font-semibold">
                  {card.card_number}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Balance Metrics Bar */}
        <div className="mt-6 pt-5 border-t border-border grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase text-muted">
              Points Balance
            </div>
            <div className="mt-1 text-xl font-extrabold font-mono text-foreground">
              {card.points_balance} pts
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-muted">
              Store Credit Wallet
            </div>
            <div className="mt-1 text-xl font-extrabold font-mono text-accent">
              {formatCurrency(card.redeemable_amount, business.currency)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-muted">
              Pending Claim Points
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-foreground">
              +{card.pending_points} pts
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-muted">
              Lifetime Earned / Redeemed
            </div>
            <div className="mt-1 text-sm font-mono font-bold text-foreground">
              {card.lifetime_points_earned} / {card.lifetime_points_redeemed} pts
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-muted">
              Lifetime Spend
            </div>
            <div className="mt-1 text-sm font-mono font-bold text-foreground">
              {formatCurrency(card.lifetime_purchase_amount, business.currency)}
            </div>
          </div>
        </div>
      </section>

      {/* Counter Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 no-print">
        {/* 1. Record Purchase */}
        <form
          onSubmit={handleQuickPurchase}
          className="p-5 rounded bg-surface border border-border space-y-3"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <span>Record Counter Purchase</span>
          </div>
          <div>
            <label
              htmlFor="qp-amount"
              className="block text-xs font-semibold uppercase text-muted"
            >
              Purchase Amount ({business.currency}) *
            </label>
            <input
              id="qp-amount"
              type="number"
              step="0.01"
              min="1"
              required
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="e.g. 540"
              className="mt-1 w-full px-3 py-1.5 text-sm rounded border border-border bg-background"
            />
          </div>
          <div>
            <label
              htmlFor="qp-receipt"
              className="block text-xs font-semibold uppercase text-muted"
            >
              Receipt / Bill #
            </label>
            <input
              id="qp-receipt"
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="INV-1042"
              className="mt-1 w-full px-3 py-1.5 text-sm rounded border border-border bg-background"
            />
          </div>
          <div>
            <label
              htmlFor="qp-notes"
              className="block text-xs font-semibold uppercase text-muted"
            >
              Notes
            </label>
            <input
              id="qp-notes"
              type="text"
              value={purchaseNotes}
              onChange={(e) => setPurchaseNotes(e.target.value)}
              placeholder="Counter order"
              className="mt-1 w-full px-3 py-1.5 text-sm rounded border border-border bg-background"
            />
          </div>
          <button
            type="submit"
            disabled={recordingPurchase || card.status !== "active"}
            className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {recordingPurchase && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            <span>Grant Points & Record Bill</span>
          </button>
        </form>

        {/* 2. Redeem Reward or Store Credit */}
        <form
          onSubmit={handleQuickRedeem}
          className="p-5 rounded bg-surface border border-border space-y-3"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Gift className="w-4 h-4 text-accent" />
            <span>Direct Counter Redemption</span>
          </div>
          <div>
            <label
              htmlFor="qr-type"
              className="block text-xs font-semibold uppercase text-muted"
            >
              Redemption Mode
            </label>
            <select
              id="qr-type"
              value={redeemType}
              onChange={(e) =>
                setRedeemType(e.target.value as "reward" | "store_credit")
              }
              className="mt-1 w-full px-3 py-1.5 text-sm rounded border border-border bg-background"
            >
              <option value="reward">Catalog Reward (Deduct Points)</option>
              <option value="store_credit">
                Store Credit Wallet (Deduct ₹)
              </option>
            </select>
          </div>

          {redeemType === "reward" ? (
            <div>
              <label
                htmlFor="qr-reward"
                className="block text-xs font-semibold uppercase text-muted"
              >
                Select Reward
              </label>
              <select
                id="qr-reward"
                value={selectedRewardId}
                onChange={(e) => setSelectedRewardId(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 text-sm rounded border border-border bg-background"
              >
                {rewards.map(
                  (r: {
                    id: string;
                    name: string;
                    points_required: number;
                  }) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.points_required} pts)
                    </option>
                  )
                )}
              </select>
            </div>
          ) : (
            <div>
              <label
                htmlFor="qr-credit"
                className="block text-xs font-semibold uppercase text-muted"
              >
                Store Credit to Redeem (Available: ₹{card.redeemable_amount})
              </label>
              <input
                id="qr-credit"
                type="number"
                step="0.01"
                min="1"
                max={card.redeemable_amount}
                required
                value={creditRedeemAmt}
                onChange={(e) => setCreditRedeemAmt(e.target.value)}
                placeholder="e.g. 100"
                className="mt-1 w-full px-3 py-1.5 text-sm rounded border border-border bg-background"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={processingRedeem || card.status !== "active"}
            className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
          >
            {processingRedeem && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            <span>Confirm Counter Redemption</span>
          </button>
        </form>

        {/* 3. Manual Balance Adjustment & Card Status (Owner/Manager) */}
        <div className="p-5 rounded bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Sliders className="w-4 h-4 text-accent" />
              <span>Manual Adjustment</span>
            </div>
            <span className="text-[11px] font-mono text-muted">
              Role: {role}
            </span>
          </div>

          {role === "cashier" ? (
            <p className="text-xs text-muted">
              Cashiers cannot perform manual balance adjustments. Ask a Manager
              or Owner.
            </p>
          ) : (
            <form onSubmit={handleManualAdjustment} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Wallet type"
                  value={walletType}
                  onChange={(e) =>
                    setWalletType(e.target.value as "points" | "credit")
                  }
                  className="px-2.5 py-1.5 text-xs rounded border border-border bg-background"
                >
                  <option value="points">Points Wallet</option>
                  <option value="credit">Store Credit (₹)</option>
                </select>
                <input
                  type="number"
                  required
                  value={deltaValue}
                  onChange={(e) => setDeltaValue(e.target.value)}
                  placeholder="e.g. 100 or -50"
                  aria-label="Adjustment delta"
                  className="px-2.5 py-1.5 text-xs font-mono rounded border border-border bg-background"
                />
              </div>
              <input
                type="text"
                required
                minLength={4}
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Audit reason (required)"
                aria-label="Adjustment audit reason"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background"
              />
              <button
                type="submit"
                disabled={applyingAdj}
                className="w-full py-1.5 text-xs font-semibold rounded border border-border bg-surface-elevated hover:bg-surface text-foreground"
              >
                {applyingAdj ? "Saving..." : "Apply Manual Adjustment"}
              </button>
            </form>
          )}

          {/* Freeze / Activate / Close Card Controls (CUST-08) */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5" />
              <span>Card Status:</span>
            </span>
            <div className="flex gap-1.5">
              {card.status !== "active" && (
                <button
                  type="button"
                  onClick={() => setStatusModalTarget("active")}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-emerald-300 text-emerald-700"
                >
                  Activate
                </button>
              )}
              {card.status !== "frozen" && (
                <button
                  type="button"
                  onClick={() => setStatusModalTarget("frozen")}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-amber-300 text-amber-800"
                >
                  Freeze
                </button>
              )}
              {card.status !== "closed" && (
                <button
                  type="button"
                  onClick={() => setStatusModalTarget("closed")}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-red-300 text-red-700"
                >
                  Close Card
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Ledger Table */}
      <section className="border border-border bg-surface rounded overflow-hidden no-print">
        <div className="px-5 py-3.5 border-b border-border font-bold text-sm text-foreground">
          Customer Transaction Ledger ({transactions.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Points Δ</th>
                <th className="py-2.5 px-4 text-right">Credit/Bill Δ</th>
                <th className="py-2.5 px-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map(
                (t: {
                  id: string;
                  created_at: string;
                  type: string;
                  description: string;
                  points_change: number;
                  amount_change: number;
                  points_balance_after: number;
                  redeemable_amount_after: number;
                }) => (
                  <tr key={t.id}>
                    <td className="py-2.5 px-4 text-muted">
                      {formatDate(t.created_at, true)}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={t.type} />
                    </td>
                    <td className="py-2.5 px-4 text-foreground">
                      {t.description}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      {t.points_change > 0
                        ? `+${t.points_change}`
                        : t.points_change}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {Number(t.amount_change) !== 0
                        ? formatCurrency(t.amount_change, business.currency)
                        : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-muted">
                      {t.points_balance_after} pts ·{" "}
                      {formatCurrency(
                        t.redeemable_amount_after,
                        business.currency
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmModal
        open={Boolean(statusModalTarget)}
        title={`Change Card Status to ${statusModalTarget?.toUpperCase()}`}
        description={
          statusModalTarget === "active"
            ? "Reactivating this card will allow the customer to earn points and redeem rewards again."
            : "Frozen or closed cards cannot earn new points, submit claims, or redeem rewards."
        }
        recordName={`${customer.full_name} (${card.card_number})`}
        confirmLabel={`Set Status: ${statusModalTarget}`}
        variant={statusModalTarget === "active" ? "primary" : "destructive"}
        onConfirm={handleCardStatusChange}
        onClose={() => setStatusModalTarget(null)}
      />
    </div>
  );
}

