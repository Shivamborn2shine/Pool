"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import StoreOrderingView from "@/components/store/StoreOrderingView";
import {
  QrCode,
  Gift,
  Receipt,
  History,
  Printer,
  Plus,
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
  Home,
  Coffee,
  Utensils,
  Menu,
  Wallet,
  ChevronRight,
  User,
  ShoppingBag,
  X,
  ChevronLeft,
  Copy,
  Cake,
  Check,
  Lock,
  Info,
  Users,
  Pencil,
  LogOut,
  Award,
} from "lucide-react";
import CustomerAccountDrawer from "@/components/store/CustomerAccountDrawer";
import {
  CopyButton,
  StatusBadge,
  EmptyState,
  ConfirmModal,
} from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ComboShowcaseItem {
  id?: string;
  name: string;
  price: number;
  original: number;
  savings: number;
  itemsText: string;
  points: number;
  image: string;
  badge: string;
}

const DEFAULT_COMBOS: ComboShowcaseItem[] = [
  {
    id: "combo-1",
    name: "The Study Break",
    price: 109,
    original: 124,
    savings: 15,
    itemsText: "Veg Sandwich (₹99) + Regular Chai (₹25)",
    points: 5,
    image:
      "https://axkhqktmixesmrafcrju.supabase.co/storage/v1/object/public/business-assets/1793594270148-8820b3522fcb.png",
    badge: "Most Popular",
  },
  {
    id: "combo-2",
    name: "Fries Before Guys",
    price: 169,
    original: 188,
    savings: 19,
    itemsText: "Peri Peri Fries (₹89) + Oreo Shake (₹99)",
    points: 8,
    image:
      "https://axkhqktmixesmrafcrju.supabase.co/storage/v1/object/public/business-assets/1793594251133-70e562454a39.png",
    badge: "Save ₹19",
  },
  {
    id: "combo-3",
    name: "Sweet Tooth Therapy",
    price: 199,
    original: 228,
    savings: 29,
    itemsText: "Chocolate Waffle (₹129) + Oreo Shake (₹99)",
    points: 9,
    image:
      "https://axkhqktmixesmrafcrju.supabase.co/storage/v1/object/public/business-assets/1793594230144-9188d78bf9da.png",
    badge: "Sweet Deal",
  },
  {
    id: "combo-4",
    name: "Campus Cravings",
    price: 249,
    original: 287,
    savings: 38,
    itemsText: "Veg Burger (₹99) + Peri Peri Fries (₹89) + Watermelon Mojito (₹99)",
    points: 12,
    image:
      "https://axkhqktmixesmrafcrju.supabase.co/storage/v1/object/public/business-assets/1793594209736-0b7902a842c3.png",
    badge: "Combo Feast",
  },
  {
    id: "combo-5",
    name: "Sip & Gossip (For 2)",
    price: 259,
    original: 297,
    savings: 38,
    itemsText: "Loaded Fries (₹99) + 2x Coolers / Mojitos (₹198)",
    points: 12,
    image:
      "https://axkhqktmixesmrafcrju.supabase.co/storage/v1/object/public/business-assets/1793594179228-339aef2eed9c.png",
    badge: "Duo Refresh",
  },
  {
    id: "combo-6",
    name: "Better Together (For 2)",
    price: 419,
    original: 485,
    savings: 66,
    itemsText: "2x Burgers (₹198) + Fries (₹89) + 2x Mojitos (₹198)",
    points: 20,
    image:
      "https://axkhqktmixesmrafcrju.supabase.co/storage/v1/object/public/business-assets/1793594156281-4c331ef672d6.png",
    badge: "Duo Deal",
  },
  {
    id: "combo-7",
    name: "The Whole Gang (Group Deal)",
    price: 699,
    original: 772,
    savings: 73,
    itemsText: "4x Burgers (₹396) + 2x Fries (₹178) + 2x Mojitos (₹198)",
    points: 34,
    image:
      "https://axkhqktmixesmrafcrju.supabase.co/storage/v1/object/public/business-assets/1793594110517-a0219a61ba68.png",
    badge: "Save ₹73!",
  },
];

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
    email?: string | null;
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
    image_url?: string | null;
    points_required: number;
    monetary_value: number;
    stock_limit: number | null;
    redeemed_count: number;
    sort_order?: number;
  }>;
  combos?: ComboShowcaseItem[];
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

function getRewardImage(name: string, fallbackUrl?: string | null): string {
  if (
    fallbackUrl &&
    (fallbackUrl.startsWith("http") ||
      fallbackUrl.startsWith("/") ||
      fallbackUrl.startsWith("data:"))
  ) {
    return fallbackUrl;
  }
  const n = (name || "").toLowerCase();
  if (n.includes("chai") || n.includes("tea")) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("coffee") || n.includes("latte") || n.includes("brew") || n.includes("cappuccino")) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("mojito") || n.includes("cooler") || n.includes("drink")) {
    return "/images/menu/watermelon-mojito.jpg";
  }
  if (n.includes("fries") || n.includes("potato") || n.includes("peri peri")) {
    return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("pastry") || n.includes("croissant") || n.includes("bakery")) {
    return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("biscoff")) {
    return "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("waffle") || n.includes("chocolate waffle")) {
    return "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("bill") || n.includes("off") || n.includes("discount") || n.includes("voucher") || n.includes("50 off")) {
    return "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=80";
  }
  if (
    n.includes("beverage") ||
    n.includes("shake") ||
    n.includes("frappe")
  ) {
    return "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80";
  }
  if (
    n.includes("merchandise") ||
    n.includes("bag") ||
    n.includes("tote") ||
    n.includes("shirt") ||
    n.includes("tumbler") ||
    n.includes("mug") ||
    n.includes("pack") ||
    n.includes("sticker")
  ) {
    return "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=500&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
}

