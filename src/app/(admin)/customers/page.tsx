"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  UserPlus,
  QrCode,
  ArrowRight,
  Loader2,
  X,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Gift,
} from "lucide-react";
import {
  CopyButton,
  StatusBadge,
  EmptyState,
} from "@/components/ui/primitives";
import { formatCurrency } from "@/lib/utils";

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  loyalty_consent: boolean;
  marketing_consent: boolean;
  card_id: string;
  card_number: string;
  public_id: string;
  card_status: string;
  points_balance: number;
  redeemable_amount: number;
  pending_points: number;
  lifetime_purchase_amount: number;
  birthday_day?: number | null;
  birthday_month?: number | null;
  last_visited_at?: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    slug: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "retention" | "birthdays">(
    "all"
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create customer form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loyaltyConsent, setLoyaltyConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const fourteenDaysAgo = useMemo(
    () => new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    [now]
  );

  const dormantCustomers = useMemo(() => {
    return customers.filter((c) => {
      const lastVisit = c.last_visited_at
        ? new Date(c.last_visited_at)
        : new Date(c.created_at);
      return lastVisit < fourteenDaysAgo;
    });
  }, [customers, fourteenDaysAgo]);

  const currentMonth = now.getMonth() + 1;
  const birthdayCustomers = useMemo(() => {
    return customers.filter((c) => c.birthday_month === currentMonth);
  }, [customers, currentMonth]);

  const fetchCustomers = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/customers${search ? `?q=${encodeURIComponent(search)}` : ""}`
      );
      const json = await res.json();
      if (res.ok) {
        setCustomers(json.customers || []);
        if (json.business) setBusinessInfo(json.business);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, fetchCustomers]);

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email: email || null,
          notes: notes || null,
          loyaltyConsent,
          marketingConsent,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Could not create customer.");
        setCreating(false);
        return;
      }

      setFullName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setShowCreateModal(false);
      setCreating(false);
      fetchCustomers(query);
    } catch {
      setFormError("Network error creating customer.");
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Customers & Digital Loyalty Cards
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Search by name, phone, email, or card number. Every customer gets a
            unique QR code and ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer & Generate QR Card</span>
        </button>
      </div>

      {/* Retention & Marketing Sub-Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-between ${
            activeTab === "all"
              ? "bg-surface text-foreground border-accent shadow-xs"
              : "bg-surface-elevated text-muted border-border hover:text-foreground"
          }`}
        >
          <span>All Customers</span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-background border border-border">
            {customers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("retention")}
          className={`py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-between ${
            activeTab === "retention"
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-xs"
              : "bg-surface-elevated text-muted border-border hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Win-Back Retention (14+ Days)</span>
          </span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
            {dormantCustomers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("birthdays")}
          className={`py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-between ${
            activeTab === "birthdays"
              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 shadow-xs"
              : "bg-surface-elevated text-muted border-border hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-purple-500" />
            <span>Birthday Club (This Month)</span>
          </span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
            {birthdayCustomers.length}
          </span>
        </button>
      </div>

      {activeTab === "retention" ? (
        <div className="space-y-3">
          <div className="p-3.5 rounded bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                🎯 1-Click WhatsApp Win-Back Retention Studio
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                These customers have not visited your store in 14+ days. Tap "Send WhatsApp Win-Back" to send a personalized invite with bonus points to bring them back!
              </p>
            </div>
          </div>

          {dormantCustomers.length === 0 ? (
            <div className="p-8 text-center border border-border bg-surface rounded text-muted text-xs">
              Awesome! You have no dormant customers right now. All customers visited within the last 14 days.
            </div>
          ) : (
            <div className="border border-border bg-surface rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4">Last Visit</th>
                    <th className="py-3 px-4 text-right">Retention Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dormantCustomers.map((c) => {
                    const daysAgo = Math.floor(
                      (now.getTime() -
                        new Date(
                          c.last_visited_at || c.created_at
                        ).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const bName = businessInfo?.name || "Scoop N Brew";
                    const winBackMsg = `Hey ${c.full_name}, we miss you at ${bName}! ❤️ Enjoy 50 bonus points on your next visit this week: https://loopacards.netlify.app/card/${c.public_id}`;
                    const waUrl = `https://wa.me/${c.phone.replace(
                      /\D/g,
                      ""
                    )}?text=${encodeURIComponent(winBackMsg)}`;

                    return (
                      <tr key={c.id} className="hover:bg-surface-elevated/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground">
                            {c.full_name}
                          </div>
                          <div className="text-muted font-mono">{c.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {c.points_balance} pts
                        </td>
                        <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-medium">
                          {daysAgo} days ago
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Win-Back</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === "birthdays" ? (
        <div className="space-y-3">
          <div className="p-3.5 rounded bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                🎂 Birthday Club Greetings Studio
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Customers celebrating their birthday this month. Send them a personal WhatsApp wish and invite them for a complimentary birthday treat!
              </p>
            </div>
          </div>

          {birthdayCustomers.length === 0 ? (
            <div className="p-8 text-center border border-border bg-surface rounded text-muted text-xs">
              No registered customer birthdays in the current month yet.
            </div>
          ) : (
            <div className="border border-border bg-surface rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Birthday</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4 text-right">Greeting Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {birthdayCustomers.map((c) => {
                    const bName = businessInfo?.name || "Scoop N Brew";
                    const bdayMsg = `Happy Birthday ${c.full_name}! 🎂 Wishing you great food and sweet vibes from the team at ${bName}! Show your loyalty card today for a complimentary birthday treat: https://loopacards.netlify.app/card/${c.public_id}`;
                    const waUrl = `https://wa.me/${c.phone.replace(
                      /\D/g,
                      ""
                    )}?text=${encodeURIComponent(bdayMsg)}`;

                    return (
                      <tr key={c.id} className="hover:bg-surface-elevated/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground">
                            {c.full_name}
                          </div>
                          <div className="text-muted font-mono">{c.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-purple-700 dark:text-purple-300">
                          {c.birthday_day
                            ? `${new Date(
                                2024,
                                (c.birthday_month || 1) - 1,
                                c.birthday_day
                              ).toLocaleString("default", {
                                month: "short",
                              })} ${c.birthday_day}`
                            : "This Month"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {c.points_balance} pts
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Wish on WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer by phone (+91...), name, email, or card number..."
              aria-label="Search customers"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded border border-border bg-surface text-foreground"
            />
          </div>

      {/* Customers Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-surface border border-border rounded animate-pulse"
            />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No matching customers found"
          description="Create a new customer profile to generate their loyalty card and QR code immediately."
          actionLabel="Add Customer"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="border border-border bg-surface rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Card Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Points Balance</th>
                  <th className="py-3 px-4 text-right">Store Credit</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-elevated/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground text-sm">
                        {c.full_name}
                      </div>
                      <div className="text-muted font-mono">
                        {c.phone}
                        {c.email ? ` · ${c.email}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">
                          {c.card_number}
                        </span>
                        <CopyButton value={c.card_number} label="Copy" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.card_status || "active"} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-foreground">
                      {c.points_balance} pts
                      {c.pending_points > 0 && (
                        <span className="block text-[10px] text-amber-600 font-normal">
                          +{c.pending_points} pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-accent">
                      {formatCurrency(c.redeemable_amount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-muted">
                      {formatCurrency(c.lifetime_purchase_amount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/card/${c.public_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-elevated text-foreground font-medium"
                        >
                          <QrCode className="w-3.5 h-3.5 text-accent" />
                          <span>Public Card</span>
                        </Link>
                        <Link
                          href={`/customers/${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* Add Customer Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-customer-title"
        >
          <div className="w-full max-w-lg bg-surface border border-border rounded p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2
                id="add-customer-title"
                className="text-base font-bold text-foreground"
              >
                Add Customer & Issue Digital QR Card
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
                className="p-1 text-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700"
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleCreateCustomer}
              className="mt-4 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="cust-name"
                    className="block font-semibold uppercase tracking-wider text-foreground"
                  >
                    Customer Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Dravid"
                    className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cust-phone"
                    className="block font-semibold uppercase tracking-wider text-foreground"
                  >
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="cust-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 54321"
                    className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cust-email"
                  className="block font-semibold uppercase tracking-wider text-foreground"
                >
                  Email Address (Optional)
                </label>
                <input
                  id="cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label
                  htmlFor="cust-notes"
                  className="block font-semibold uppercase tracking-wider text-foreground"
                >
                  Staff Notes (Optional)
                </label>
                <input
                  id="cust-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferred drink, allergies, or tier note"
                  className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                />
              </div>

              {/* DPDP Act 2023 Explicit Consent Checkboxes */}
              <div className="p-3 rounded bg-surface-elevated border border-border space-y-2.5">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loyaltyConsent}
                    onChange={(e) => setLoyaltyConsent(e.target.checked)}
                    required
                    className="mt-0.5 rounded accent-accent"
                  />
                  <span>
                    <strong className="text-foreground">
                      Loyalty Program Consent (Required — DPDP Act 2023):
                    </strong>{" "}
                    Customer consents to storing their name, phone, and purchase
                    history to operate their digital loyalty card.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 rounded accent-accent"
                  />
                  <span>
                    <strong className="text-foreground">
                      Marketing Consent (Optional):
                    </strong>{" "}
                    Customer agrees to receive promotional reward updates.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded border border-border bg-surface text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !loyaltyConsent}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Customer & Generate Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

