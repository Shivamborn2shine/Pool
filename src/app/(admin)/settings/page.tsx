"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Sliders,
  UserPlus,
  MapPin,
  ShieldCheck,
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import {
  CopyButton,
  StatusBadge,
  ConfirmModal,
} from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";

export default function SettingsAndRulesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bizData, setBizData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingBiz, setSavingBiz] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Staff invitation state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "cashier">("cashier");
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revokeTarget, setRevokeTarget] = useState<any>(null);

  // Add branch location state (BIZ-07)
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");

  // Business logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setLogoUploadError(null);
    try {
      let finalUrl = "";

      // 1. Try Supabase Storage CDN upload first
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("bucket", "business-assets");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          finalUrl = data.url;
        }
      } catch (uploadFetchErr) {
        console.warn("Storage upload failed, falling back to local encoding:", uploadFetchErr);
      }

      // 2. Seamless Data URL fallback if storage API was unavailable
      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBizData((prev: any) => ({
        ...prev,
        business: { ...prev.business, logo_url: finalUrl },
      }));
      setFeedback({
        type: "success",
        text: "Logo selected! Click 'Update Business Profile' below to save changes permanently.",
      });
    } catch (err: any) {
      setLogoUploadError(err?.message || "Error processing logo file.");
    } finally {
      setUploadingLogo(false);
    }
  }

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, rRes] = await Promise.all([
        fetch("/api/business"),
        fetch("/api/business/rules"),
      ]);
      const bJson = await bRes.json();
      const rJson = await rRes.json();
      if (bRes.ok) setBizData(bJson);
      if (rRes.ok) setRules(rJson.rules);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!bizData?.business) return;
    setFeedback(null);
    setSavingBiz(true);
    try {
      const b = bizData.business;
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: b.name,
          logoUrl: b.logo_url || "",
          primaryColor: b.primary_color,
          currency: b.currency,
          timezone: b.timezone,
          address: b.address,
          phone: b.phone,
          email: b.email,
          status: b.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Save failed." });
      } else {
        setFeedback({
          type: "success",
          text: "Business branding and profile updated!",
        });
        await loadSettings();
      }
    } finally {
      setSavingBiz(false);
    }
  }

  async function handleSaveRules(e: React.FormEvent) {
    e.preventDefault();
    if (!rules) return;
    setFeedback(null);
    setSavingRules(true);
    try {
      const res = await fetch("/api/business/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointsPerCurrencyUnit: rules.points_per_currency_unit,
          currencyUnit: rules.currency_unit,
          minimumPurchaseAmount: rules.minimum_purchase_amount,
          maximumPointsPerTransaction: rules.maximum_points_per_transaction,
          pointsValuePer100: rules.points_value_per_100,
          minimumRedemptionPoints: rules.minimum_redemption_points,
          claimEnabled: rules.claim_enabled,
          claimWindowDays: rules.claim_window_days,
          dailyClaimLimit: rules.daily_claim_limit,
          receiptRequiredAboveAmount: rules.receipt_required_above_amount,
          signupBonusPoints: rules.signup_bonus_points,
          pointsExpiryMonths: rules.points_expiry_months,
          campaignName: rules.campaign_name,
          campaignMultiplier: rules.campaign_multiplier,
          managerAdjustmentLimit: rules.manager_adjustment_limit,
          allowNegativeBalance: rules.allow_negative_balance,
          status: rules.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Could not save rules." });
      } else {
        setFeedback({
          type: "success",
          text: "Loyalty rules updated and logged to audit trail!",
        });
        await loadSettings();
      }
    } finally {
      setSavingRules(false);
    }
  }

  async function handleInviteStaff(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setInviting(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite_staff",
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Invite failed." });
      } else {
        setFeedback({
          type: "success",
          text: `Invitation created for ${inviteEmail}. Copy the invite link below or check email.`,
        });
        setLastInviteUrl(json.inviteUrl);
        setInviteEmail("");
        await loadSettings();
      }
    } finally {
      setInviting(false);
    }
  }

  async function handleRevokeStaff() {
    if (!revokeTarget) return;
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "revoke_staff",
        memberId: revokeTarget.id,
      }),
    });
    if (res.ok) {
      setRevokeTarget(null);
      await loadSettings();
    }
  }

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_location",
        name: locName,
        address: locAddress,
      }),
    });
    if (res.ok) {
      setLocName("");
      setLocAddress("");
      await loadSettings();
    }
  }

  if (loading || !bizData || !rules) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-surface border border-border rounded animate-pulse" />
        <div className="h-64 bg-surface border border-border rounded animate-pulse" />
      </div>
    );
  }

  const { business, role, staff, locations, auditLogs } = bizData;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Loyalty Rules, Branding & Staff Permissions
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Configure earning multipliers, claim limits, branch locations, staff
          invitations, and review audit logs.
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

      {/* 1. Loyalty Rules Engine Form (RULE-01..11) */}
      <form
        onSubmit={handleSaveRules}
        className="p-6 rounded bg-surface border border-border space-y-5 text-xs"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Loyalty Points & Claims Rules Engine</span>
          </div>
          <StatusBadge status={rules.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="rule-ppu"
              className="block font-semibold uppercase text-foreground"
            >
              Points Earned
            </label>
            <input
              id="rule-ppu"
              type="number"
              step="0.1"
              value={rules.points_per_currency_unit}
              onChange={(e) =>
                setRules({ ...rules, points_per_currency_unit: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-cu"
              className="block font-semibold uppercase text-foreground"
            >
              Per Currency Unit (₹)
            </label>
            <input
              id="rule-cu"
              type="number"
              value={rules.currency_unit}
              onChange={(e) =>
                setRules({ ...rules, currency_unit: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-min-pur"
              className="block font-semibold uppercase text-foreground"
            >
              Min Purchase to Earn (₹)
            </label>
            <input
              id="rule-min-pur"
              type="number"
              value={rules.minimum_purchase_amount}
              onChange={(e) =>
                setRules({ ...rules, minimum_purchase_amount: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-max-pts"
              className="block font-semibold uppercase text-foreground"
            >
              Max Points / Transaction
            </label>
            <input
              id="rule-max-pts"
              type="number"
              value={rules.maximum_points_per_transaction}
              onChange={(e) =>
                setRules({
                  ...rules,
                  maximum_points_per_transaction: e.target.value,
                })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-val100"
              className="block font-semibold uppercase text-foreground"
            >
              Store Credit per 100 Pts (₹)
            </label>
            <input
              id="rule-val100"
              type="number"
              value={rules.points_value_per_100}
              onChange={(e) =>
                setRules({ ...rules, points_value_per_100: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-min-red"
              className="block font-semibold uppercase text-foreground"
            >
              Min Redemption Points
            </label>
            <input
              id="rule-min-red"
              type="number"
              value={rules.minimum_redemption_points}
              onChange={(e) =>
                setRules({ ...rules, minimum_redemption_points: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-signup"
              className="block font-semibold uppercase text-foreground"
            >
              Signup Bonus Points (P1)
            </label>
            <input
              id="rule-signup"
              type="number"
              value={rules.signup_bonus_points}
              onChange={(e) =>
                setRules({ ...rules, signup_bonus_points: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-mgr-lim"
              className="block font-semibold uppercase text-foreground"
            >
              Manager Direct Adjust Limit
            </label>
            <input
              id="rule-mgr-lim"
              type="number"
              value={rules.manager_adjustment_limit}
              onChange={(e) =>
                setRules({ ...rules, manager_adjustment_limit: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-window"
              className="block font-semibold uppercase text-foreground"
            >
              Claim Window (Days)
            </label>
            <input
              id="rule-window"
              type="number"
              value={rules.claim_window_days}
              onChange={(e) =>
                setRules({ ...rules, claim_window_days: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-daily"
              className="block font-semibold uppercase text-foreground"
            >
              Daily Claim Limit / Card
            </label>
            <input
              id="rule-daily"
              type="number"
              value={rules.daily_claim_limit}
              onChange={(e) =>
                setRules({ ...rules, daily_claim_limit: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-rcpt-req"
              className="block font-semibold uppercase text-foreground"
            >
              Receipt Required Above (₹)
            </label>
            <input
              id="rule-rcpt-req"
              type="number"
              value={rules.receipt_required_above_amount}
              onChange={(e) =>
                setRules({
                  ...rules,
                  receipt_required_above_amount: e.target.value,
                })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>

          <div>
            <label
              htmlFor="rule-mult"
              className="block font-semibold uppercase text-foreground"
            >
              Campaign Multiplier (e.g. 1.25x)
            </label>
            <input
              id="rule-mult"
              type="number"
              step="0.05"
              value={rules.campaign_multiplier}
              onChange={(e) =>
                setRules({ ...rules, campaign_multiplier: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(rules.claim_enabled)}
              onChange={(e) =>
                setRules({ ...rules, claim_enabled: e.target.checked })
              }
              className="rounded accent-accent"
            />
            <span className="font-semibold text-foreground">
              Allow customers to submit self-service purchase claims from QR
              card page
            </span>
          </label>

          <button
            type="submit"
            disabled={savingRules}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover"
          >
            {savingRules && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Loyalty Rules</span>
          </button>
        </div>
      </form>

      {/* 2. Business Profile & Branding (Owner Only) */}
      {role === "owner" && (
        <form
          onSubmit={handleSaveBusiness}
          className="p-6 rounded bg-surface border border-border space-y-4 text-xs"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b border-border pb-3">
            <Building2 className="w-4 h-4 text-accent" />
            <span>Business Profile & Card Branding</span>
          </div>

          {/* Business Logo Branding Card */}
          <div className="p-4 rounded border border-border bg-surface-elevated/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-16 h-16 rounded border border-border bg-surface flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name || "Business Logo"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="w-full h-full flex items-center justify-center text-white font-bold text-xl uppercase"
                    style={{
                      backgroundColor: business.primary_color || "#18181B",
                    }}
                  >
                    {(business.name || "B").slice(0, 1)}
                  </span>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-accent" />
                  <span>Personalized Business Logo</span>
                </div>
                <p className="text-[11px] text-muted max-w-md leading-relaxed">
                  Upload your brand logo. Appears on the top admin shell, customer loyalty pass, and store QR order menu. PNG, JPG, WebP, or SVG (max 5MB).
                </p>
                {logoUploadError && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {logoUploadError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold cursor-pointer text-xs hover:opacity-90 transition-opacity">
                <Upload className="w-3.5 h-3.5" />
                <span>{business.logo_url ? "Change Logo" : "Upload Logo"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoFileChange}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>

              {business.logo_url && (
                <button
                  type="button"
                  onClick={() => {
                    setBizData({
                      ...bizData,
                      business: { ...business, logo_url: "" },
                    });
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium text-xs hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="biz-name"
                className="block font-semibold uppercase text-foreground"
              >
                Business Name *
              </label>
              <input
                id="biz-name"
                type="text"
                required
                value={business.name}
                onChange={(e) =>
                  setBizData({
                    ...bizData,
                    business: { ...business, name: e.target.value },
                  })
                }
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="biz-color"
                className="block font-semibold uppercase text-foreground"
              >
                Primary Brand Color (Hex)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Brand color picker"
                  value={business.primary_color}
                  onChange={(e) =>
                    setBizData({
                      ...bizData,
                      business: { ...business, primary_color: e.target.value },
                    })
                  }
                  className="w-10 h-9 rounded border border-border cursor-pointer"
                />
                <input
                  id="biz-color"
                  type="text"
                  value={business.primary_color}
                  onChange={(e) =>
                    setBizData({
                      ...bizData,
                      business: { ...business, primary_color: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono rounded border border-border bg-background"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="biz-status"
                className="block font-semibold uppercase text-foreground"
              >
                Program Status
              </label>
              <select
                id="biz-status"
                value={business.status}
                onChange={(e) =>
                  setBizData({
                    ...bizData,
                    business: { ...business, status: e.target.value },
                  })
                }
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              >
                <option value="active">Active</option>
                <option value="inactive">Paused / Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="biz-address"
                className="block font-semibold uppercase text-foreground"
              >
                Store Address
              </label>
              <input
                id="biz-address"
                type="text"
                value={business.address || ""}
                onChange={(e) =>
                  setBizData({
                    ...bizData,
                    business: { ...business, address: e.target.value },
                  })
                }
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="biz-phone"
                className="block font-semibold uppercase text-foreground"
              >
                Support Phone
              </label>
              <input
                id="biz-phone"
                type="text"
                value={business.phone || ""}
                onChange={(e) =>
                  setBizData({
                    ...bizData,
                    business: { ...business, phone: e.target.value },
                  })
                }
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="biz-logo-url"
              className="block font-semibold uppercase text-foreground"
            >
              Logo Image CDN URL (Optional Direct Link)
            </label>
            <input
              id="biz-logo-url"
              type="url"
              placeholder="https://.../logo.png"
              value={business.logo_url || ""}
              onChange={(e) =>
                setBizData({
                  ...bizData,
                  business: { ...business, logo_url: e.target.value },
                })
              }
              className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background font-mono text-xs"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingBiz}
              className="px-4 py-2 text-xs font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {savingBiz ? "Saving..." : "Update Business Profile"}
            </button>
          </div>
        </form>
      )}

      {/* 3. Staff Invitations & Role Management (AUTH-05..07) */}
      {role === "owner" && (
        <section className="p-6 rounded bg-surface border border-border space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b border-border pb-3">
            <UserPlus className="w-4 h-4 text-accent" />
            <span>Staff Accounts & Invitations</span>
          </div>

          <form
            onSubmit={handleInviteStaff}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-[220px]">
              <label
                htmlFor="staff-email"
                className="block font-semibold uppercase text-foreground"
              >
                Staff Email Address *
              </label>
              <input
                id="staff-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="cashier2@arakucoffee.in"
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="staff-role"
                className="block font-semibold uppercase text-foreground"
              >
                Assigned Role
              </label>
              <select
                id="staff-role"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "manager" | "cashier")
                }
                className="mt-1 px-3 py-2 text-sm rounded border border-border bg-background"
              >
                <option value="cashier">Cashier (Counter POS & Redeem)</option>
                <option value="manager">
                  Manager (Claims, Rewards & Rules)
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover"
            >
              {inviting ? "Sending..." : "Invite Staff Member"}
            </button>
          </form>

          {lastInviteUrl && (
            <div className="p-3 rounded bg-surface-elevated border border-border flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-[11px] break-all">
                <strong>Direct Invite Link:</strong> {lastInviteUrl}
              </div>
              <CopyButton value={lastInviteUrl} label="Copy Invite URL" />
            </div>
          )}

          <div className="divide-y divide-border pt-2">
            {staff.map(
              (m: {
                id: string;
                full_name: string | null;
                email: string | null;
                invited_email: string | null;
                role: string;
                status: string;
                invite_token: string | null;
              }) => (
                <div
                  key={m.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-foreground">
                      {m.full_name || m.invited_email}
                    </div>
                    <div className="text-muted font-mono">
                      {m.email || m.invited_email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.role} />
                    <StatusBadge status={m.status} />
                    {m.role !== "owner" && m.status !== "revoked" && (
                      <button
                        type="button"
                        onClick={() => setRevokeTarget(m)}
                        className="px-2.5 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 font-medium"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* 4. Multi-Location Branches (BIZ-07 — P1) */}
      <section className="p-6 rounded bg-surface border border-border space-y-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b border-border pb-3">
          <MapPin className="w-4 h-4 text-accent" />
          <span>Store Locations ({locations.length})</span>
        </div>

        {role === "owner" && (
          <form
            onSubmit={handleAddLocation}
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label
                htmlFor="loc-name"
                className="block font-semibold uppercase text-foreground"
              >
                Branch Name *
              </label>
              <input
                id="loc-name"
                type="text"
                required
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                placeholder="e.g. Jayanagar 4th Block"
                className="mt-1 px-3 py-1.5 text-sm rounded border border-border bg-background"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="loc-addr"
                className="block font-semibold uppercase text-foreground"
              >
                Address
              </label>
              <input
                id="loc-addr"
                type="text"
                value={locAddress}
                onChange={(e) => setLocAddress(e.target.value)}
                placeholder="Branch address"
                className="mt-1 w-full px-3 py-1.5 text-sm rounded border border-border bg-background"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Add Branch
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {locations.map(
            (loc: {
              id: string;
              name: string;
              address: string | null;
              status: string;
            }) => (
              <div
                key={loc.id}
                className="p-3 rounded bg-surface-elevated border border-border flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-foreground">{loc.name}</div>
                  <div className="text-muted">{loc.address || "—"}</div>
                </div>
                <StatusBadge status={loc.status} />
              </div>
            )
          )}
        </div>
      </section>

      {/* 5. Immutable Security Audit Trail (Section 11 Auditability) */}
      <section className="border border-border bg-surface rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <h2 className="text-base font-bold text-foreground">
            Recent Security & Admin Audit Logs ({auditLogs.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Actor & Role</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.map(
                (log: {
                  id: string;
                  created_at: string;
                  actor_name: string | null;
                  actor_email: string | null;
                  actor_role: string;
                  action: string;
                  entity_type: string;
                  entity_id: string | null;
                  ip_address: string | null;
                }) => (
                  <tr key={log.id}>
                    <td className="py-2.5 px-4 text-muted whitespace-nowrap">
                      {formatDate(log.created_at, true)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-foreground">
                        {log.actor_name || log.actor_email || "Customer / System"}
                      </span>{" "}
                      <span className="font-mono text-muted">
                        ({log.actor_role})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-accent">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted">
                      {log.entity_type}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmModal
        open={Boolean(revokeTarget)}
        title="Revoke Staff Access"
        description="Revoking this staff member immediately disables their access to your business dashboard and invalidates any pending invitation link."
        recordName={revokeTarget?.email || revokeTarget?.invited_email}
        confirmLabel="Revoke Staff Member"
        variant="destructive"
        onConfirm={handleRevokeStaff}
        onClose={() => setRevokeTarget(null)}
      />
    </div>
  );
}