function CuteCoffeeMascot({
  showTagline = false,
  size = "sm",
}: {
  showTagline?: boolean;
  size?: "sm" | "md";
}) {
  const dimClass =
    size === "sm" ? "w-20 h-20 sm:w-22 sm:h-22" : "w-28 h-28 sm:w-32 sm:h-32";

  return (
    <div className="relative flex flex-col items-center select-none shrink-0">
      <div className={`relative ${dimClass}`}>
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-sm overflow-visible"
        >
          {/* Coffee Splash Droplets */}
          <path
            d="M 125 35 Q 135 15 142 22 Q 148 30 132 40 Z"
            fill="#E07A5F"
          />
          <circle cx="118" cy="18" r="4" fill="#E07A5F" />
          <circle cx="92" cy="12" r="3.5" fill="#E07A5F" />
          <circle cx="138" cy="42" r="2.5" fill="#F4A261" />

          {/* Steam curves */}
          <path
            d="M 68 24 Q 63 14 70 8"
            stroke="#F4A261"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M 82 22 Q 88 12 80 6"
            stroke="#F4A261"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />

          {/* Left Waving Arm */}
          <path
            d="M 38 65 Q 22 50 18 38 Q 24 35 28 46 Q 32 58 42 70 Z"
            fill="#3D2619"
          />

          {/* Right Arm */}
          <path
            d="M 120 72 Q 132 80 135 72 Q 130 64 118 64 Z"
            fill="#3D2619"
          />

          {/* Cup Handle */}
          <path
            d="M 116 52 C 142 52 142 98 116 98"
            fill="none"
            stroke="#F5CAC3"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Cup Body (Ceramic) */}
          <path
            d="M 40 48 Q 40 120 78 122 Q 116 120 116 48 Z"
            fill="#FFFFFF"
            stroke="#F5CAC3"
            strokeWidth="4"
          />

          {/* Cup Rim Top */}
          <ellipse cx="78" cy="48" rx="38" ry="10" fill="#EAE0D5" />
          {/* Coffee liquid surface */}
          <ellipse cx="78" cy="48" rx="33" ry="8" fill="#5C3D2E" />
          {/* Coffee froth shine */}
          <path
            d="M 55 47 Q 78 43 100 48"
            stroke="#8C624D"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cute Face: Closed Smiling Eyes */}
          <circle cx="63" cy="74" r="3.5" fill="#2B1E16" />
          <circle cx="93" cy="74" r="3.5" fill="#2B1E16" />
          {/* Eye sparkle */}
          <circle cx="64.5" cy="72.5" r="1.2" fill="#FFFFFF" />
          <circle cx="94.5" cy="72.5" r="1.2" fill="#FFFFFF" />

          {/* Rosy Cheeks */}
          <ellipse cx="56" cy="80" rx="5" ry="3" fill="#F28482" opacity="0.6" />
          <ellipse cx="100" cy="80" rx="5" ry="3" fill="#F28482" opacity="0.6" />

          {/* Happy Open Smiling Mouth */}
          <path
            d="M 72 82 Q 78 94 84 82 Q 78 86 72 82 Z"
            fill="#800E13"
          />
          <path
            d="M 74 86 Q 78 92 82 86 Z"
            fill="#F28482"
          />

          {/* Feet */}
          <ellipse cx="64" cy="125" rx="5" ry="3" fill="#3D2619" />
          <ellipse cx="92" cy="125" rx="5" ry="3" fill="#3D2619" />
        </svg>
      </div>
      {showTagline && (
        <div className="text-[11px] font-black leading-tight text-center text-[#B23B44] -mt-2 tracking-tight whitespace-nowrap rotate-[-3deg]">
          Good Coffee,
          <br />
          Happier You!
        </div>
      )}
    </div>
  );
}

