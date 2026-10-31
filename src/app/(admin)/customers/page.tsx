"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  UserPlus,
  QrCode,
  ArrowRight,
  Loader2,
  X,
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
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
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

  const fetchCustomers = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/customers${search ? `?q=${encodeURIComponent(search)}` : ""}`
      );
      const json = await res.json();
      if (res.ok) {
        setCustomers(json.customers || []);
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

