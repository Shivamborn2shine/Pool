"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Utensils,
  Wallet,
  XCircle,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

interface StaffOrderItem {
  id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  variant_details?: { name: string; price_delta: number }[];
  addon_details?: { name: string; price: number }[];
  notes?: string | null;
}

interface StaffOrder {
  id: string;
  order_number: string;
  customer_id: string;
  card_id: string;
  customer_display_name: string;
  customer_full_name: string;
  customer_phone_display: string;
  customer_points_balance: number;
  customer_redeemable_amount: number;
  order_type: "dine_in" | "takeaway" | "pickup";
  table_number: string | null;
  status: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  reward_points_used: number;
  total: number;
  points_earned: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  payment_reference: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  confirmed_at: string | null;
  paid_at: string | null;
  items: StaffOrderItem[];
}

export default function StaffOrdersQueuePage() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [counts, setCounts] = useState({
    new: 0,
    awaiting_payment: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Online payment modal state
  const [onlinePayOrder, setOnlinePayOrder] = useState<StaffOrder | null>(null);
  const [upiReference, setUpiReference] = useState("");

  // Reject / Cancel / Refund modal state
  const [reasonModal, setReasonModal] = useState<{
    order: StaffOrder;
    action: "reject" | "cancel" | "refund";
  } | null>(null);
  const [reasonText, setReasonText] = useState("");

  // Kitchen ticket print modal
  const [ticketOrder, setTicketOrder] = useState<StaffOrder | null>(null);

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        const qs = new URLSearchParams();
        qs.set("status", statusFilter);
        if (searchQuery.trim()) qs.set("q", searchQuery.trim());
        const res = await fetch(`/api/staff/orders?${qs.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders || []);
          if (data.counts) setCounts(data.counts);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, searchQuery]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 6 seconds for live incoming counter orders
  useEffect(() => {
    const timer = setInterval(() => {
      fetchOrders(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const runOrderAction = async (
    orderId: string,
    payload: {
      action:
        | "confirm"
        | "reject"
        | "mark_paid"
        | "preparing"
        | "ready"
        | "served"
        | "cancel"
        | "refund";
      paymentMethod?: "cash" | "online";
      paymentReference?: string;
      reason?: string;
    }
  ) => {
    setBusyOrderId(orderId);
    setActionError(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Order action failed.");
        return false;
      }
      await fetchOrders(true);
      return true;
    } catch {
      setActionError("Network error while updating order.");
      return false;
    } finally {
      setBusyOrderId(null);
    }
  };

  const getElapsedMinutes = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Live QR Order Queue & Counter Fulfilment
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Verify customer order tokens at the counter, mark cash/UPI payment to auto-credit loyalty points, and track preparation.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSoundAlerts((prev) => !prev)}
            className={`px-3 py-2 rounded-sm text-xs font-semibold border flex items-center gap-1.5 ${
              soundAlerts
                ? "bg-stone-100 dark:bg-zinc-800 border-stone-300 dark:border-zinc-700"
                : "border-stone-200 dark:border-zinc-800 text-zinc-400"
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-terracotta-600" />
            {soundAlerts ? "Live Alerts On" : "Alerts Muted"}
          </button>
          <a
            href="/api/staff/reports/orders?export=csv"
            className="px-3 py-2 rounded-sm text-xs font-semibold border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Orders CSV
          </a>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchOrders()}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Queue Status Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          {
            id: "active",
            label: "All Active",
            count:
              counts.new +
              counts.awaiting_payment +
              counts.preparing +
              counts.ready,
          },
          { id: "new", label: "1. New (Confirm)", count: counts.new },
          {
            id: "awaiting_payment",
            label: "2. Awaiting Pay",
            count: counts.awaiting_payment,
          },
          { id: "preparing", label: "3. Preparing", count: counts.preparing },
          { id: "ready", label: "4. Ready to Serve", count: counts.ready },
          { id: "completed", label: "Served", count: counts.completed },
          { id: "cancelled", label: "Cancelled/Ref", count: counts.cancelled },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`p-3 rounded-sm border text-left transition-colors ${
              statusFilter === tab.id
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-stone-100 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 hover:border-stone-400"
            }`}
          >
            <p className="text-[11px] uppercase tracking-wider opacity-80 truncate">
              {tab.label}
            </p>
            <p className="text-xl font-extrabold tabular-nums mt-0.5">
              {tab.count}
            </p>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Order #, customer name, or phone..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-stone-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-terracotta-600"
        />
      </div>

      {actionError && (
        <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 bg-stone-200 dark:bg-zinc-900 animate-pulse rounded-sm"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Utensils className="w-10 h-10 text-zinc-400 mx-auto" />
          <h2 className="text-base font-bold">No orders in this queue</h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            When customers scan your store QR code and place an order, it will appear here immediately for counter verification.
          </p>
          <div className="pt-2">
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 hover:underline"
            >
              <QrCode className="w-3.5 h-3.5" />
              View Store QR Code & Menu Settings
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order) => {
            const isBusy = busyOrderId === order.id;
            const isNew =
              order.status === "created" ||
              order.status === "awaiting_confirmation";
            const isConfirmedUnpaid =
              order.status === "confirmed" ||
              order.status === "awaiting_payment";
            const isPaidOrPrep =
              order.status === "paid" ||
              order.status === "points_credited" ||
              order.status === "preparing";
            const isReady = order.status === "ready";

            return (
              <Card
                key={order.id}
                className={`p-5 flex flex-col justify-between space-y-4 ${
                  isNew
                    ? "border-2 border-terracotta-600"
                    : isReady
                    ? "border-2 border-emerald-600"
                    : ""
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Order Number, Status, Elapsed Time */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl font-extrabold tracking-tight tabular-nums">
                          {order.order_number}
                        </span>
                        <Badge
                          variant={
                            isNew
                              ? "warning"
                              : isReady || order.status === "served"
                              ? "success"
                              : order.status === "cancelled" ||
                                order.status === "rejected" ||
                                order.status === "refunded"
                              ? "danger"
                              : "neutral"
                          }
                        >
                          {order.status.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                        <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-sm bg-stone-100 dark:bg-zinc-800">
                          {order.order_type.replace("_", " ")}
                          {order.table_number ? ` • ${order.table_number}` : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {order.customer_display_name}
                        </span>
                        <span>({order.customer_phone_display})</span>
                        <span>•</span>
                        <Link
                          href={`/customers/${order.customer_id}`}
                          className="inline-flex items-center gap-1 text-terracotta-600 font-semibold hover:underline"
                        >
                          <Award className="w-3 h-3" />
                          {order.customer_points_balance} pts
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        {getElapsedMinutes(order.created_at)}
                      </span>
                      <p className="text-lg font-extrabold tabular-nums mt-0.5">
                        {formatCurrency(order.total, order.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-stone-50 dark:bg-zinc-950/60 border border-stone-200 dark:border-zinc-800 rounded-sm p-3 divide-y divide-stone-200 dark:divide-zinc-800 text-xs">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="py-1.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold">
                            {item.quantity}x {item.item_name}
                          </span>
                          {(item.variant_details?.length || 0) > 0 && (
                            <span className="text-zinc-500 ml-1.5">
                              ({item.variant_details?.map((v) => v.name).join(", ")})
                            </span>
                          )}
                          {(item.addon_details?.length || 0) > 0 && (
                            <p className="text-[11px] text-zinc-500">
                              + {item.addon_details?.map((a) => a.name).join(", ")}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[11px] italic text-terracotta-600">
                              Note: “{item.notes}”
                            </p>
                          )}
                        </div>
                        <span className="tabular-nums font-semibold">
                          {formatCurrency(item.total_price, order.currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 px-3 py-2 rounded-sm">
                      <strong>Order Note:</strong> {order.notes}
                    </p>
                  )}

                  {/* Payment & Loyalty Points Summary Pill */}
                  <div className="flex items-center justify-between text-xs pt-1 text-zinc-600 dark:text-zinc-400">
                    <span>
                      Payment:{" "}
                      <strong className="uppercase">
                        {order.payment_status}
                      </strong>
                      {order.payment_method !== "pending"
                        ? ` (${order.payment_method.toUpperCase()}${
                            order.payment_reference
                              ? ` • ${order.payment_reference}`
                              : ""
                          })`
                        : ""}
                    </span>
                    {order.points_earned > 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        +{order.points_earned} pts credited
                      </span>
                    ) : (
                      <span>Points credited on payment</span>
                    )}
                  </div>
                </div>

                {/* Staff Action Buttons */}
                <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                  {isNew && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() =>
                          runOrderAction(order.id, { action: "confirm" })
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Confirm Order at Counter
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isBusy}
                        onClick={() => {
                          setReasonModal({ order, action: "reject" });
                          setReasonText("");
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {isConfirmedUnpaid && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() =>
                          runOrderAction(order.id, {
                            action: "mark_paid",
                            paymentMethod: "cash",
                          })
                        }
                      >
                        <Wallet className="w-3.5 h-3.5 mr-1.5" />
                        Cash Paid (+Credit Pts)
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() => {
                          setOnlinePayOrder(order);
                          setUpiReference("");
                        }}
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                        Online / UPI Paid
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isBusy}
                        onClick={() => {
                          setReasonModal({ order, action: "cancel" });
                          setReasonText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}

                  {isPaidOrPrep && (
                    <>
                      {order.status !== "preparing" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() =>
                            runOrderAction(order.id, { action: "preparing" })
                          }
                        >
                          <ChefHat className="w-3.5 h-3.5 mr-1.5" />
                          Start Preparing
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() =>
                          runOrderAction(order.id, { action: "ready" })
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Mark Ready for Pickup
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setTicketOrder(order)}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        Ticket
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isBusy}
                        onClick={() => {
                          setReasonModal({ order, action: "refund" });
                          setReasonText("");
                        }}
                      >
                        Refund
                      </Button>
                    </>
                  )}

                  {isReady && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() =>
                          runOrderAction(order.id, { action: "served" })
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Mark Served / Handed to Customer
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setTicketOrder(order)}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        Ticket
                      </Button>
                    </>
                  )}

                  {order.status === "served" && (
                    <div className="w-full flex items-center justify-between text-xs text-zinc-500">
                      <span>Completed & Served</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReasonModal({ order, action: "refund" });
                          setReasonText("");
                        }}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Issue Refund & Reverse Points
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Online / UPI Payment Reference Modal (STAFF-05) */}
      {onlinePayOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-bold">
              Confirm Online / UPI Payment • {onlinePayOrder.order_number}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Amount:{" "}
              <strong>
                {formatCurrency(onlinePayOrder.total, onlinePayOrder.currency)}
              </strong>{" "}
              • Customer: <strong>{onlinePayOrder.customer_display_name}</strong>.
              Loyalty points will be credited automatically upon confirmation.
            </p>
            <Input
              label="UPI / Payment Gateway Reference (Required)"
              placeholder="e.g., UPI-4309881204 or RZP-9921"
              value={upiReference}
              onChange={(e) => setUpiReference(e.target.value)}
              required
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => setOnlinePayOrder(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!upiReference.trim()) return;
                  const ok = await runOrderAction(onlinePayOrder.id, {
                    action: "mark_paid",
                    paymentMethod: "online",
                    paymentReference: upiReference.trim(),
                  });
                  if (ok) setOnlinePayOrder(null);
                }}
              >
                Confirm Payment & Credit Points
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject / Cancel / Refund Confirmation Modal */}
      {reasonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-bold capitalize">
              {reasonModal.action} Order {reasonModal.order.order_number}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {reasonModal.action === "refund"
                ? `Refunding this order will automatically reverse the ${reasonModal.order.points_earned} loyalty points credited to ${reasonModal.order.customer_display_name}.`
                : "Please provide a clear reason. The customer will see this reason on their live order screen."}
            </p>
            <Input
              label="Reason (Required)"
              placeholder="e.g., Item out of stock / Customer requested change..."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              required
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setReasonModal(null)}>
                Back
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (reasonText.trim().length < 3) return;
                  const ok = await runOrderAction(reasonModal.order.id, {
                    action: reasonModal.action,
                    reason: reasonText.trim(),
                  });
                  if (ok) setReasonModal(null);
                }}
              >
                Confirm {reasonModal.action}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Printable Kitchen Ticket Modal (STAFF-11) */}
      {ticketOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 space-y-4 bg-white text-zinc-900">
            <div className="text-center border-b border-dashed border-zinc-400 pb-3">
              <p className="text-xs font-bold uppercase tracking-widest">
                KITCHEN / BAR TICKET
              </p>
              <p className="text-3xl font-extrabold mt-1">
                {ticketOrder.order_number}
              </p>
              <p className="text-xs font-semibold mt-1">
                {ticketOrder.customer_display_name} •{" "}
                {ticketOrder.order_type.replace("_", " ").toUpperCase()}
                {ticketOrder.table_number
                  ? ` (${ticketOrder.table_number})`
                  : ""}
              </p>
              <p className="text-[11px] text-zinc-500">
                {formatDate(ticketOrder.created_at, true)}
              </p>
            </div>

            <div className="space-y-2 text-xs border-b border-dashed border-zinc-400 pb-3">
              {ticketOrder.items.map((item) => (
                <div key={item.id} className="space-y-0.5">
                  <p className="font-bold text-sm">
                    {item.quantity}x {item.item_name}
                  </p>
                  {(item.variant_details?.length || 0) > 0 && (
                    <p className="text-zinc-600">
                      Option:{" "}
                      {item.variant_details?.map((v) => v.name).join(", ")}
                    </p>
                  )}
                  {(item.addon_details?.length || 0) > 0 && (
                    <p className="text-zinc-600">
                      Add-ons:{" "}
                      {item.addon_details?.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  {item.notes && <p className="italic">Note: {item.notes}</p>}
                </div>
              ))}
            </div>

            {ticketOrder.notes && (
              <p className="text-xs font-semibold">
                Order Note: {ticketOrder.notes}
              </p>
            )}

            <div className="flex gap-2 pt-2 print:hidden">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setTicketOrder(null)}
              >
                Close
              </Button>
              <Button className="flex-1" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print Ticket
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

