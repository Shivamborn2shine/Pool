"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Check, X, ExternalLink, Edit3, ShieldAlert } from "lucide-react";
import {
  StatusBadge,
  EmptyState,
  ConfirmModal,
} from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClaimsQueuePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [claims, setClaims] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [adjustmentRequests, setAdjustmentRequests] = useState<any[]>([]);
  const [role, setRole] = useState("owner");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Edit-and-approve state
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPoints, setEditPoints] = useState("");

  // Reject claim modal state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState(
    "Receipt image unclear or does not match counter bill"
  );
  const [processing, setProcessing] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claims");
      const json = await res.json();
      if (res.ok) {
        setClaims(json.claims || []);
        setAdjustmentRequests(json.adjustmentRequests || []);
        setRole(json.role || "owner");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function handleApproveClaim(
    claimId: string,
    adjustedAmount?: number,
    overridePoints?: number
  ) {
    setFeedback(null);
    setProcessing(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjustedAmount,
          overridePoints,
          reviewNote:
            adjustedAmount !== undefined
              ? "Approved with adjusted amount/points"
              : "Verified and approved by merchant",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Approval failed." });
      } else {
        setFeedback({
          type: "success",
          text: `Claim approved! +${json.claim.points_awarded} points credited to card.`,
        });
        setEditingClaimId(null);
        await loadQueue();
      }
    } finally {
      setProcessing(false);
    }
  }

  async function handleRejectClaim() {
    if (!rejectTarget) return;
    setFeedback(null);
    setProcessing(true);
    try {
      const res = await fetch(`/api/claims/${rejectTarget.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: rejectReason }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Rejection failed." });
      } else {
        setFeedback({
          type: "success",
          text: "Claim rejected and reason logged.",
        });
        setRejectTarget(null);
        await loadQueue();
      }
    } finally {
      setProcessing(false);
    }
  }

  async function handleReviewAdjustmentRequest(
    requestId: string,
    decision: "approved" | "rejected"
  ) {
    setFeedback(null);
    const res = await fetch("/api/adjustments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        decision,
        reviewNote: `${decision} by business owner`,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: json.error || "Action failed." });
    } else {
      setFeedback({
        type: "success",
        text: `Manager adjustment request ${decision}.`,
      });
      await loadQueue();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Customer Claims & Approval Queue
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Verify customer-submitted purchase claims, inspect uploaded receipts,
          and approve or reject points.
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

      {/* Owner Approval Queue for Large Manager Adjustments (BAL-09) */}
      {adjustmentRequests.length > 0 && (
        <section className="p-5 rounded bg-surface border border-amber-300 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <ShieldAlert className="w-4 h-4 text-accent" />
            <span>
              Manager High-Value Adjustment Requests ({adjustmentRequests.length})
            </span>
          </div>
          <div className="divide-y divide-border text-xs">
            {adjustmentRequests.map((req) => (
              <div
                key={req.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-foreground">
                    {req.customer_name} ({req.card_number}) —{" "}
                    {req.wallet_type === "points"
                      ? `${req.points_delta > 0 ? "+" : ""}${req.points_delta} pts`
                      : `₹${req.amount_delta}`}
                  </div>
                  <div className="text-muted">
                    Requested by {req.requested_by_name}: &ldquo;{req.reason}
                    &rdquo;
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={req.status} />
                  {req.status === "pending" && role === "owner" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleReviewAdjustmentRequest(req.id, "approved")
                        }
                        className="px-3 py-1 rounded bg-emerald-700 text-white font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleReviewAdjustmentRequest(req.id, "rejected")
                        }
                        className="px-3 py-1 rounded bg-red-700 text-white font-semibold"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Purchase Claims Table */}
      {loading ? (
        <div className="h-52 bg-surface border border-border rounded animate-pulse" />
      ) : claims.length === 0 ? (
        <EmptyState
          title="No customer purchase claims in queue"
          description="When customers submit bills from their QR card page, they appear here for review."
        />
      ) : (
        <div className="border border-border bg-surface rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                  <th className="py-3 px-4">Submitted / Bill Date</th>
                  <th className="py-3 px-4">Customer & Card</th>
                  <th className="py-3 px-4">Receipt & Notes</th>
                  <th className="py-3 px-4 text-right">Claimed Amount</th>
                  <th className="py-3 px-4 text-right">Est. Points</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {claims.map((c) => {
                  const isEditing = editingClaimId === c.id;
                  return (
                    <tr key={c.id} className="hover:bg-surface-elevated/50">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          Bill: {formatDate(c.purchase_date)}
                        </div>
                        <div className="text-muted">
                          Filed: {formatDate(c.created_at, true)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">
                          {c.customer_name}
                        </div>
                        <div className="font-mono text-muted">
                          {c.card_number} · {c.customer_phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-foreground">
                          {c.receipt_number || "No receipt #"}
                        </div>
                        <div className="text-muted">
                          {c.notes || c.review_note || "—"}
                        </div>
                        {c.receipt_file_url && (
                          <a
                            href={c.receipt_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent underline font-medium mt-1"
                          >
                            <span>View Signed Receipt</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            aria-label="Edit claimed amount"
                            className="w-24 px-2 py-1 text-right rounded border border-border bg-background"
                          />
                        ) : (
                          formatCurrency(c.amount, c.currency)
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPoints}
                            onChange={(e) => setEditPoints(e.target.value)}
                            aria-label="Edit granted points"
                            className="w-20 px-2 py-1 text-right rounded border border-border bg-background"
                          />
                        ) : (
                          `+${c.points_awarded} pts`
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {c.status === "pending" ? (
                          <div className="inline-flex items-center gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  disabled={processing}
                                  onClick={() =>
                                    handleApproveClaim(
                                      c.id,
                                      Number(editAmount),
                                      Number(editPoints)
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold"
                                >
                                  Save & Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingClaimId(null)}
                                  className="px-2 py-1 rounded border border-border bg-surface"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={processing}
                                  onClick={() => handleApproveClaim(c.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingClaimId(c.id);
                                    setEditAmount(String(c.amount));
                                    setEditPoints(String(c.points_awarded));
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectTarget(c)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-700 hover:bg-red-800 text-white font-semibold"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">
                            Reviewed{" "}
                            {c.reviewed_at ? formatDate(c.reviewed_at) : ""}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Claim Modal with Mandatory Reason (CLAIM-07) */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-claim-title"
        >
          <div className="w-full max-w-md bg-surface border border-border rounded p-6 shadow-xl space-y-4">
            <h2
              id="reject-claim-title"
              className="text-base font-bold text-foreground"
            >
              Reject Customer Purchase Claim
            </h2>
            <p className="text-xs text-muted">
              Provide a clear reason for rejecting{" "}
              <strong>{rejectTarget.customer_name}</strong>&apos;s claim of{" "}
              <strong>{formatCurrency(rejectTarget.amount)}</strong>. This
              reason will be visible on the customer&apos;s card page.
            </p>
            <div>
              <label
                htmlFor="reject-reason-input"
                className="block text-xs font-semibold uppercase text-foreground"
              >
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="reject-reason-input"
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded border border-border bg-background text-foreground"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded border border-border bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing || rejectReason.trim().length < 3}
                onClick={handleRejectClaim}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-red-700 text-white hover:bg-red-800 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={false}
        title=""
        description=""
        onConfirm={() => {}}
        onClose={() => {}}
      />
    </div>
  );
}