function CompactBalanceBar({
  points,
  credit,
  currency,
  targetPoints,
  onCreditClick,
  onTreatClick,
}: {
  points: number;
  credit: number;
  currency: string;
  targetPoints: number;
  onCreditClick: () => void;
  onTreatClick: () => void;
}) {
  const percent = Math.min(100, Math.max(8, Math.round((points / targetPoints) * 100)));
  const pointsToNext = Math.max(0, targetPoints - points);

  // SVG circular mini gauge
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border border-rose-100/70 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-1.5 sm:gap-3">
      {/* 1. Points Radial Gauge */}
      <button
        type="button"
        onClick={onTreatClick}
        aria-label="View points balance"
        className="flex items-center gap-2 group text-left cursor-pointer transition-transform active:scale-95"
      >
        <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r={r}
              fill="none"
              stroke="#FDE8EC"
              strokeWidth="3.5"
              className="dark:stroke-zinc-800"
            />
            <circle
              cx="24"
              cy="24"
              r={r}
              fill="none"
              stroke="#E11D48"
              strokeWidth="3.5"
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          {/* Star at top */}
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold shadow-2xs">
            ★
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 leading-none">
              {points}
            </span>
            <span className="text-[8px] sm:text-[9px] font-medium text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">
              Points
            </span>
          </div>
        </div>
      </button>

      {/* Divider */}
      <div className="h-8 w-[1px] bg-rose-100/70 dark:bg-zinc-800 shrink-0" />

      {/* 2. Store Credit */}
      <button
        type="button"
        onClick={onCreditClick}
        aria-label="View store credit"
        className="flex items-center gap-2 group text-left cursor-pointer transition-transform active:scale-95"
      >
        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-[#E11D48] shrink-0">
          <Wallet className="w-4 h-4 text-[#E11D48]" />
        </div>
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 leading-none">
            {formatCurrency(credit, currency)}
          </div>
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 leading-none">
            Store Credit
          </div>
        </div>
      </button>

      {/* Divider */}
      <div className="h-8 w-[1px] bg-rose-100/70 dark:bg-zinc-800 shrink-0" />

      {/* 3. Next Treat Progress */}
      <button
        type="button"
        onClick={onTreatClick}
        aria-label="View rewards catalog"
        className="flex items-center gap-2 group text-left cursor-pointer transition-transform active:scale-95 min-w-0"
      >
        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-[#E11D48] shrink-0">
          <Gift className="w-4 h-4 text-[#E11D48]" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-none truncate">
            {pointsToNext > 0 ? `${pointsToNext} pts to next treat` : "Ready to claim treat!"}
          </div>
          <div className="w-16 sm:w-24 h-1.5 bg-rose-100 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-[#E11D48] rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </button>
    </div>
  );
}

export default function CustomerPublicCardPage() {
  const params = useParams<{ publicId: string }>();
  const searchParams = useSearchParams();
  const publicId = params.publicId;

  const [data, setData] = useState<CardPagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "home" | "menu" | "rewards" | "claim" | "history" | "privacy"
  >("home");

  // Sync activeTab with URL ?tab= query parameter seamlessly
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["home", "menu", "rewards", "claim", "history", "privacy"].includes(tabParam)
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const handleTabChange = (
    newTab: "home" | "menu" | "rewards" | "claim" | "history" | "privacy"
  ) => {
    setActiveTab(newTab);
    try {
      const url = new URL(window.location.href);
      if (newTab === "home") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", newTab);
      }
      window.history.replaceState(null, "", url.toString());
    } catch {}
  };

  // Mobile App Modals & Drawer state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showAccountDrawer, setShowAccountDrawer] = useState(false);
  const [showAllRewardsModal, setShowAllRewardsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [menuTargetCategory, setMenuTargetCategory] = useState<string>("all");

  // Shared phone verification (Last 4 digits — Demo default hint for cd_araku_ananya_01 is 8765)
  const [phoneLast4, setPhoneLast4] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Auto-dismiss and hardware vibration for floating feedback toast
  useEffect(() => {
    if (!feedback) {
      setIsFadingOut(false);
      return;
    }

    // Hardware vibration on mobile devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch {}
    }

    setIsFadingOut(false);

    // After 3.5 seconds, start slow smooth fade-out
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3500);

    // After fade-out animation completes (4.2 seconds total), unmount feedback
    const removeTimer = setTimeout(() => {
      setFeedback(null);
      setIsFadingOut(false);
    }, 4200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [feedback]);

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
    image_url?: string | null;
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

  // First signup celebratory popup trigger (Loopa Spec 2.1: 40 Welcome Points)
  useEffect(() => {
    if (!loading && data?.card && data.card.pointsBalance >= 40) {
      try {
        const welcomeKey = `loopa_welcome_seen_${data.card.publicId}`;
        const seen = window.localStorage.getItem(welcomeKey);
        if (!seen) {
          setShowWelcomeModal(true);
        }
      } catch {}
    }
  }, [loading, data?.card?.pointsBalance, data?.card?.publicId]);

  const handleDismissWelcomeModal = (goToMenu = false) => {
    try {
      if (data?.card?.publicId) {
        window.localStorage.setItem(
          `loopa_welcome_seen_${data.card.publicId}`,
          "true"
        );
      }
    } catch {}
    setShowWelcomeModal(false);
    if (goToMenu) {
      setMenuTargetCategory("combo");
      handleTabChange("menu");
    }
  };

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

  const handleLogout = () => {
    try {
      if (business?.slug) {
        window.localStorage.removeItem(`loopa_store_session_${business.slug}`);
      }
      window.localStorage.removeItem("loopa_customer_session");
      window.sessionStorage.clear();
    } catch {}
    if (business?.slug) {
      window.location.href = `/s/${business.slug}`;
    } else {
      window.location.reload();
    }
  };

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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded border border-border bg-surface text-foreground hover:bg-surface-elevated"
            >
              <img
                src="/loopa-logo.png"
                alt="Loopa"
                className="w-3.5 h-3.5 rounded-xs object-contain"
              />
              <span>Loopa Home</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { card, customer, business, rules, rewards, transactions, claims, redemptions, combos } =
    data;

  const customerFirstName = customer?.fullName?.split(" ")[0] || "Friend";

  const safeRewards = Array.isArray(rewards) ? rewards : [];
  const sortedRewards = [...safeRewards].sort((a, b) => {
    const orderA = a.sort_order ?? 100;
    const orderB = b.sort_order ?? 100;
    if (orderA !== orderB) return orderA - orderB;
    return a.points_required - b.points_required;
  });

  const nextReward =
    sortedRewards.find((r) => r.points_required > card.pointsBalance) ||
    sortedRewards[sortedRewards.length - 1] || {
      id: "beverage",
      name: "Free Beverage",
      points_required: 50,
      description: null,
      monetary_value: 120,
      stock_limit: null,
      redeemed_count: 0,
    };

  const pointsToNext = Math.max(
    0,
    nextReward.points_required - card.pointsBalance
  );

  const displayRewards =
    sortedRewards.length > 0
      ? sortedRewards.slice(0, 3)
      : [
          {
            id: "beverage",
            name: "Free Beverage",
            points_required: 50,
            description: null,
            monetary_value: 120,
            stock_limit: null,
            redeemed_count: 0,
          },
          {
            id: "pastry",
            name: "Free Pastry",
            points_required: 100,
            description: null,
            monetary_value: 150,
            stock_limit: null,
            redeemed_count: 0,
          },
          {
            id: "merchandise",
            name: "Exclusive Merchandise",
            points_required: 200,
            description: null,
            monetary_value: 350,
            stock_limit: null,
            redeemed_count: 0,
          },
        ];

  // Combos showcase: Use live database combos from API, or fallback to the full 7 updated combos
  const displayCombos: ComboShowcaseItem[] =
    combos && combos.length > 0 ? combos : DEFAULT_COMBOS;

  return (
    <div className="min-h-screen bg-[#FAF6F0] dark:bg-[#121110] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Soft Ambient Cafe Glows */}
      <div className="absolute top-12 -left-20 w-56 h-56 bg-amber-200/30 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-28 -right-16 w-56 h-56 bg-rose-200/35 dark:bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[480px] -left-12 w-64 h-36 bg-amber-200/20 dark:bg-amber-950/15 rounded-full blur-2xl pointer-events-none" />

      {/* Target App Header (Recommended 56–60px) */}
      <header className="sticky top-0 z-30 bg-[#FAF6F0]/95 dark:bg-[#121110]/95 backdrop-blur-md px-4 h-14 sm:h-15 border-b border-rose-100/60 dark:border-zinc-800/60 no-print flex items-center">
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          {activeTab !== "home" ? (
            <button
              type="button"
              onClick={() => handleTabChange("home")}
              aria-label="Back to home"
              className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/50 text-[#E11D48] dark:text-rose-400 border border-rose-200/80 dark:border-rose-800 hover:bg-rose-100 transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowMenuDrawer(true)}
              aria-label="Open menu navigation"
              className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-zinc-800 dark:text-zinc-200 hover:bg-rose-100/50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>
          )}

          <div className="flex flex-col items-center text-center min-w-0 px-1">
            <h1 className="text-lg sm:text-xl font-serif font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-none truncate">
              {business.name}
            </h1>
            <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase mt-1 truncate">
              GOOD COFFEE · BRIGHTER DAYS
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && "vibrate" in navigator) {
                try {
                  navigator.vibrate([30, 20, 30]);
                } catch {}
              }
              setShowAccountDrawer(true);
            }}
            aria-label={`Open account and loyalty details for ${customerFirstName}`}
            title="My Account & Loyalty"
            className="bg-[#FDF2F4] dark:bg-rose-950/40 rounded-full sm:rounded-2xl px-2.5 py-1 sm:px-3 sm:py-1.5 border border-rose-200/70 dark:border-rose-900/40 flex items-center gap-2 transition-all hover:shadow-xs active:scale-95 cursor-pointer shadow-2xs shrink-0"
          >
            <div
              className="w-6 h-6 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs uppercase shrink-0"
              style={{ backgroundColor: business.primaryColor || "#E11D48" }}
            >
              {(customer?.fullName || "S").slice(0, 1)}
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="font-black text-xs text-zinc-900 dark:text-zinc-100 tabular-nums flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#E11D48] dark:text-rose-400 shrink-0" />
                <span>{card.pointsBalance} pts</span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 truncate max-w-[65px] sm:max-w-[100px] mt-0.5">
                {customerFirstName}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Hidden on screen, visible only when printing physical card pass */}
      <div className="hidden print:block max-w-lg mx-auto w-full p-4">
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

          <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-2.5 border border-zinc-200 rounded shrink-0">
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
                  ).
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <main
        id="main-content"
        className={`flex-1 max-w-md mx-auto w-full ${
          activeTab === "menu"
            ? "px-3.5 pt-1 pb-24 space-y-2.5"
            : "px-4 pt-3 pb-28 space-y-4"
        } no-print`}
      >
        {/* HOME VIEW: EXACT REPLICA OF USER TARGET DESIGN (SLEEK COMPACT) */}
        {activeTab === "home" && (
          <div className="space-y-4">
            {/* Greeting Hero */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight flex items-center gap-1.5 flex-wrap">
                  <span>Hey, {customerFirstName}!</span>
                  <span className="inline-block text-2xl">👋</span>
                </h2>
                <p className="mt-1 text-sm sm:text-base font-normal text-zinc-500 dark:text-zinc-400 leading-snug">
                  Good things are brewing.
                </p>
              </div>
              <CuteCoffeeMascot showTagline={false} size="sm" />
            </div>

            {/* UNIFIED COMPACT BALANCE BAR (Radial Gauge + Store Credit + Next Treat Progress) */}
            <CompactBalanceBar
              points={card.pointsBalance}
              credit={card.redeemableAmount}
              currency={business.currency}
              targetPoints={nextReward?.points_required || 30}
              onCreditClick={() => setShowCreditModal(true)}
              onTreatClick={() => setActiveTab("rewards")}
            />

            {/* REWARDS FOR YOU (At the very first on top) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Rewards for you
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("rewards")}
                  className="text-xs font-bold text-[#E11D48] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {displayRewards.map((reward) => (
                  <div
                    key={reward.id}
                    onClick={() => {
                      if (card.pointsBalance >= reward.points_required) {
                        setSelectedReward({
                          id: reward.id,
                          name: reward.name,
                          points: reward.points_required,
                          image_url: reward.image_url,
                        });
                      } else {
                        setFeedback({
                          type: "error",
                          text: `You need ${reward.points_required - card.pointsBalance} more points to claim ${reward.name}. Show your QR at checkout to earn!`,
                        });
                      }
                    }}
                    className="bg-white dark:bg-zinc-900 hover:bg-rose-50/40 dark:hover:bg-zinc-800/60 border border-rose-100/70 dark:border-zinc-800 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.02] shadow-2xs group"
                  >
                    <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden mb-2 bg-rose-50/50 dark:bg-zinc-800">
                      <img
                        src={getRewardImage(reward.name, reward.image_url)}
                        alt={reward.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                    <h4 className="text-xs font-serif font-bold text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-1">
                      {reward.name}
                    </h4>
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                      at {reward.points_required} points
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TRY A COMBO & SAVE 🔥 (Kept in the middle) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
                    <span>Try a combo & save</span>
                    <span className="text-amber-500">🔥</span>
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Pair your favorites & save up to ₹73 • Earn loyalty points!
                  </p>
                </div>
              </div>

              {/* Scrollable Horizontal Showcase of Top Combos */}
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar pt-1 -mx-4 px-4">
                {displayCombos.map((combo) => (
                  <div
                    key={combo.name}
                    className="w-[270px] sm:w-[280px] shrink-0 bg-white dark:bg-zinc-900 rounded-3xl p-3 border border-rose-100/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden bg-rose-50 dark:bg-zinc-800 mb-2.5">
                        <img
                          src={combo.image}
                          alt={combo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80";
                          }}
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                          {combo.badge}
                        </span>
                        {combo.savings > 0 && (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                            Save ₹{combo.savings}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-serif font-black text-zinc-900 dark:text-zinc-100 truncate">
                        {combo.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5 leading-tight font-medium">
                        {combo.itemsText}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-rose-50 dark:border-zinc-800/80 flex items-center justify-between gap-1.5">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                            ₹{combo.price}
                          </span>
                          <span className="text-xs text-zinc-400 line-through">
                            ₹{combo.original}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          +{combo.points} pts
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuTargetCategory("combo");
                          handleTabChange("menu");
                        }}
                        className="px-4 py-1.5 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                      >
                        Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ORDER FOOD & DRINKS (Shifted to the bottom) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Order Food & Drinks
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Freshly prepared • Dine-in & takeaway • Earn points
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuTargetCategory("all");
                    handleTabChange("menu");
                  }}
                  className="text-xs font-bold text-[#E11D48] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Full Menu</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 2x3 Quick Category Shortcuts */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  {
                    id: "combo",
                    name: "Combos & Deals",
                    badge: "SAVE ₹",
                    subtext: "Up to ₹75 off",
                    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&auto=format&fit=crop&q=80",
                  },
                  {
                    id: "coffee",
                    name: "Hot Coffee",
                    subtext: null,
                    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=160&auto=format&fit=crop&q=80",
                  },
                  {
                    id: "fries",
                    name: "Fries & Spirals",
                    subtext: null,
                    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=160&auto=format&fit=crop&q=80",
                  },
                  {
                    id: "waffle",
                    name: "Waffles",
                    subtext: null,
                    image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=160&auto=format&fit=crop&q=80",
                  },
                  {
                    id: "mojito",
                    name: "Mojitos & Shakes",
                    subtext: null,
                    image: "/images/menu/watermelon-mojito.jpg",
                  },
                  {
                    id: "bread",
                    name: "Breads & Buns",
                    subtext: null,
                    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=160&auto=format&fit=crop&q=80",
                  },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setMenuTargetCategory(cat.id);
                      handleTabChange("menu");
                    }}
                    className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-rose-100/70 dark:border-zinc-800 shadow-2xs hover:shadow-xs hover:border-rose-200 dark:hover:border-zinc-700 transition-all text-left group flex items-center justify-between cursor-pointer active:scale-[0.98] min-h-[50px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 bg-rose-50 dark:bg-zinc-800 flex items-center justify-center">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1550547660-d9450f859349?w=160&auto=format&fit=crop&q=80";
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        {cat.badge && (
                          <div className="mb-0.5">
                            <span className="inline-block text-[8px] font-black uppercase tracking-wider text-[#E11D48] bg-rose-100 dark:bg-rose-950/70 px-1.5 py-0.5 rounded leading-none">
                              {cat.badge}
                            </span>
                          </div>
                        )}
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block group-hover:text-[#E11D48] transition-colors leading-tight truncate">
                          {cat.name}
                        </span>
                        {cat.subtext && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block leading-tight mt-0.5 truncate">
                            {cat.subtext}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* When in other tabs, show breadcrumb back button */}
        {activeTab !== "home" && activeTab !== "menu" && activeTab !== "rewards" && (
          <div className="flex items-center justify-between gap-2 pb-1">
            <button
              type="button"
              onClick={() => handleTabChange("home")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <span className="text-xs font-mono font-semibold text-zinc-500">
              {card.cardNumber}
            </span>
          </div>
        )}

        {/* Navigation Tabs (visible when not in home, menu or rewards) */}
        {activeTab !== "home" && activeTab !== "menu" && activeTab !== "rewards" && (
          <div
            role="tablist"
            aria-label="Card actions and history"
            className="grid grid-cols-4 gap-1 p-1 bg-surface-elevated border border-border rounded no-print"
          >
            <button
              role="tab"
              aria-selected={(activeTab as string) === "rewards"}
              type="button"
              onClick={() => handleTabChange("rewards")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded transition-colors ${
                (activeTab as string) === "rewards"
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
              onClick={() => handleTabChange("claim")}
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
              onClick={() => handleTabChange("history")}
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
              onClick={() => handleTabChange("privacy")}
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
        )}

        {/* Phone Last-4 Verification Bar for Write Actions */}
        {activeTab !== "home" && activeTab !== "menu" && activeTab !== "rewards" && (
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
        )}

        {/* TAB: SEAMLESS INTEGRATED STORE MENU & ORDERING */}
        {activeTab === "menu" && (
          <section className="space-y-2.5 no-print animate-in fade-in duration-200">
            <StoreOrderingView
              storeSlug={business.slug}
              initialCustomer={{
                cardPublicId: card.publicId,
                cardNumber: card.cardNumber,
                fullName: customer.fullName,
                displayName: customer.fullName,
                phone: customer.maskedPhone,
                maskedPhone: customer.maskedPhone,
                pointsBalance: card.pointsBalance,
                redeemableAmount: card.redeemableAmount,
                email: (customer as any).email || null,
              }}
              embedded={true}
              initialCategory={menuTargetCategory}
              onBackToHome={() => handleTabChange("home")}
              onNavigateTab={(tab) => {
                if (tab === "home") handleTabChange("home");
                else if (tab === "rewards") handleTabChange("rewards");
                else if (tab === "orders") handleTabChange("history");
                else if (tab === "profile") handleTabChange("privacy");
              }}
            />
          </section>
        )}

        {/* TAB 1: REWARDS & WALLET CONVERSION — AWARD-WINNING CAFE APP DESIGN */}
        {activeTab === "rewards" && (
          <section className="space-y-5 no-print pb-4 animate-in fade-in duration-200">
            {/* 1. Hero Promo Banner */}
            <div className="relative rounded-3xl p-5 overflow-hidden bg-gradient-to-br from-[#FFF5EE] via-[#FFF1F2] to-[#FFF0F5] dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 border border-rose-200/60 dark:border-zinc-800 shadow-sm">
              <div className="absolute top-0 right-0 w-44 h-44 bg-rose-200/30 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="space-y-1.5 max-w-[210px] sm:max-w-xs">
                  <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
                    Your rewards <br />
                    are{" "}
                    <span className="text-[#E11D48] italic font-serif">
                      brewing! 💕 🪄
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                    Collect points, unlock treats and make every coffee moment
                    brighter.
                  </p>
                </div>

                {/* Mascot Illustration */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative">
                    <span className="text-4xl animate-bounce">☕</span>
                    <span className="absolute -top-1 -right-1 text-sm">✨</span>
                  </div>
                  <div className="mt-1 text-center">
                    <span className="block text-[10px] font-extrabold text-[#9F1239] dark:text-rose-400 leading-tight">
                      Good Coffee
                    </span>
                    <span className="block text-[10px] font-extrabold text-[#9F1239] dark:text-rose-400 leading-tight">
                      Brighter Days!
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 relative z-10">
                {/* 1. Points Card */}
                <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-2xl p-2.5 sm:p-3 border border-rose-100/80 dark:border-zinc-700/60 shadow-xs flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 leading-none">
                        {card.pointsBalance}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Points
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("earn-more-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#E11D48] hover:bg-rose-700 text-white font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5 shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Earn More</span>
                    <span className="text-[11px] leading-none">↓</span>
                  </button>
                </div>

                {/* 2. Store Credit Card */}
                <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-2xl p-2.5 sm:p-3 border border-rose-100/80 dark:border-zinc-700/60 shadow-xs flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-xs">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 leading-none">
                        {formatCurrency(card.redeemableAmount, business.currency)}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Store Credit
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCreditModal(true)}
                      aria-label="Convert points to store credit"
                      title="Convert points to store credit"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E11D48] hover:bg-rose-700 text-white flex items-center justify-center font-bold text-sm shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                    <span className="text-[8px] sm:text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 text-center leading-none">
                      Convert points
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Ready for you 🪄 */}
            {(() => {
              const readyReward = rewards.find(
                (r) => card.pointsBalance >= r.points_required
              );
              if (!readyReward) return null;

              return (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>Ready for you</span>
                      <span className="text-amber-500">🪄</span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      You have a reward ready to enjoy!
                    </p>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-3.5 border border-rose-100 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3.5 items-center">
                    <div className="w-full sm:w-36 h-36 rounded-2xl overflow-hidden shrink-0 relative bg-zinc-100">
                      <img
                        src={getRewardImage(readyReward.name, readyReward.image_url)}
                        alt={readyReward.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between h-full space-y-2 w-full">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-lg font-serif font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                            {readyReward.name}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                            {readyReward.description ||
                              "Any handcrafted hot or iced coffee, shake or cooler."}
                          </p>
                        </div>
                        <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-[#E11D48] dark:text-rose-400 border border-rose-200/80 dark:border-rose-900">
                          {readyReward.points_required} pts
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReward({
                              id: readyReward.id,
                              name: readyReward.name,
                              points: readyReward.points_required,
                              image_url: readyReward.image_url,
                            })
                          }
                          className="px-5 py-2 rounded-full bg-[#E11D48] hover:bg-[#be123c] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-rose-500/25 active:scale-95 transition-all"
                        >
                          <span>Redeem Now</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="text-xs font-serif italic font-extrabold text-[#E11D48] dark:text-rose-400 -rotate-6 select-none flex items-center gap-1">
                          <span>Unlocked!</span>
                          <span>🪄</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. More treats to unlock 🪄 */}
            {(() => {
              const readyReward = rewards.find(
                (r) => card.pointsBalance >= r.points_required
              );
              const lockedRewards = rewards.filter(
                (r) => !readyReward || r.id !== readyReward.id
              );
              if (lockedRewards.length === 0) return null;

              return (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>More treats to unlock</span>
                      <span className="text-amber-500">🪄</span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Keep collecting points for these delicious rewards!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {lockedRewards.map((r) => {
                      const pointsNeeded = Math.max(
                        0,
                        r.points_required - card.pointsBalance
                      );
                      const progressPct = Math.min(
                        100,
                        Math.round((card.pointsBalance / r.points_required) * 100)
                      );

                      return (
                        <div
                          key={r.id}
                          className="bg-white dark:bg-zinc-900 rounded-3xl p-3 border border-rose-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between gap-2.5"
                        >
                          <div className="space-y-2">
                            <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-zinc-100">
                              <img
                                src={getRewardImage(r.name, r.image_url)}
                                alt={r.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
                                }}
                              />
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 shadow-xs backdrop-blur-xs">
                                {r.points_required} pts
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {r.name}
                              </h4>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                                {r.description ||
                                  `Special reward at ${r.points_required} points.`}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-sm font-black text-[#E11D48] leading-none">
                                    {card.pointsBalance}
                                  </span>
                                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                                    {" "}/ {r.points_required} pts
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/70 border border-rose-200/60 dark:border-rose-900/50 text-[#E11D48] dark:text-rose-300 font-extrabold text-[9px] uppercase tracking-wider shrink-0">
                                  {pointsNeeded} TO GO
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-rose-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#E11D48] rounded-full transition-all duration-500"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById("earn-more-section")?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="w-full py-2 rounded-xl bg-rose-50/80 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-[#E11D48] dark:text-rose-300 text-[11px] font-bold border border-rose-200/60 dark:border-rose-900/50 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                            >
                              <Lock className="w-3 h-3 text-[#E11D48] dark:text-rose-300" />
                              <span>Keep Earning</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 4. More ways to earn 🪄 */}
            <div id="earn-more-section" className="space-y-2 scroll-mt-20">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>More ways to earn</span>
                  <span className="text-amber-500">🪄</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Complete quick tasks to boost your points wallet!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Card 1: Follow Us */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-2.5 border border-rose-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between text-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 mt-1.5">
                      Follow Us
                    </h4>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                      Follow our Instagram for updates & treats.
                    </p>
                    <span className="mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      +25 pts
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-default"
                  >
                    <Check className="w-3 h-3" />
                    <span>Claimed</span>
                  </button>
                </div>

                {/* Card 2: Share a Story */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-2.5 border border-rose-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between text-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 mt-1.5">
                      Share a Story
                    </h4>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                      Snap a photo & tag @Scoop_N_Brew in your Story.
                    </p>
                    <span className="mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      +20 pts
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const t =
                        bonusTasks.find((bt) => bt.id === "instagram_story") ||
                        bonusTasks[0];
                      setSelectedTaskToVerify(t);
                    }}
                    className="w-full py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-zinc-50 transition"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Card 3: Invite Friends */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-2.5 border border-rose-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between text-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 mt-1.5">
                      Invite Friends
                    </h4>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                      Share your link with friends and earn reward points.
                    </p>
                    <span className="mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      +50 pts
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const refTask =
                        bonusTasks.find((bt) => bt.id === "refer_friend") ||
                        bonusTasks[0];
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: `Join ${business.name} Loyalty`,
                            text: `Check out ${business.name} and get your loyalty card with instant points!`,
                            url: refTask.actionUrl,
                          });
                        } catch {}
                      } else {
                        await navigator.clipboard.writeText(refTask.actionUrl);
                        setFeedback({
                          type: "success",
                          text: "Referral link copied! Share it with friends.",
                        });
                      }
                    }}
                    className="w-full py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-zinc-50 transition"
                  >
                    <span>Share Link</span>
                    <Share2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 pt-0.5">
                <Info className="w-3 h-3 shrink-0" />
                <span>Referral points awarded after a verified first purchase.</span>
              </div>
            </div>

            {/* 5. Birthday Club */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-3.5 border border-rose-100 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-xl shrink-0">
                  🎂
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Birthday Club
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug max-w-xs">
                    A sweet surprise on your birthday! Tell us your birthday to
                    receive an exclusive complimentary treat on your special day.
                  </p>
                </div>
              </div>

              {editingBirthday ? (
                <form
                  onSubmit={handleSaveBirthday}
                  className="space-y-2 shrink-0"
                >
                  <div className="flex gap-1.5">
                    <select
                      value={birthdayMonth}
                      onChange={(e) => setBirthdayMonth(Number(e.target.value))}
                      className="px-2 py-1 text-xs rounded-lg border border-border bg-background text-foreground"
                    >
                      {[
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ].map((m, idx) => (
                        <option key={m} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={birthdayDay}
                      onChange={(e) => setBirthdayDay(Number(e.target.value))}
                      className="px-2 py-1 text-xs rounded-lg border border-border bg-background text-foreground"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="submit"
                      disabled={savingBirthday}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#E11D48] text-white"
                    >
                      {savingBirthday ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBirthday(false)}
                      className="px-2 py-1 text-[10px] rounded-md border text-zinc-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-2xl p-2.5 text-center shrink-0 min-w-[115px]">
                  <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Registered Birthday
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    📅{" "}
                    {customer.birthdayMonth && customer.birthdayDay
                      ? `${new Date(
                          2024,
                          customer.birthdayMonth - 1,
                          customer.birthdayDay
                        ).toLocaleString("default", { month: "long" })} ${
                          customer.birthdayDay
                        }`
                      : "November 14"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingBirthday(true)}
                    className="mt-1 text-[10px] font-bold text-[#E11D48] hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    <span>Edit</span>
                  </button>
                </div>
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

        {/* TAB 4: PROFILE, PRIVACY & CONSENT */}
        {activeTab === "privacy" && (
          <section className="space-y-4 no-print pb-4 animate-in fade-in duration-200">
            {/* Customer Profile & Card Summary Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-rose-100 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E11D48] to-rose-400 text-white font-serif font-black text-xl flex items-center justify-center shadow-sm">
                    {customer.fullName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-black text-lg text-zinc-900 dark:text-zinc-50 leading-tight">
                        {customer.fullName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900">
                        Verified Member
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-500 mt-0.5">
                      {customer.maskedPhone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                    Digital Pass Card #
                  </span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {card.cardNumber}
                  </span>
                </div>
                <CopyButton value={card.cardNumber} label="Copy #" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Loyalty Points
                  </div>
                  <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {card.pointsBalance}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Active Balance
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#E11D48] dark:text-rose-400">
                    Store Credit
                  </div>
                  <div className="text-xl font-black text-[#E11D48] dark:text-rose-400 mt-0.5">
                    {formatCurrency(card.redeemableAmount, business.currency)}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Redeemable Wallet
                  </div>
                </div>
              </div>

              {/* Log Out / Switch Account Button */}
              <div className="pt-2 border-t border-rose-100/70 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out / Switch Account</span>
                </button>
              </div>
            </div>

            {/* Consent & Data Rights (DPDP Act 2023) */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-rose-100 dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Consent & Data Rights (DPDP Act 2023)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Manage your communication consent or request personal data
                  deletion from {business.name}.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="mt-0.5 rounded"
                  />
                  <span>
                    <strong className="text-zinc-900 dark:text-zinc-100 block">
                      Loyalty Program Processing Consent (Active)
                    </strong>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Required to maintain your points ledger and card balance.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 rounded accent-[#E11D48]"
                  />
                  <span>
                    <strong className="text-zinc-900 dark:text-zinc-100 block">
                      Promotional & Bonus Multiplier Updates
                    </strong>
                    <span className="text-zinc-500 dark:text-zinc-400">
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
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#E11D48] text-white hover:bg-[#be123c] disabled:opacity-50 transition"
                >
                  {savingPrefs ? "Saving..." : "Save Marketing Preference"}
                </button>

                <button
                  type="button"
                  disabled={!phoneLast4}
                  onClick={() => setConfirmDeletionOpen(true)}
                  className="px-3 py-2 text-xs font-medium rounded-xl border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 transition"
                >
                  Request Data Deletion
                </button>
              </div>
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
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
              <span>Powered by</span>
              <img
                src="/loopa-logo.png"
                alt="Loopa"
                className="w-4 h-4 rounded-xs object-contain inline-block shadow-2xs"
              />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Loopa</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Reward Redemption Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-rose-100 dark:border-zinc-800 p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedReward(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-md mb-2 bg-zinc-100">
                <img
                  src={getRewardImage(selectedReward.name, selectedReward.image_url)}
                  alt={selectedReward.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
                  }}
                />
              </div>
              <h3 className="text-lg font-serif font-black text-zinc-900 dark:text-zinc-50">
                Redeem {selectedReward.name}
              </h3>
              <div className="text-xs font-bold text-[#E11D48] mt-1">
                {selectedReward.points} points required · You have {card.pointsBalance} pts
              </div>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                This will deduct {selectedReward.points} points from your balance and notify counter staff to prepare your treat.
              </p>
            </div>

            {/* Quick PIN input */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                Security PIN (Last 4 digits of {customer.maskedPhone})
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={phoneLast4}
                onChange={(e) =>
                  setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="4 digits"
                className="w-full px-3 py-2 text-sm font-mono text-center rounded-xl border border-border bg-background text-foreground tracking-widest"
              />
            </div>

            <button
              type="button"
              disabled={submittingRedeem || phoneLast4.length < 4}
              onClick={() => handleRequestRewardRedemption("reward")}
              className="w-full py-2.5 rounded-full bg-[#E11D48] hover:bg-[#be123c] text-white text-xs font-bold shadow-md shadow-rose-500/25 disabled:opacity-50 transition"
            >
              {submittingRedeem ? "Redeeming..." : "Confirm & Redeem Treat"}
            </button>
          </div>
        </div>
      )}

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

      {/* First Signup / Welcome Points Modal (Loopa Spec 2.1) */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-rose-200/80 dark:border-rose-900/60 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Ambient Sparkle Glows */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-200/50 dark:bg-amber-950/40 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-200/50 dark:bg-rose-950/40 rounded-full blur-xl pointer-events-none" />

            <button
              type="button"
              onClick={() => handleDismissWelcomeModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Mascot / Gift Box with sparkle */}
            <div className="flex flex-col items-center pt-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 rotate-3">
                  <Gift className="w-10 h-10 animate-pulse" />
                </div>
                <span className="absolute -top-2 -right-2 text-2xl">✨</span>
                <span className="absolute -bottom-1 -left-2 text-xl">🎉</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black tracking-widest text-[#E11D48] dark:text-rose-400 uppercase">
                Welcome to Scoop Rewards
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                You&apos;ve unlocked 40 Welcome Points! 🎁
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                We&apos;ve credited <strong className="text-zinc-900 dark:text-zinc-100">40 free reward points</strong> (₹20 store value) straight to your digital card to celebrate your join!
              </p>
            </div>

            {/* Psychological Goal Gradient Milestone Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-rose-100 dark:border-zinc-700 shadow-xs space-y-2 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <span className="flex items-center gap-1.5">
                  <span>☕</span>
                  <span>Free Regular Chai</span>
                </span>
                <span className="text-[#E11D48] font-black">Just 10 pts to go!</span>
              </div>

              {/* Progress Bar 40 / 50 */}
              <div className="w-full h-2.5 bg-rose-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                  style={{ width: "80%" }}
                />
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                Spend just ₹100 on your next order to collect 10 points and unlock your free treat!
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleDismissWelcomeModal(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-black shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Order Now & Unlock Free Chai ☕</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleDismissWelcomeModal(false)}
                className="w-full py-2.5 px-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                View My Loyalty Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-rose-100 dark:border-zinc-800 p-6 space-y-4 text-center shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                {business.name}
              </span>
              <h3 className="text-xl font-serif font-black text-zinc-900 dark:text-zinc-50">
                Scan at Counter
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Show this QR to the barista to earn points or redeem rewards
              </p>
            </div>

            <div className="bg-white p-3 rounded-2xl border-2 border-zinc-900 inline-block shadow-inner mx-auto">
              <img
                src={card.qrDataUrl}
                alt={`Loyalty QR code for ${customer.fullName}`}
                className="w-44 h-44 block"
              />
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl p-3 border border-rose-100/60 dark:border-rose-900/40 space-y-2">
              <div className="text-[11px] font-mono font-bold text-zinc-500">
                CARD NUMBER
              </div>
              <div className="text-base font-mono font-black text-zinc-900 dark:text-zinc-100 tracking-wider">
                {card.cardNumber}
              </div>
              <div className="flex justify-center gap-2 pt-1">
                <CopyButton value={card.cardNumber} label="Copy Card #" />
                <CopyButton value={card.publicUrl} label="Copy Pass Link" />
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Member: <strong className="text-zinc-800 dark:text-zinc-200">{customer.fullName}</strong> · PIN: Last 4 digits of <span className="font-mono">{customer.maskedPhone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Store Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-rose-100 dark:border-zinc-800 p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowCreditModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E11D48] text-white flex items-center justify-center mx-auto shadow-md mb-2">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-black text-zinc-900 dark:text-zinc-50">
                Store Credit Wallet
              </h3>
              <div className="text-3xl font-black text-[#E11D48] mt-1">
                {formatCurrency(card.redeemableAmount, business.currency)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Usable like cash on your beverage, dessert, and food bills at {business.name}
              </p>
            </div>

            {/* Quick PIN input */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
                Security PIN (Last 4 digits of {customer.maskedPhone})
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={phoneLast4}
                onChange={(e) =>
                  setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="4 digits"
                className="w-full px-3 py-1.5 text-xs font-mono text-center rounded-xl border border-border bg-background text-foreground tracking-widest"
              />
            </div>

            {/* Convert Points to Credit */}
            {rules && (
              <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100/80 dark:border-rose-900/40 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Convert Points to Credit</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    100 pts = {formatCurrency(rules.pointsValuePer100, business.currency)}
                  </span>
                </div>
                <form onSubmit={handleConvertPoints} className="flex gap-2">
                  <input
                    type="number"
                    min={rules.minimumRedemptionPoints}
                    max={Math.max(rules.minimumRedemptionPoints, card.pointsBalance)}
                    step={10}
                    value={pointsToConvert}
                    onChange={(e) => setPointsToConvert(e.target.value)}
                    className="w-24 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-border bg-background text-foreground"
                  />
                  <button
                    type="submit"
                    disabled={
                      convertingPoints ||
                      phoneLast4.length < 4 ||
                      card.pointsBalance < rules.minimumRedemptionPoints
                    }
                    className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#E11D48] text-white disabled:opacity-50"
                  >
                    {convertingPoints ? "Converting..." : "Convert Now"}
                  </button>
                </form>
              </div>
            )}

            {/* Redeem Credit on Bill */}
            {card.redeemableAmount > 0 && (
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Request Credit Discount
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={card.redeemableAmount}
                      value={redeemCreditAmount}
                      onChange={(e) => setRedeemCreditAmount(e.target.value)}
                      placeholder={`Max ₹${card.redeemableAmount}`}
                      className="w-28 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-border bg-background text-foreground"
                    />
                    <input
                      type="text"
                      value={redeemNotes}
                      onChange={(e) => setRedeemNotes(e.target.value)}
                      placeholder="Table # or note"
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={
                      submittingRedeem ||
                      phoneLast4.length < 4 ||
                      !redeemCreditAmount ||
                      Number(redeemCreditAmount) <= 0
                    }
                    onClick={() => handleRequestRewardRedemption("store_credit")}
                    className="w-full py-2 text-xs font-bold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-50"
                  >
                    {submittingRedeem ? "Submitting..." : "Apply Discount"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout / Switch Account Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs mb-2">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-black text-zinc-900 dark:text-zinc-50">
                Log Out / Switch Account?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Your loyalty points and digital pass remain safely linked to your phone number ({customer.maskedPhone}).
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 transition"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Menu Drawer */}
      {showMenuDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs bg-white dark:bg-zinc-900 h-full p-5 flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setShowMenuDrawer(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="w-12 h-12 rounded-xl object-cover border border-rose-100 shadow-xs"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xs"
                    style={{ backgroundColor: business.primaryColor || "#E11D48" }}
                  >
                    {business.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-serif font-black text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                    {business.name}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-medium">
                    GOOD COFFEE · BRIGHTER DAYS
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    handleTabChange("home");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <Home className="w-4 h-4 text-rose-500" />
                  <span>Pass Home</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    handleTabChange("menu");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <Coffee className="w-4 h-4 text-rose-500" />
                  <span>Order Menu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    handleTabChange("rewards");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <Gift className="w-4 h-4 text-rose-500" />
                  <span>Rewards & Bonus Tasks</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    handleTabChange("claim");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <Receipt className="w-4 h-4 text-rose-500" />
                  <span>Submit Bill Claim</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    handleTabChange("history");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <ShoppingBag className="w-4 h-4 text-rose-500" />
                  <span>Orders & Ledger</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    handleTabChange("privacy");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-rose-500" />
                  <span>Profile & Privacy</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    window.print();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <Printer className="w-4 h-4 text-rose-500" />
                  <span>Print Physical Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Log Out / Switch Account</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">Appearance</span>
              <ThemeToggle />
            </div>
          </div>
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setShowMenuDrawer(false)}
          />
        </div>
      )}

      {/* Floating Pop-up Toast above the bottom navigation strip with vibration & smooth fade */}
      {feedback && (
        <aside
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`fixed bottom-18 sm:bottom-20 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto transition-all duration-700 ease-out ${
            isFadingOut
              ? "opacity-0 translate-y-3 scale-95 pointer-events-none"
              : "animate-toast-pop-vibrate"
          }`}
        >
          <div
            className={`p-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3 backdrop-blur-md ${
              feedback.type === "error"
                ? "bg-[#FFF5F6]/95 dark:bg-rose-950/95 border-rose-200/90 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-rose-900/15"
                : "bg-[#F0FDF4]/95 dark:bg-emerald-950/95 border-emerald-200/90 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-emerald-900/15"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  feedback.type === "error"
                    ? "bg-rose-100 dark:bg-rose-900/60 text-[#E11D48] dark:text-rose-300"
                    : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300"
                }`}
              >
                {feedback.type === "error" ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <p className="text-xs sm:text-[13px] font-semibold leading-snug">
                {feedback.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFadingOut(true);
                setTimeout(() => setFeedback(null), 350);
              }}
              aria-label="Close notification"
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Bottom Navigation Bar (Recommended 56–64px) */}
      <nav
        aria-label="Bottom mobile navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-rose-100/60 dark:border-zinc-800 shadow-lg no-print h-14 sm:h-16 flex items-center pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 w-full h-full px-1 text-center items-center">
          <button
            type="button"
            onClick={() => handleTabChange("home")}
            className={`flex flex-col items-center justify-center gap-1 h-full min-h-[44px] py-1 transition-colors ${
              activeTab === "home"
                ? "text-[#E11D48] font-bold"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Home className={`w-5 h-5 stroke-[2.2] ${activeTab === "home" ? "fill-current" : ""}`} />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("menu")}
            className={`flex flex-col items-center justify-center gap-1 h-full min-h-[44px] py-1 transition-colors ${
              activeTab === "menu"
                ? "text-[#E11D48] font-bold"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Utensils className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Menu</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("rewards")}
            className={`flex flex-col items-center justify-center gap-1 h-full min-h-[44px] py-1 transition-colors ${
              activeTab === "rewards"
                ? "text-[#E11D48] font-bold"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Gift className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Rewards</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("history")}
            className={`flex flex-col items-center justify-center gap-1 h-full min-h-[44px] py-1 transition-colors ${
              activeTab === "history"
                ? "text-[#E11D48] font-bold"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Receipt className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Orders</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("privacy")}
            className={`flex flex-col items-center justify-center gap-1 h-full min-h-[44px] py-1 transition-colors ${
              activeTab === "privacy"
                ? "text-[#E11D48] font-bold"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <User className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </nav>

      {/* Customer Account & Loyalty Drawer (My Account & Loyalty) */}
      <CustomerAccountDrawer
        isOpen={showAccountDrawer}
        onClose={() => setShowAccountDrawer(false)}
        customer={{
          cardPublicId: card.publicId,
          cardNumber: card.cardNumber,
          fullName: customer.fullName,
          displayName: customer.fullName,
          maskedPhone: customer.maskedPhone,
          phone: customer.maskedPhone,
          pointsBalance: card.pointsBalance,
          redeemableAmount: card.redeemableAmount,
          email: (customer as any).email || null,
          birthdayDay: (customer as any).birthdayDay || null,
          birthdayMonth: (customer as any).birthdayMonth || null,
          marketingConsent: (customer as any).marketingConsent,
        }}
        store={{
          name: business.name,
          slug: business.slug,
          primaryColor: business.primaryColor || "#E11D48",
          currency: business.currency || "INR",
        }}
        onCustomerUpdate={(updated) => {
          setData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              customer: {
                ...prev.customer,
                ...(updated.fullName && { fullName: updated.fullName }),
                ...(updated.email !== undefined && { email: updated.email }),
                ...(updated.birthdayDay !== undefined && { birthdayDay: updated.birthdayDay }),
                ...(updated.birthdayMonth !== undefined && { birthdayMonth: updated.birthdayMonth }),
                ...(updated.marketingConsent !== undefined && { marketingConsent: updated.marketingConsent }),
              },
              card: {
                ...prev.card,
                ...(updated.pointsBalance !== undefined && { pointsBalance: updated.pointsBalance }),
                ...(updated.redeemableAmount !== undefined && { redeemableAmount: updated.redeemableAmount }),
              },
            };
          });
        }}
        onNavigateTab={(tab) => {
          if (tab === "home") handleTabChange("home");
          else if (tab === "menu") handleTabChange("menu");
          else if (tab === "rewards") handleTabChange("rewards");
          else if (tab === "orders" || tab === "history") handleTabChange("history");
          else if (tab === "profile" || tab === "privacy") handleTabChange("privacy");
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}

