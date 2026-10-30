"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Check, X, Loader2 } from "lucide-react";
import {
  StatusBadge,
  EmptyState,
  ConfirmModal,
} from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RewardsAndRedemptionsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rewards, setRewards] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [role, setRole] = useState("owner");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Create reward state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsRequired, setPointsRequired] = useState("150");
  const [monetaryValue, setMonetaryValue] = useState("200");
  const [stockLimit, setStockLimit] = useState("");
  const [creating, setCreating] = useState(false);

  // Cancel/Reject redemption modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rwRes, rdRes] = await Promise.all([
        fetch("/api/rewards"),
        fetch("/api/redemptions"),
      ]);
      const rwJson = await rwRes.json();
      const rdJson = await rdRes.json();
      if (rwRes.ok) {
        setRewards(rwJson.rewards || []);
        setRole(rwJson.role || "owner");
      }
      if (rdRes.ok) {
        setRedemptions(rdJson.redemptions || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleCreateReward(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setCreating(true);

    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          pointsRequired: Number(pointsRequired),
          monetaryValue: Number(monetaryValue),
          stockLimit: stockLimit ? Number(stockLimit) : null,
          status: "active",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Could not create reward." });
      } else {
        setFeedback({
          type: "success",
          text: `Reward "${json.reward.name}" published to customer cards.`,
        });
        setName("");
        setDescription("");
        setStockLimit("");
        await loadAll();
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleRewardStatus(rewardId: string, currentStatus: string) {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    const res = await fetch(`/api/rewards/${rewardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await loadAll();
    }
  }

  async function updateRedemptionStatus(
    redemptionId: string,
    status: "fulfilled" | "cancelled" | "rejected"
  ) {
    setFeedback(null);
    const res = await fetch("/api/redemptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        redemptionId,
        status,
        notes:
          status === "fulfilled"
            ? "Fulfilled at counter"
            : "Cancelled — balance reversed to customer card",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: json.error || "Action failed." });
    } else {
      setFeedback({
        type: "success",
        text:
          status === "fulfilled"
            ? "Reward marked as fulfilled!"
            : "Redemption cancelled and points/credit restored via reversal transaction.",
      });
      setCancelTarget(null);
      await loadAll();
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Rewards Catalog & Redemption Queue
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Manage point rewards, stock limits, and fulfill customer redemption
          requests.
        </p>
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

      {/* Create New Reward (Owner & Manager) */}
      {(role === "owner" || role === "manager") && (
        <form
          onSubmit={handleCreateReward}
          className="p-5 rounded bg-surface border border-border space-y-4 text-xs"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b border-border pb-3">
            <Plus className="w-4 h-4 text-accent" />
            <span>Add New Catalog Reward</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="rw-name"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Reward Title <span className="text-red-600">*</span>
              </label>
              <input
                id="rw-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Complimentary Iced Pour-Over"
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="rw-points"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Points Required <span className="text-red-600">*</span>
              </label>
              <input
                id="rw-points"
                type="number"
                min="1"
                required
                value={pointsRequired}
                onChange={(e) => setPointsRequired(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="rw-value"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Monetary Value (₹) <span className="text-red-600">*</span>
              </label>
              <input
                id="rw-value"
                type="number"
                min="0"
                required
                value={monetaryValue}
                onChange={(e) => setMonetaryValue(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label
                htmlFor="rw-desc"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Description
              </label>
              <input
                id="rw-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details shown to customer on their QR card"
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="rw-stock"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Stock Limit (Optional)
              </label>
              <input
                id="rw-stock"
                type="number"
                min="1"
                value={stockLimit}
                onChange={(e) => setStockLimit(e.target.value)}
                placeholder="Unlimited if blank"
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Publish Reward</span>
            </button>
          </div>
        </form>
      )}

      {/* Rewards Catalog Grid */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground">
          Rewards Catalog ({rewards.length})
        </h2>
        {loading ? (
          <div className="h-32 bg-surface border border-border rounded animate-pulse" />
        ) : rewards.length === 0 ? (
          <EmptyState
            title="No rewards created yet"
            description="Create your first catalog reward above."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded bg-surface border border-border flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        {r.name}
                      </h3>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted mt-1">{r.description}</p>
                    )}
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <div className="text-sm font-extrabold text-foreground">
                      {r.points_required} pts
                    </div>
                    <div className="text-xs text-muted">
                      Worth {formatCurrency(r.monetary_value)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted font-mono">
                    Redeemed: {r.redeemed_count}
                    {r.stock_limit !== null ? ` / ${r.stock_limit} stock` : ""}
                  </span>
                  {(role === "owner" || role === "manager") && (
                    <button
                      type="button"
                      onClick={() => toggleRewardStatus(r.id, r.status)}
                      className="px-2.5 py-1 rounded border border-border bg-surface-elevated hover:bg-surface font-medium text-foreground"
                    >
                      {r.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Redemption Requests & History */}
      <section className="border border-border bg-surface rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            Redemption Fulfillment Queue & History ({redemptions.length})
          </h2>
          <p className="text-xs text-muted">
            When a customer requests a redemption, points are deducted
            immediately. Rejecting or cancelling automatically writes a reversal
            transaction.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4">Customer & Card</th>
                <th className="py-3 px-4">Reward / Store Credit</th>
                <th className="py-3 px-4 text-right">Points / Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {redemptions.map((rr) => (
                <tr key={rr.id}>
                  <td className="py-3 px-4 text-muted whitespace-nowrap">
                    {formatDate(rr.requested_at, true)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-foreground">
                      {rr.customer_name}
                    </div>
                    <div className="font-mono text-muted">{rr.card_number}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">
                      {rr.reward_name || "Store Credit Bill Discount"}
                    </div>
                    {rr.notes && <div className="text-muted">{rr.notes}</div>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {rr.points_used > 0 ? `${rr.points_used} pts · ` : ""}
                    {formatCurrency(rr.monetary_value)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={rr.status} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {rr.status === "requested" || rr.status === "approved" ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateRedemptionStatus(rr.id, "fulfilled")
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Fulfill</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelTarget(rr)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-700 text-white font-semibold"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel & Reverse</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">
                        {rr.processed_by_name || "Completed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel Redemption & Reverse Balance"
        description="Cancelling this redemption request will write an immutable reversal transaction that restores the deducted points or store credit back to the customer's card."
        recordName={
          cancelTarget
            ? `${cancelTarget.customer_name} — ${
                cancelTarget.reward_name ||
                formatCurrency(cancelTarget.monetary_value)
              }`
            : undefined
        }
        confirmLabel="Cancel & Restore Balance"
        variant="destructive"
        onConfirm={() =>
          cancelTarget && updateRedemptionStatus(cancelTarget.id, "cancelled")
        }
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}

