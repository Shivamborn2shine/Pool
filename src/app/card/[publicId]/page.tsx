"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  QrCode,
  Gift,
  Receipt,
  History,
  Printer,
  ArrowRightLeft,
  ShieldCheck,
  Loader2,
  Upload,
  Phone,
  MapPin,
  Settings,
  Sparkles,
  Star,
  Instagram,
  Camera,
  Share2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  CopyButton,
  StatusBadge,
  EmptyState,
  ConfirmModal,
} from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CardPagePayload {
  card: {
    id: string;
    cardNumber: string;
    publicId: string;
    publicUrl: string;
    status: string;
    pointsBalance: number;
    redeemableAmount: number;
    pendingPoints: number;
    lifetimePointsEarned: number;
    lifetimePointsRedeemed: number;
    lifetimePurchaseAmount: number;
    qrDataUrl: string;
  };
  customer: {
    fullName: string;
    maskedPhone: string;
    birthdayDay?: number | null;
    birthdayMonth?: number | null;
    marketingConsent: boolean;
    loyaltyConsent: boolean;
    status: string;
  };
  business: {
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
    currency: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    instagramUrl?: string | null;
    googleReviewUrl?: string | null;
  };
  rules: {
    pointsPerCurrencyUnit: number;
    currencyUnit: number;
    minimumPurchaseAmount: number;
    maximumPointsPerTransaction: number;
    pointsValuePer100: number;
    minimumRedemptionPoints: number;
    claimEnabled: boolean;
    claimWindowDays: number;
    dailyClaimLimit: number;
    receiptRequiredAboveAmount: number;
    campaignName: string | null;
    campaignMultiplier: number;
  } | null;
  rewards: Array<{
    id: string;
    name: string;
    description: string | null;
    points_required: number;
    monetary_value: number;
    stock_limit: number | null;
    redeemed_count: number;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    points_change: number;
    amount_change: number;
    points_balance_after: number;
    redeemable_amount_after: number;
    description: string;
    created_at: string;
  }>;
  claims: Array<{
    id: string;
    amount: number;
    purchase_date: string;
    receipt_number: string | null;
    points_awarded: number;
    status: string;
    review_note: string | null;
    created_at: string;
  }>;
  redemptions: Array<{
    id: string;
    redemption_type: string;
    reward_name: string | null;
    points_used: number;
    monetary_value: number;
    status: string;
    requested_at: string;
    notes: string | null;
  }>;
  claimedBonusTasks?: string[];
}

