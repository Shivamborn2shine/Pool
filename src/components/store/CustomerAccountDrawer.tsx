"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Edit3,
  Mail,
  Cake,
  CheckCircle2,
  Copy,
  RefreshCw,
  Gift,
  ArrowUpRight,
  Receipt,
  RotateCcw,
  LogOut,
} from "lucide-react";
import { Badge, Button, Input } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface CustomerAccountDrawerCustomer {
  cardPublicId: string;
  cardNumber: string;
  fullName: string;
  displayName?: string;
  maskedPhone: string;
  phone?: string;
  pointsBalance: number;
  redeemableAmount: number;
  email?: string | null;
  birthdayDay?: number | null;
  birthdayMonth?: number | null;
  marketingConsent?: boolean;
}

export interface CustomerAccountDrawerOrder {
  id: string;
  order_number: string;
  order_type: "dine_in" | "takeaway" | "pickup" | string;
  status: string;
  total: number;
  points_earned: number;
  created_at: string;
  items?: {
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export interface CustomerAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerAccountDrawerCustomer;
  store: {
    name: string;
    slug: string;
    primaryColor?: string | null;
    currency?: string;
    themePreset?: string;
  };
  onCustomerUpdate?: (updated: Partial<CustomerAccountDrawerCustomer>) => void;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onReorder?: (order: CustomerAccountDrawerOrder) => void;
  onTrackOrder?: (orderId: string) => void;
}

export default function CustomerAccountDrawer({
  isOpen,
  onClose,
  customer,
  store,
  onCustomerUpdate,
  onNavigateTab,
  onLogout,
  onReorder,
  onTrackOrder,
}: CustomerAccountDrawerProps) {
  const [refreshingPoints, setRefreshingPoints] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [copiedCardNum, setCopiedCardNum] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Profile Edit state (Inline card editor + Modal fallback)
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editName, setEditName] = useState(customer.fullName || "");
  const [editEmail, setEditEmail] = useState(customer.email || "");
  const [editBdayDay, setEditBdayDay] = useState(
    customer.birthdayDay ? String(customer.birthdayDay) : ""
  );
  const [editBdayMonth, setEditBdayMonth] = useState(
    customer.birthdayMonth ? String(customer.birthdayMonth) : ""
  );
  const [editMarketing, setEditMarketing] = useState(
    Boolean(customer.marketingConsent)
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState<string | null>(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Sync edit form fields when customer changes
  useEffect(() => {
    setEditName(customer.fullName || "");
    setEditEmail(customer.email || "");
    setEditBdayDay(customer.birthdayDay ? String(customer.birthdayDay) : "");
    setEditBdayMonth(customer.birthdayMonth ? String(customer.birthdayMonth) : "");
    setEditMarketing(Boolean(customer.marketingConsent));
  }, [customer]);

  // Orders state
  const [orders, setOrders] = useState<CustomerAccountDrawerOrder[]>([]);
  const hasFetchedOrdersRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (!customer?.cardPublicId || !store?.slug) return;
    setRefreshingOrders(true);
    try {
      const res = await fetch(
        `/api/s/${encodeURIComponent(store.slug)}/orders?cardPublicId=${encodeURIComponent(
          customer.cardPublicId
        )}`
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch {
      // Ignore network errors
    } finally {
      setRefreshingOrders(false);
    }
  }, [customer?.cardPublicId, store?.slug]);

  useEffect(() => {
    if (isOpen && customer?.cardPublicId && !hasFetchedOrdersRef.current) {
      hasFetchedOrdersRef.current = true;
      fetchOrders();
    }
  }, [isOpen, customer?.cardPublicId, fetchOrders]);

  const handleRefreshPoints = async () => {
    if (!customer?.cardPublicId || !store?.slug) return;
    setRefreshingPoints(true);
    try {
      const res = await fetch(
        `/api/s/${encodeURIComponent(store.slug)}/customer-profile?cardPublicId=${encodeURIComponent(
          customer.cardPublicId
        )}`
      );
      const data = await res.json();
      if (res.ok && data.card && onCustomerUpdate) {
        onCustomerUpdate({
          pointsBalance: Number(data.card.points_balance ?? data.card.pointsBalance),
          redeemableAmount: Number(
            data.card.redeemable_amount ?? data.card.redeemableAmount
          ),
        });
      }
    } catch {
      // Ignore
    } finally {
      setRefreshingPoints(false);
    }
  };

  const handleCopyCardNumber = () => {
    if (!customer?.cardNumber) return;
    try {
      navigator.clipboard.writeText(customer.cardNumber);
      setCopiedCardNum(true);
      setTimeout(() => setCopiedCardNum(false), 2000);
    } catch {}
  };

  const handleOpenEditProfile = () => {
    setEditName(customer.fullName || "");
    setEditEmail(customer.email || "");
    setEditBdayDay(customer.birthdayDay ? String(customer.birthdayDay) : "");
    setEditBdayMonth(customer.birthdayMonth ? String(customer.birthdayMonth) : "");
    setEditMarketing(Boolean(customer.marketingConsent));
    setEditProfileError(null);
    setIsEditingInline(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.cardPublicId || !store?.slug) return;
    if (!editName.trim()) {
      setEditProfileError("Please enter your name.");
      return;
    }
    setSavingProfile(true);
    setEditProfileError(null);
    try {
      const res = await fetch(`/api/s/${encodeURIComponent(store.slug)}/customer-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardPublicId: customer.cardPublicId,
          fullName: editName.trim(),
          email: editEmail.trim() || null,
          birthdayDay: editBdayDay ? Number(editBdayDay) : null,
          birthdayMonth: editBdayMonth ? Number(editBdayMonth) : null,
          marketingConsent: editMarketing,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditProfileError(data.error || "Failed to update profile.");
        return;
      }
      if (onCustomerUpdate && data.customer) {
        onCustomerUpdate({
          fullName: data.customer.fullName,
          displayName: data.customer.displayName || data.customer.fullName,
          email: data.customer.email,
          birthdayDay: data.customer.birthdayDay,
          birthdayMonth: data.customer.birthdayMonth,
          marketingConsent: data.customer.marketingConsent,
        });
      }
      setIsEditingInline(false);
      setProfileSuccessMsg("Profile updated successfully!");
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch {
      setEditProfileError("Network error. Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!isOpen) return null;

  const primaryColor =
    store?.primaryColor ||
    (store?.themePreset === "rose" ? "#E11D48" : "#E11D48");

  return (
    <>
      {/* Customer Account & Past Orders Drawer */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
          {/* Drawer Top Header */}
          <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-stone-50/70 dark:bg-zinc-950/60">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs uppercase shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {(customer.displayName || customer.fullName || "U").slice(0, 1)}
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-zinc-900 dark:text-zinc-50">
                  My Account & Loyalty
                </h3>
                <p className="text-[11px] text-zinc-500">{store?.name || "Store"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Drawer Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Profile Card (Normal View or Interactive Inline Edit Mode) */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950/50 space-y-3 transition-all">
              {isEditingInline ? (
                /* INLINE EDIT PROFILE FORM */
                <form onSubmit={handleSaveProfile} className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200/70 dark:border-zinc-800/70">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-[#E11D48] dark:text-rose-400">
                        <Edit3 className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                        Edit Profile Details
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingInline(false)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {editProfileError && (
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                      {editProfileError}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Full Name *
                    </label>
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Shivam"
                      className="text-xs h-9"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Email Address (for receipts & rewards)
                    </label>
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. shivam@example.com"
                      className="text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Birthday (for Annual Birthday Club treats 🎂)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editBdayDay}
                        onChange={(e) => setEditBdayDay(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-foreground focus:outline-hidden focus:ring-1 focus:ring-rose-500 cursor-pointer"
                      >
                        <option value="">Select Day</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <select
                        value={editBdayMonth}
                        onChange={(e) => setEditBdayMonth(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-foreground focus:outline-hidden focus:ring-1 focus:ring-rose-500 cursor-pointer"
                      >
                        <option value="">Select Month</option>
                        {MONTH_NAMES.map((name, i) => (
                          <option key={name} value={i + 1}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={editMarketing}
                      onChange={(e) => setEditMarketing(e.target.checked)}
                      className="mt-0.5 rounded-xs text-[#E11D48] focus:ring-rose-500 accent-[#E11D48]"
                    />
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                      Receive exclusive multipliers & offer updates on WhatsApp
                    </span>
                  </label>

                  <div className="flex gap-2 pt-2 border-t border-stone-200/60 dark:border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => setIsEditingInline(false)}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile || !editName.trim()}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-[#E11D48] hover:bg-rose-700 text-white transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              ) : (
                /* NORMAL DISPLAY VIEW */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 truncate">
                          {customer.fullName || customer.displayName || "Valued Customer"}
                        </h4>
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          Verified Member
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        {customer.maskedPhone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenEditProfile}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Edit3 className="w-3 h-3 text-[#E11D48] dark:text-rose-400" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  {/* Email & Birthday Quick Tags */}
                  <div className="space-y-1.5 text-xs pt-1 border-t border-stone-200/60 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span className="truncate">{customer.email || "No email linked"}</span>
                      </span>
                      {!customer.email ? (
                        <button
                          type="button"
                          onClick={handleOpenEditProfile}
                          className="text-[11px] text-[#E11D48] dark:text-rose-400 font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
                        >
                          + Add Email
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenEditProfile}
                          className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium shrink-0 ml-2 cursor-pointer"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Cake className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span className="truncate">
                          {customer.birthdayDay && customer.birthdayMonth
                            ? `Birthday: ${customer.birthdayDay} ${MONTH_NAMES[customer.birthdayMonth - 1]}`
                            : "Birthday Club: Not set"}
                        </span>
                      </span>
                      {!customer.birthdayDay || !customer.birthdayMonth ? (
                        <button
                          type="button"
                          onClick={handleOpenEditProfile}
                          className="text-[11px] text-[#E11D48] dark:text-rose-400 font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
                        >
                          + Add for Free Treat
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0 ml-2">
                          🎂 Club Active
                        </span>
                      )}
                    </div>
                  </div>

                  {profileSuccessMsg && (
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60 dark:border-zinc-800/60 text-xs">
                    <span className="text-zinc-500 font-mono truncate">
                      Card: {customer.cardNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCardNumber}
                      className="inline-flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300 hover:text-foreground shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCardNum ? "Copied!" : "Copy #"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Live Wallets */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950/50 text-center relative overflow-hidden">
                <div className="flex items-center justify-center gap-1 text-[11px] font-mono uppercase text-zinc-500">
                  <span>Loyalty Points</span>
                  <button
                    type="button"
                    onClick={handleRefreshPoints}
                    disabled={refreshingPoints}
                    title="Refresh points balance"
                    className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingPoints ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {customer.pointsBalance}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {refreshingPoints ? "Syncing..." : "Active Balance"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950/50 text-center">
                <div className="text-[11px] font-mono uppercase text-zinc-500">
                  Store Credit
                </div>
                <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {formatCurrency(customer.redeemableAmount, store.currency || "INR")}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Redeemable Wallet
                </div>
              </div>
            </div>

            {/* Unlock Your Rewards Button */}
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab("rewards");
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 dark:border-rose-900/40 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2 text-xs font-bold transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer shadow-2xs"
              >
                <Gift className="w-4 h-4 shrink-0" />
                <span>Unlock Your Rewards</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </button>
            )}

            {/* Past Orders Section */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Past Orders ({orders.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={fetchOrders}
                  disabled={refreshingOrders}
                  className="text-[11px] font-semibold text-zinc-500 hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshingOrders ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-stone-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                  No orders placed yet. Place your first order to view receipts and track points!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {orders.map((ord) => {
                    const isReady = ord.status === "ready";
                    const isPreparing = ord.status === "preparing";
                    const isServed = ord.status === "served";
                    return (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2 text-xs shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                                {ord.order_number}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isReady
                                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                                    : isPreparing
                                    ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300"
                                    : isServed
                                    ? "bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                    : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                }`}
                              >
                                {ord.status.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {formatDate(ord.created_at)} • {ord.order_type.replace("_", " ")}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                              {formatCurrency(ord.total, store.currency || "INR")}
                            </span>
                            {ord.points_earned > 0 && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                +{ord.points_earned} pts
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Items summary */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate bg-stone-50 dark:bg-zinc-900 p-1.5 rounded">
                            {ord.items
                              .map((it) => `${it.quantity}x ${it.item_name}`)
                              .join(", ")}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1 border-t border-stone-100 dark:border-zinc-800/80">
                          {onTrackOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onTrackOrder(ord.id);
                              }}
                              className="flex-1 py-1 px-2 rounded border border-stone-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              Track Status
                            </button>
                          )}
                          {onReorder && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onReorder(ord);
                              }}
                              className="flex-1 py-1 px-2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-bold hover:opacity-90 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>1-Tap Reorder</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Logout & Account Actions */}
            <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 space-y-2">
              {!showLogoutConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out / Switch Account</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 space-y-2">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300 text-center">
                    Log out from this device?
                  </p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center">
                    Your loyalty points and order history remain safely saved under your phone number ({customer.maskedPhone}).
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 text-xs"
                      onClick={() => setShowLogoutConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setShowLogoutConfirm(false);
                        onClose();
                        if (onLogout) onLogout();
                      }}
                    >
                      Confirm Log Out
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Powered by Loopa Branding */}
            <div className="pt-2 pb-1 text-center flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              <span>Powered by</span>
              <img
                src="/loopa-logo.png"
                alt="Loopa"
                className="w-3.5 h-3.5 rounded-xs object-contain"
              />
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">Loopa Loyalty</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