export default function CustomerPublicCardPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;

  const [data, setData] = useState<CardPagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "rewards" | "claim" | "history" | "privacy"
  >("rewards");

  // Shared phone verification (Last 4 digits — Demo default hint for cd_araku_ananya_01 is 8765)
  const [phoneLast4, setPhoneLast4] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Submit Claim state
  const [claimAmount, setClaimAmount] = useState("");
  const [claimDate, setClaimDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [claimReceiptNo, setClaimReceiptNo] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [claimFileUrl, setClaimFileUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Convert Points -> Store Credit state
  const [pointsToConvert, setPointsToConvert] = useState("100");
  const [convertingPoints, setConvertingPoints] = useState(false);

  // Redemption modal state
  const [selectedReward, setSelectedReward] = useState<{
    id: string;
    name: string;
    points: number;
  } | null>(null);
  const [redeemCreditAmount, setRedeemCreditAmount] = useState("");
  const [redeemNotes, setRedeemNotes] = useState("");
  const [submittingRedeem, setSubmittingRedeem] = useState(false);

  // Bonus & Social Rewards state
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [showPinPromptModal, setShowPinPromptModal] = useState(false);
  const [pinPromptTaskId, setPinPromptTaskId] = useState<string | null>(null);
  const [modalPinInput, setModalPinInput] = useState("");

  // Interactive Verification & Review Shield state
  const [selectedTaskToVerify, setSelectedTaskToVerify] = useState<any | null>(null);
  const [proofHandleInput, setProofHandleInput] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const [privateFeedbackText, setPrivateFeedbackText] = useState("");
  const [privateFeedbackSent, setPrivateFeedbackSent] = useState(false);

  // Birthday Club state
  const [birthdayMonth, setBirthdayMonth] = useState(1);
  const [birthdayDay, setBirthdayDay] = useState(1);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [savingBirthday, setSavingBirthday] = useState(false);

  // Privacy / Preferences state
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [confirmDeletionOpen, setConfirmDeletionOpen] = useState(false);

  const loadCard = useCallback(async () => {
    try {
      const res = await fetch(`/api/card/${encodeURIComponent(publicId)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Loyalty card not found.");
      } else {
        setData(json);
        setMarketingConsent(Boolean(json.customer?.marketingConsent));
        if (json.customer?.birthdayMonth)
          setBirthdayMonth(Number(json.customer.birthdayMonth));
        if (json.customer?.birthdayDay)
          setBirthdayDay(Number(json.customer.birthdayDay));
      }
    } catch {
      setError("Unable to load loyalty card. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  async function handleReceiptFileUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    setFeedback(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "receipts");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Receipt upload failed." });
      } else {
        setClaimFileUrl(json.url);
        setFeedback({
          type: "success",
          text: "Receipt uploaded and encrypted with a signed URL.",
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Error uploading receipt file." });
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSubmittingClaim(true);

    try {
      const res = await fetch(
        `/api/card/${encodeURIComponent(publicId)}/purchase-claims`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneLast4,
            amount: Number(claimAmount),
            purchaseDate: claimDate,
            receiptNumber: claimReceiptNo,
            receiptFileUrl: claimFileUrl || null,
            notes: claimNotes,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: json.error || "Claim rejected." });
      } else {
        setFeedback({
          type: "success",
          text: `Purchase claim submitted! +${json.estimatedPoints} pending points queued for merchant review.`,
        });
        setClaimAmount("");
        setClaimReceiptNo("");
        setClaimNotes("");
        setClaimFileUrl("");
        await loadCard();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error submitting claim." });
    } finally {
      setSubmittingClaim(false);
    }
  }

  async function handleConvertPoints(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setConvertingPoints(true);

    try {
      const res = await fetch(
        `/api/card/${encodeURIComponent(publicId)}/redemption-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "convert_points_to_credit",
            phoneLast4,
            pointsToConvert: Number(pointsToConvert),
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Could not convert points.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `Converted ${pointsToConvert} points into ₹${json.creditAdded} store credit!`,
        });
        await loadCard();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error converting points." });
    } finally {
      setConvertingPoints(false);
    }
  }

  async function handleRequestRewardRedemption(
    redemptionType: "reward" | "store_credit"
  ) {
    setFeedback(null);
    setSubmittingRedeem(true);

    try {
      const res = await fetch(
        `/api/card/${encodeURIComponent(publicId)}/redemption-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneLast4,
            redemptionType,
            rewardId:
              redemptionType === "reward" ? selectedReward?.id : undefined,
            creditAmount:
              redemptionType === "store_credit"
                ? Number(redeemCreditAmount)
                : undefined,
            notes: redeemNotes,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Redemption request failed.",
        });
      } else {
        setFeedback({
          type: "success",
          text: "Redemption requested! Show your card at the counter to collect your reward.",
        });
        setSelectedReward(null);
        setRedeemCreditAmount("");
        setRedeemNotes("");
        await loadCard();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error requesting redemption." });
    } finally {
      setSubmittingRedeem(false);
    }
  }

  async function handleClaimBonusTask(
    taskId: string,
    pinToUse?: string,
    proofToUse?: string
  ) {
    const pin = pinToUse || phoneLast4;
    if (!pin || pin.length < 4) {
      setPinPromptTaskId(taskId);
      setShowPinPromptModal(true);
      return;
    }

    setFeedback(null);
    setClaimingTaskId(taskId);
    try {
      const res = await fetch(
        `/api/card/${encodeURIComponent(publicId)}/bonus-rewards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            phoneLast4: pin,
            proofHandle: proofToUse || proofHandleInput.trim() || null,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Unable to claim bonus points.",
        });
      } else {
        setFeedback({
          type: "success",
          text:
            json.message ||
            `+${json.pointsAwarded} bonus points credited to your card!`,
        });
        if (pin && !phoneLast4) {
          setPhoneLast4(pin);
        }
        setShowPinPromptModal(false);
        setPinPromptTaskId(null);
        setSelectedTaskToVerify(null);
        setProofHandleInput("");
        await loadCard();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Network error claiming bonus reward. Please check connection.",
      });
    } finally {
      setClaimingTaskId(null);
    }
  }

  async function handleSaveBirthday(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneLast4) {
      setFeedback({
        type: "error",
        text: "Please enter your 4-digit Security PIN in the bar above first.",
      });
      return;
    }
    setSavingBirthday(true);
    try {
      const res = await fetch(
        `/api/card/${encodeURIComponent(publicId)}/preferences`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneLast4,
            birthdayDay,
            birthdayMonth,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Could not save birthday.",
        });
      } else {
        setFeedback({
          type: "success",
          text: "🎉 Birthday saved! You are now enrolled in our Birthday Club.",
        });
        setEditingBirthday(false);
        await loadCard();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error saving birthday." });
    } finally {
      setSavingBirthday(false);
    }
  }

  const bonusTasks = useMemo(() => {
    const igUrl =
      data?.business?.instagramUrl || "https://instagram.com/scoop_n_breww";
    const googleUrl =
      data?.business?.googleReviewUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        data?.business?.name || "Scoop N Brew"
      )}`;
    const cardUrl =
      data?.card?.publicUrl ||
      `https://loopacards.netlify.app/card/${publicId}`;

    return [
      {
        id: "instagram_follow",
        title: "Follow Us on Instagram",
        handle: "@scoop_n_breww",
        desc: "Follow our official Instagram page for daily updates, reels, new treats & secret discounts.",
        points: 25,
        actionUrl: igUrl,
        actionLabel: "Visit Instagram",
        icon: "instagram" as const,
        badgeBg: "from-pink-500 to-rose-600",
      },
      {
        id: "google_review",
        title: "Leave a 5-Star Google Review",
        handle: "Google Maps Rating",
        desc: "Review your cafe experience and favorite food on Google Maps to help others discover us.",
        points: 30,
        actionUrl: googleUrl,
        actionLabel: "Write Review",
        icon: "star" as const,
        badgeBg: "from-amber-400 to-amber-600",
      },
      {
        id: "instagram_story",
        title: "Tag Us in your Instagram Story",
        handle: "Story Mention",
        desc: "Snap a photo of your waffle, shake or coffee & tag @scoop_n_breww in your Instagram Story.",
        points: 20,
        actionUrl: igUrl,
        actionLabel: "Open Instagram",
        icon: "camera" as const,
        badgeBg: "from-purple-500 to-pink-500",
      },
      {
        id: "refer_friend",
        title: "Invite Friends & Family",
        handle: "Loyalty Referral",
        desc: "Share your loyalty pass link with friends so they can register and earn reward points too.",
        points: 50,
        actionUrl: cardUrl,
        actionLabel: "Share Pass",
        icon: "share" as const,
        badgeBg: "from-emerald-500 to-teal-600",
      },
    ];
  }, [
    data?.business?.instagramUrl,
    data?.business?.googleReviewUrl,
    data?.business?.name,
    data?.card?.publicUrl,
    publicId,
  ]);

  async function handleUpdatePreferences(
    requestDeletion = false
  ) {
    setFeedback(null);
    setSavingPrefs(true);

    try {
      const res = await fetch(
        `/api/card/${encodeURIComponent(publicId)}/preferences`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneLast4,
            marketingConsent,
            privacyRequestType: requestDeletion ? "deletion" : undefined,
            details: requestDeletion
              ? "Customer requested personal data deletion from public card page"
              : undefined,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Could not update preferences.",
        });
      } else {
        setFeedback({
          type: "success",
          text:
            json.message ||
            "Your marketing communication preferences have been saved.",
        });
        setConfirmDeletionOpen(false);
        await loadCard();
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to save preferences." });
    } finally {
      setSavingPrefs(false);
    }
  }

  if (loading) {
    return (
      <main
        id="main-content"
        className="max-w-lg mx-auto w-full px-4 py-8 space-y-4"
      >
        <div className="h-52 rounded bg-surface border border-border animate-pulse p-6" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 rounded bg-surface border border-border animate-pulse" />
          <div className="h-24 rounded bg-surface border border-border animate-pulse" />
          <div className="h-24 rounded bg-surface border border-border animate-pulse" />
        </div>
        <div className="h-64 rounded bg-surface border border-border animate-pulse" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full border border-border bg-surface rounded p-6 text-center">
          <h1 className="text-lg font-bold text-foreground">
            Loyalty Card Unavailable
          </h1>
          <p className="mt-2 text-sm text-muted">
            {error || "This card link could not be loaded."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={loadCard}
              className="px-4 py-2 text-xs font-semibold rounded bg-accent text-white"
            >
              Retry
            </button>
            <Link
              href="/"
              className="px-4 py-2 text-xs font-semibold rounded border border-border bg-surface text-foreground"
            >
              Loopa Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { card, customer, business, rules, rewards, transactions, claims, redemptions } =
    data;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-border bg-surface px-4 py-3 no-print">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-8 h-8 rounded object-cover border border-border shadow-2xs shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: business.primaryColor || "#18181B" }}
              >
                {business.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-foreground leading-tight">
                {business.name}
              </div>
              <div className="text-[11px] text-muted">
                Verified Loopa Digital Card
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/s/${business.slug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Order Menu</span>
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              aria-label="Print physical card"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Card</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5"
      >
        {/* Digital Loyalty Card Pass (Print-ready) */}
        <section
          aria-label="Customer loyalty card summary"
          className="print-card border-2 border-zinc-900 dark:border-zinc-700 rounded bg-surface overflow-hidden shadow-sm"
        >
          <div
            className="px-5 py-4 text-white flex items-start justify-between gap-4"
            style={{ backgroundColor: business.primaryColor || "#18181B" }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {business.logoUrl && (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-12 h-12 rounded object-cover bg-white p-0.5 border border-white/20 shadow-xs shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-widest opacity-80 truncate">
                  {business.name}
                </div>
                <h1 className="mt-0.5 text-xl font-bold tracking-tight truncate">
                  {customer.fullName}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-xs font-mono opacity-90">
                  <span>{card.cardNumber}</span>
                  <span>·</span>
                  <span>{customer.maskedPhone}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={card.status} />
          </div>

          {/* Dual Wallets + Pending Points */}
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-surface-elevated/50">
            <div className="p-3.5 text-center">
              <div className="text-[11px] font-mono uppercase text-muted">
                Points Balance
              </div>
              <div className="mt-1 text-2xl font-extrabold text-foreground font-mono">
                {card.pointsBalance}
              </div>
              <div className="text-[10px] text-muted">Reward Points</div>
            </div>

            <div className="p-3.5 text-center">
              <div className="text-[11px] font-mono uppercase text-muted">
                Store Credit
              </div>
              <div className="mt-1 text-2xl font-extrabold text-accent font-mono">
                {formatCurrency(card.redeemableAmount, business.currency)}
              </div>
              <div className="text-[10px] text-muted">Redeemable Wallet</div>
            </div>

            <div className="p-3.5 text-center">
              <div className="text-[11px] font-mono uppercase text-muted">
                Pending Claim
              </div>
              <div className="mt-1 text-2xl font-bold text-foreground font-mono">
                +{card.pendingPoints}
              </div>
              <div className="text-[10px] text-muted">Awaiting Review</div>
            </div>
          </div>

          {/* QR Code & Instructions */}
          <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-2.5 border border-zinc-200 rounded shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.qrDataUrl}
                alt={`Loyalty QR code for ${customer.fullName} (${card.cardNumber})`}
                width={128}
                height={128}
                className="w-32 h-32 block"
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="text-xs font-semibold text-foreground">
                Show this QR at the counter to earn points or redeem rewards
              </div>
              {rules && (
                <p className="text-xs text-muted leading-relaxed">
                  Earn <strong>{rules.pointsPerCurrencyUnit} pt</strong> per{" "}
                  <strong>
                    {formatCurrency(rules.currencyUnit, business.currency)}
                  </strong>{" "}
                  spent (min{" "}
                  {formatCurrency(
                    rules.minimumPurchaseAmount,
                    business.currency
                  )}
                  ).{" "}
                  {rules.campaignMultiplier > 1 && (
                    <span className="text-accent font-semibold">
                      Active {rules.campaignMultiplier}x bonus:{" "}
                      {rules.campaignName || "Special Campaign"}!
                    </span>
                  )}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 no-print">
                <CopyButton value={card.cardNumber} label="Copy Card #" />
                <CopyButton value={card.publicUrl} label="Copy Card Link" />
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Banner */}
        {feedback && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`p-3.5 rounded border text-xs font-medium no-print ${
              feedback.type === "error"
                ? "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                : "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Card actions and history"
          className="grid grid-cols-4 gap-1 p-1 bg-surface-elevated border border-border rounded no-print"
        >
          <button
            role="tab"
            aria-selected={activeTab === "rewards"}
            type="button"
            onClick={() => setActiveTab("rewards")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded transition-colors ${
              activeTab === "rewards"
                ? "bg-surface text-foreground shadow-sm border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Rewards</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "claim"}
            type="button"
            onClick={() => setActiveTab("claim")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded transition-colors ${
              activeTab === "claim"
                ? "bg-surface text-foreground shadow-sm border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Submit Bill</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "history"}
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded transition-colors ${
              activeTab === "history"
                ? "bg-surface text-foreground shadow-sm border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "privacy"}
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded transition-colors ${
              activeTab === "privacy"
                ? "bg-surface text-foreground shadow-sm border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Privacy</span>
          </button>
        </div>

        {/* Phone Last-4 Verification Bar for Write Actions */}
        <div className="p-3.5 rounded bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <span>
              <strong>Security PIN:</strong> Enter last 4 digits of{" "}
              <span className="font-mono">{customer.maskedPhone}</span> to
              submit bills or redeem
              {publicId === "cd_araku_ananya_01" && (
                <span className="ml-1 text-accent font-mono">(Demo: 8765)</span>
              )}
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            aria-label="Last 4 digits of registered phone number"
            value={phoneLast4}
            onChange={(e) =>
              setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="4 digits"
            className="w-full sm:w-28 px-3 py-1.5 text-xs font-mono text-center rounded border border-border bg-background text-foreground"
          />
        </div>

        {/* TAB 1: REWARDS & WALLET CONVERSION */}
        {activeTab === "rewards" && (
          <section className="space-y-4 no-print">
            {/* Convert Points -> Store Credit Box */}
            {rules && (
              <div className="p-4 rounded bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <ArrowRightLeft className="w-4 h-4 text-accent" />
                    <span>Convert Points to Store Credit (₹)</span>
                  </div>
                  <span className="text-xs font-mono text-muted">
                    100 pts ={" "}
                    {formatCurrency(rules.pointsValuePer100, business.currency)}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Your Points Wallet ({card.pointsBalance} pts) and Store Credit
                  Wallet (
                  {formatCurrency(card.redeemableAmount, business.currency)})
                  are separate. Convert points into store credit anytime (min{" "}
                  {rules.minimumRedemptionPoints} pts).
                </p>
                <form
                  onSubmit={handleConvertPoints}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    type="number"
                    min={rules.minimumRedemptionPoints}
                    max={Math.max(
                      rules.minimumRedemptionPoints,
                      card.pointsBalance
                    )}
                    step={10}
                    value={pointsToConvert}
                    onChange={(e) => setPointsToConvert(e.target.value)}
                    aria-label="Points to convert to store credit"
                    className="w-28 px-3 py-1.5 text-xs font-mono rounded border border-border bg-background text-foreground"
                  />
                  <button
                    type="submit"
                    disabled={
                      convertingPoints ||
                      !phoneLast4 ||
                      card.pointsBalance < rules.minimumRedemptionPoints
                    }
                    className="px-3.5 py-1.5 text-xs font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
                  >
                    {convertingPoints ? "Converting..." : "Convert to ₹ Credit"}
                  </button>
                </form>
              </div>
            )}

            {/* Request Custom Store Credit Redemption */}
            {card.redeemableAmount > 0 && (
              <div className="p-4 rounded bg-surface border border-border space-y-3">
                <div className="text-sm font-bold text-foreground">
                  Redeem Store Credit on Current Bill
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={card.redeemableAmount}
                    value={redeemCreditAmount}
                    onChange={(e) => setRedeemCreditAmount(e.target.value)}
                    placeholder={`Up to ₹${card.redeemableAmount}`}
                    aria-label="Store credit amount to redeem"
                    className="w-36 px-3 py-1.5 text-xs font-mono rounded border border-border bg-background text-foreground"
                  />
                  <input
                    type="text"
                    value={redeemNotes}
                    onChange={(e) => setRedeemNotes(e.target.value)}
                    placeholder="Table # or bill note (optional)"
                    aria-label="Redemption note"
                    className="flex-1 min-w-[160px] px-3 py-1.5 text-xs rounded border border-border bg-background text-foreground"
                  />
                  <button
                    type="button"
                    disabled={
                      submittingRedeem ||
                      !phoneLast4 ||
                      !redeemCreditAmount ||
                      Number(redeemCreditAmount) <= 0
                    }
                    onClick={() =>
                      handleRequestRewardRedemption("store_credit")
                    }
                    className="px-3.5 py-1.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    Request Credit Discount
                  </button>
                </div>
              </div>
            )}

            {/* Special Section: Earn Bonus Points & Social Tasks */}
            <div className="p-4 rounded bg-surface border border-border space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                      <span>Earn Rewards & Bonus Points</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold uppercase tracking-wider">
                        Up to +125 pts
                      </span>
                    </h2>
                    <p className="text-xs text-muted">
                      Complete quick tasks to boost your loyalty points wallet instantly!
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {bonusTasks.map((task) => {
                  const isClaimed = (data?.claimedBonusTasks || []).includes(
                    task.id
                  );
                  const isClaiming = claimingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded border transition-all flex flex-col justify-between gap-3 ${
                        isClaimed
                          ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                          : "bg-surface-elevated/40 border-border hover:border-zinc-400 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded flex items-center justify-center text-white bg-gradient-to-br ${task.badgeBg} shadow-xs shrink-0`}
                            >
                              {task.icon === "instagram" ? (
                                <Instagram className="w-3.5 h-3.5" />
                              ) : task.icon === "star" ? (
                                <Star className="w-3.5 h-3.5 fill-current" />
                              ) : task.icon === "camera" ? (
                                <Camera className="w-3.5 h-3.5" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div>
                              <h3 className="text-xs font-bold text-foreground leading-tight">
                                {task.title}
                              </h3>
                              <span className="text-[10px] text-muted font-mono">
                                {task.handle}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 px-2 py-0.5 text-xs font-mono font-bold rounded-xs ${
                              isClaimed
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                                : "bg-brand/10 text-brand dark:bg-zinc-800 dark:text-zinc-100 border border-border"
                            }`}
                          >
                            +{task.points} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed">
                          {task.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                        {task.id === "refer_friend" ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (navigator.share) {
                                try {
                                  await navigator.share({
                                    title: `Join ${business.name} Loyalty`,
                                    text: `Check out ${business.name} and get your loyalty card with instant points!`,
                                    url: task.actionUrl,
                                  });
                                } catch {}
                              } else {
                                await navigator.clipboard.writeText(
                                  task.actionUrl
                                );
                                setFeedback({
                                  type: "success",
                                  text: "Referral link copied to clipboard! Share it with friends.",
                                });
                              }
                            }}
                            className="flex-1 py-1.5 px-2.5 rounded border border-border bg-surface hover:bg-surface-elevated text-[11px] font-semibold text-foreground flex items-center justify-center gap-1.5"
                          >
                            <Share2 className="w-3 h-3 text-muted" />
                            <span>Share Link</span>
                          </button>
                        ) : (
                          <a
                            href={task.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2.5 rounded border border-border bg-surface hover:bg-surface-elevated text-[11px] font-semibold text-foreground flex items-center justify-center gap-1.5"
                          >
                            <span>{task.actionLabel}</span>
                            <ExternalLink className="w-3 h-3 text-muted" />
                          </a>
                        )}

                        {isClaimed ? (
                          <button
                            type="button"
                            disabled
                            className="py-1.5 px-3 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-default shrink-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Claimed</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskToVerify(task);
                              setProofHandleInput("");
                              setReviewStars(5);
                              setPrivateFeedbackSent(false);
                            }}
                            disabled={isClaiming}
                            className="py-1.5 px-3 rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1 shrink-0 active:translate-y-[0.5px]"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Claim +{task.points} pts</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Birthday Club Card */}
            <div className="p-4 rounded bg-surface border border-border space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-400 flex items-center justify-center text-white text-base shadow-xs shrink-0">
                    🎂
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Birthday Club (Free Treat)
                    </h3>
                    <p className="text-xs text-muted">
                      Tell us your birthday to receive an exclusive complimentary surprise perk on your special day!
                    </p>
                  </div>
                </div>
              </div>

              {customer.birthdayDay &&
              customer.birthdayMonth &&
              !editingBirthday ? (
                <div className="p-3 rounded bg-surface-elevated border border-border flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-muted">Registered Birthday: </span>
                    <strong className="text-foreground">
                      {new Date(
                        2024,
                        customer.birthdayMonth - 1,
                        customer.birthdayDay
                      ).toLocaleString("default", { month: "long" })}{" "}
                      {customer.birthdayDay}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingBirthday(true)}
                    className="text-xs text-accent font-semibold hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveBirthday} className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">
                        Birth Month
                      </label>
                      <select
                        value={birthdayMonth}
                        onChange={(e) =>
                          setBirthdayMonth(Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background text-foreground"
                      >
                        {[
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ].map((m, idx) => (
                          <option key={m} value={idx + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">
                        Birth Day
                      </label>
                      <select
                        value={birthdayDay}
                        onChange={(e) => setBirthdayDay(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-background text-foreground"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={savingBirthday || !phoneLast4}
                      className="px-3 py-1.5 text-xs font-bold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
                    >
                      {savingBirthday ? "Saving..." : "Save Birthday"}
                    </button>
                    {editingBirthday && (
                      <button
                        type="button"
                        onClick={() => setEditingBirthday(false)}
                        className="px-3 py-1.5 text-xs rounded border border-border text-muted"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Catalog Rewards List */}
            <div className="space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                Available Catalog Rewards ({rewards.length})
              </h2>

              {rewards.length === 0 ? (
                <EmptyState
                  title="No rewards published yet"
                  description="Check back soon for new loyalty rewards from this business."
                />
              ) : (
                rewards.map((r) => {
                  const unlocked = card.pointsBalance >= r.points_required;
                  const pct = Math.min(
                    100,
                    Math.round((card.pointsBalance / r.points_required) * 100)
                  );
                  const outOfStock =
                    r.stock_limit !== null &&
                    r.redeemed_count >= r.stock_limit;

                  return (
                    <div
                      key={r.id}
                      className="p-4 rounded bg-surface border border-border space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            {r.name}
                          </h3>
                          {r.description && (
                            <p className="text-xs text-muted mt-0.5">
                              {r.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 px-2.5 py-1 text-xs font-mono font-bold rounded-xs bg-surface-elevated border border-border text-foreground">
                          {r.points_required} pts
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted">
                          <span>
                            {unlocked
                              ? "Ready to redeem!"
                              : `${
                                  r.points_required - card.pointsBalance
                                } more points needed`}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-elevated rounded-none overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted">
                          Value:{" "}
                          {formatCurrency(r.monetary_value, business.currency)}
                          {r.stock_limit !== null &&
                            ` · ${Math.max(
                              0,
                              r.stock_limit - r.redeemed_count
                            )} left`}
                        </span>

                        <button
                          type="button"
                          disabled={!unlocked || outOfStock || !phoneLast4}
                          onClick={() =>
                            setSelectedReward({
                              id: r.id,
                              name: r.name,
                              points: r.points_required,
                            })
                          }
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-opacity"
                        >
                          {outOfStock
                            ? "Out of Stock"
                            : unlocked
                            ? "Request Redemption"
                            : "Locked"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* TAB 2: SUBMIT PURCHASE CLAIM */}
        {activeTab === "claim" && (
          <section className="p-5 rounded bg-surface border border-border space-y-4 no-print">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Submit a Purchase Claim
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Forgot to scan your QR card at the counter? Submit your receipt
                within {rules?.claimWindowDays ?? 7} days for approval.
              </p>
            </div>

            {!rules?.claimEnabled ? (
              <EmptyState
                title="Self-service claims are disabled"
                description="Please ask a staff member at the counter to record your purchase directly."
              />
            ) : (
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="claim-amount"
                      className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                    >
                      Bill Amount ({business.currency}){" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="claim-amount"
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="e.g. 450"
                      className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="claim-date"
                      className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                    >
                      Purchase Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="claim-date"
                      type="date"
                      required
                      value={claimDate}
                      onChange={(e) => setClaimDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="claim-receipt-no"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Receipt / Bill Number (Recommended)
                  </label>
                  <input
                    id="claim-receipt-no"
                    type="text"
                    value={claimReceiptNo}
                    onChange={(e) => setClaimReceiptNo(e.target.value)}
                    placeholder="e.g. INV-2026-8841"
                    className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="claim-receipt-file"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Receipt Photo / PDF{" "}
                    {Number(claimAmount) >=
                      (rules?.receiptRequiredAboveAmount ?? 500) && (
                      <span className="text-red-600">
                        * (Required above ₹{rules?.receiptRequiredAboveAmount})
                      </span>
                    )}
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded border border-border bg-surface-elevated hover:bg-surface cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingReceipt
                          ? "Uploading..."
                          : claimFileUrl
                          ? "Replace Receipt File"
                          : "Upload Receipt Photo"}
                      </span>
                      <input
                        id="claim-receipt-file"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handleReceiptFileUpload}
                        className="hidden"
                      />
                    </label>
                    {claimFileUrl && (
                      <span className="text-xs text-emerald-600 font-medium">
                        ✓ Receipt attached
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="claim-notes"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Items Ordered / Notes
                  </label>
                  <input
                    id="claim-notes"
                    type="text"
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    placeholder="e.g. 2x Iced Pour-Over, 1x Almond Croissant"
                    className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingClaim || uploadingReceipt || !phoneLast4}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {submittingClaim && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>
                    {!phoneLast4
                      ? "Enter 4-Digit Phone PIN Above to Submit"
                      : "Submit Purchase Claim"}
                  </span>
                </button>
              </form>
            )}

            {/* Customer's Recent Claims Status */}
            {claims.length > 0 && (
              <div className="pt-4 border-t border-border space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                  Your Recent Claim Submissions
                </h3>
                {claims.map((cl) => (
                  <div
                    key={cl.id}
                    className="p-3 rounded bg-surface-elevated border border-border flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(cl.amount, business.currency)} ·{" "}
                        {formatDate(cl.purchase_date)}
                      </div>
                      <div className="text-muted">
                        {cl.receipt_number
                          ? `Receipt #${cl.receipt_number}`
                          : "No receipt #"}
                        {cl.review_note ? ` — "${cl.review_note}"` : ""}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <StatusBadge status={cl.status} />
                      <div className="font-mono text-[11px] text-muted">
                        +{cl.points_awarded} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: TRANSACTION & REDEMPTION LEDGER */}
        {activeTab === "history" && (
          <section className="space-y-4 no-print">
            {redemptions.length > 0 && (
              <div className="p-4 rounded bg-surface border border-border space-y-2.5">
                <h2 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                  Redemption Requests
                </h2>
                {redemptions.map((rr) => (
                  <div
                    key={rr.id}
                    className="p-2.5 rounded bg-surface-elevated border border-border flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {rr.reward_name ||
                          `Store Credit (${formatCurrency(
                            rr.monetary_value,
                            business.currency
                          )})`}
                      </div>
                      <div className="text-muted">
                        {formatDate(rr.requested_at, true)}
                        {rr.notes ? ` · ${rr.notes}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={rr.status} />
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 rounded bg-surface border border-border space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                Immutable Transaction Ledger ({transactions.length})
              </h2>
              {transactions.length === 0 ? (
                <EmptyState
                  title="No transactions yet"
                  description="Your earned points and redemptions will appear here immediately."
                />
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {t.description}
                        </div>
                        <div className="text-muted mt-0.5 flex items-center gap-2">
                          <span>{formatDate(t.created_at, true)}</span>
                          <StatusBadge status={t.type} />
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        {t.points_change !== 0 && (
                          <div
                            className={
                              t.points_change > 0
                                ? "text-emerald-600 font-bold"
                                : "text-red-600 font-bold"
                            }
                          >
                            {t.points_change > 0
                              ? `+${t.points_change}`
                              : t.points_change}{" "}
                            pts
                          </div>
                        )}
                        {Number(t.amount_change) !== 0 && (
                          <div className="text-muted">
                            {formatCurrency(t.amount_change, business.currency)}
                          </div>
                        )}
                        <div className="text-[10px] text-muted">
                          Bal: {t.points_balance_after} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 4: PRIVACY & CONSENT (DPDP ACT 2023) */}
        {activeTab === "privacy" && (
          <section className="p-5 rounded bg-surface border border-border space-y-4 no-print">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Consent & Data Rights (DPDP Act 2023)
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Manage your communication consent or request personal data
                deletion from {business.name}.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded bg-surface-elevated border border-border">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-0.5 rounded"
                />
                <span>
                  <strong className="text-foreground block">
                    Loyalty Program Processing Consent (Active)
                  </strong>
                  <span className="text-muted">
                    Required to maintain your points ledger and card balance.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded bg-surface-elevated border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 rounded accent-accent"
                />
                <span>
                  <strong className="text-foreground block">
                    Promotional & Bonus Multiplier Updates
                  </strong>
                  <span className="text-muted">
                    Receive occasional offers and campaign announcements from{" "}
                    {business.name}.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={savingPrefs || !phoneLast4}
                onClick={() => handleUpdatePreferences(false)}
                className="px-4 py-2 text-xs font-semibold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
              >
                {savingPrefs ? "Saving..." : "Save Marketing Preference"}
              </button>

              <button
                type="button"
                disabled={!phoneLast4}
                onClick={() => setConfirmDeletionOpen(true)}
                className="px-3 py-2 text-xs font-medium rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40"
              >
                Request Data Deletion
              </button>
            </div>
          </section>
        )}

        {/* Business Help & Legal Footer */}
        <footer className="pt-4 border-t border-border text-xs text-muted space-y-2 no-print">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {business.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{business.phone}</span>
              </span>
            )}
            {business.address && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{business.address}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="underline hover:text-foreground">
                Terms
              </Link>
              <Link href="/contact" className="underline hover:text-foreground">
                Help & Support
              </Link>
            </div>
            <span>Powered by Loopa</span>
          </div>
        </footer>
      </main>

      {/* Reward Redemption Confirmation Modal */}
      <ConfirmModal
        open={Boolean(selectedReward)}
        title="Confirm Reward Redemption Request"
        description={`This will immediately deduct ${selectedReward?.points} points from your balance and notify counter staff. If cancelled, your points are automatically restored.`}
        recordName={selectedReward?.name}
        confirmLabel="Redeem Reward Now"
        variant="primary"
        loading={submittingRedeem}
        onConfirm={() => handleRequestRewardRedemption("reward")}
        onClose={() => setSelectedReward(null)}
      />

      {/* DPDP Data Deletion Confirmation Modal */}
      <ConfirmModal
        open={confirmDeletionOpen}
        title="Request Personal Data Deletion"
        description="Under the Digital Personal Data Protection Act, 2023, submitting this request flags your personal profile for deletion while preserving anonymized financial audit records."
        recordName={`${customer.fullName} (${card.cardNumber})`}
        confirmLabel="Submit Deletion Request"
        variant="destructive"
        loading={savingPrefs}
        onConfirm={() => handleUpdatePreferences(true)}
        onClose={() => setConfirmDeletionOpen(false)}
      />

      {/* Interactive Bonus Task Claim & Verification Modal */}
      {selectedTaskToVerify && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-5 space-y-4 rounded bg-surface border border-border shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white bg-gradient-to-br ${selectedTaskToVerify.badgeBg} shadow-xs shrink-0`}
                >
                  {selectedTaskToVerify.icon === "instagram" ? (
                    <Instagram className="w-4 h-4" />
                  ) : selectedTaskToVerify.icon === "star" ? (
                    <Star className="w-4 h-4 fill-current" />
                  ) : selectedTaskToVerify.icon === "camera" ? (
                    <Camera className="w-4 h-4" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedTaskToVerify.title}
                  </h3>
                  <p className="text-xs text-muted">
                    Earn +{selectedTaskToVerify.points} loyalty points
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskToVerify(null)}
                className="text-xs text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Step 1: External Action Link */}
            <div className="p-3 rounded bg-surface-elevated border border-border space-y-2">
              <p className="text-xs text-muted leading-relaxed">
                {selectedTaskToVerify.desc}
              </p>
              {selectedTaskToVerify.id === "refer_friend" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://loopacards.netlify.app/s/${data.business.slug}?ref=${data.card.publicId}`}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-border bg-background text-foreground select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://loopacards.netlify.app/s/${data.business.slug}?ref=${data.card.publicId}`
                        );
                        setFeedback({
                          type: "success",
                          text: "Referral link copied!",
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded border border-border bg-surface shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hey! Enjoy delicious food & rewards at ${data.business.name}. Register & order here to get instant loyalty perks: https://loopacards.netlify.app/s/${data.business.slug}?ref=${data.card.publicId}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Share on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <a
                  href={selectedTaskToVerify.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 text-xs font-bold rounded bg-surface hover:bg-background border border-border text-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>{selectedTaskToVerify.actionLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted" />
                </a>
              )}
            </div>

            {/* Google Review Shield */}
            {selectedTaskToVerify.id === "google_review" && (
              <div className="space-y-3 p-3 rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                <p className="text-xs font-bold text-foreground">
                  How was your experience today?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewStars(star)}
                      className={`text-xl transition-transform hover:scale-110 ${
                        reviewStars >= star
                          ? "text-amber-500"
                          : "text-zinc-300 dark:text-zinc-700"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {reviewStars <= 3 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-muted">
                      We're sorry it wasn't 5-star! Please tell management directly
                      what happened:
                    </p>
                    <textarea
                      rows={2}
                      value={privateFeedbackText}
                      onChange={(e) => setPrivateFeedbackText(e.target.value)}
                      placeholder="Your honest feedback..."
                      className="w-full p-2 text-xs rounded border border-border bg-background text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPrivateFeedbackSent(true);
                        setFeedback({
                          type: "success",
                          text: "Thank you for your valuable feedback! Management has been notified.",
                        });
                        setSelectedTaskToVerify(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded bg-zinc-800 text-white"
                    >
                      Send Feedback Privately
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Verification Inputs Form */}
            {(selectedTaskToVerify.id !== "google_review" ||
              reviewStars >= 4) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaimBonusTask(
                    selectedTaskToVerify.id,
                    phoneLast4,
                    proofHandleInput
                  );
                }}
                className="space-y-3 pt-1"
              >
                {selectedTaskToVerify.id === "google_review" ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">
                      Your Google Account Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={proofHandleInput}
                      onChange={(e) => setProofHandleInput(e.target.value)}
                      placeholder="e.g. Shivam K."
                      className="w-full px-3 py-1.5 text-xs rounded border border-border bg-background text-foreground"
                    />
                  </div>
                ) : (selectedTaskToVerify.id === "instagram_follow" ||
                    selectedTaskToVerify.id === "instagram_story") ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">
                      Your Instagram Username / Handle
                    </label>
                    <input
                      type="text"
                      required
                      value={proofHandleInput}
                      onChange={(e) => setProofHandleInput(e.target.value)}
                      placeholder="e.g. @shivam_01"
                      className="w-full px-3 py-1.5 text-xs rounded border border-border bg-background text-foreground font-mono"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    Security PIN (Last 4 digits of {customer.maskedPhone})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={phoneLast4}
                    onChange={(e) =>
                      setPhoneLast4(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    placeholder="4 digits"
                    className="w-full px-3 py-1.5 text-xs font-mono text-center rounded border border-border bg-background text-foreground tracking-widest"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskToVerify(null)}
                    className="flex-1 py-2 text-xs font-semibold rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      claimingTaskId !== null ||
                      phoneLast4.length < 4 ||
                      (selectedTaskToVerify.id !== "refer_friend" &&
                        !proofHandleInput.trim())
                    }
                    className="flex-1 py-2 text-xs font-bold rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50 shadow-xs"
                  >
                    {claimingTaskId
                      ? "Verifying..."
                      : `Claim +${selectedTaskToVerify.points} pts`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bonus Task Security PIN Modal */}
      {showPinPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 space-y-4 rounded bg-surface border border-border shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-bold text-foreground">
                  Confirm Security PIN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPinPromptModal(false);
                  setPinPromptTaskId(null);
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Please enter the last 4 digits of your registered mobile number (
              <span className="font-mono">{customer.maskedPhone}</span>) to claim
              your bonus points.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pinPromptTaskId && modalPinInput.length === 4) {
                  handleClaimBonusTask(pinPromptTaskId, modalPinInput);
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={modalPinInput}
                onChange={(e) =>
                  setModalPinInput(
                    e.target.value.replace(/\D/g, "").slice(0, 4)
                  )
                }
                placeholder="4 digits"
                className="w-full px-3 py-2 text-base font-mono text-center rounded border border-border bg-background text-foreground tracking-widest focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinPromptModal(false);
                    setPinPromptTaskId(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold rounded border border-border bg-surface hover:bg-surface-elevated text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    modalPinInput.length < 4 || claimingTaskId !== null
                  }
                  className="flex-1 py-2 text-xs font-semibold rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {claimingTaskId ? "Verifying..." : "Verify & Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

