"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  CreditCard,
  Home,
  Minus,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserCheck,
  Utensils,
  XCircle,
  User,
  LogOut,
  ChevronRight,
  Copy,
  ExternalLink,
  ArrowUpRight,
  Gift,
  Receipt,
  X,
  Edit3,
  Mail,
  Cake,
  Wallet,
  Lock,
  Info,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

interface VariantOption {
  id: string;
  name: string;
  price_delta: number;
}

interface AddonOption {
  id: string;
  name: string;
  price: number;
}

interface StoreMenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_available: boolean;
  is_visible: boolean;
  loyalty_multiplier: number;
  variants: VariantOption[];
  addons: AddonOption[];
}

interface StoreCategory {
  id: string;
  name: string;
  description: string | null;
}

interface CartEntry {
  cartKey: string;
  menuItem: StoreMenuItem;
  quantity: number;
  selectedVariant?: VariantOption | null;
  selectedAddons: AddonOption[];
  notes: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export interface CustomerSession {
  id?: string;
  displayName: string;
  fullName: string;
  email?: string | null;
  phone?: string;
  maskedPhone: string;
  phoneLast4?: string;
  birthdayDay?: number | null;
  birthdayMonth?: number | null;
  marketingConsent?: boolean;
  cardPublicId: string;
  cardNumber: string;
  pointsBalance: number;
  redeemableAmount: number;
}

export interface StoreOrderingViewProps {
  storeSlug?: string;
  initialCustomer?: CustomerSession | null;
  embedded?: boolean;
  initialCategory?: string;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: "home" | "rewards" | "orders" | "profile") => void;
}

interface ActiveOrderView {
  id: string;
  public_token: string;
  order_number: string;
  customer_display_name: string;
  order_type: "dine_in" | "takeaway" | "pickup";
  table_number: string | null;
  status: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  reward_points_used: number;
  reward_value_used: number;
  points_earned: number;
  total: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  items: {
    id: string;
    item_name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
    variant_details?: { name: string; price_delta: number }[];
    addon_details?: { name: string; price: number }[];
  }[];
  events?: {
    id: string;
    event: string;
    actor_type: string;
    note: string | null;
    created_at: string;
  }[];
}

interface ThemeStyle {
  name: string;
  pageBg: string;
  headerBorder: string;
  bannerBg: string;
  bannerText: string;
  bannerAccent: string;
  primaryButton: string;
  primaryLightBg: string;
  primaryText: string;
  primaryBorder: string;
  activeTabBorder: string;
  activeTabText: string;
  chipActive: string;
  loyaltyChip: string;
  counterBadge: string;
  cardHighlight: string;
  focusRing: string;
}

const THEME_STYLES: Record<string, ThemeStyle> = {
  rose: {
    name: "Rose Pink (Scoop n Brew)",
    pageBg: "bg-[#FAF6F0] dark:bg-[#121110]",
    headerBorder: "border-rose-100/60 dark:border-rose-950/40",
    bannerBg: "bg-gradient-to-r from-[#FDE8E1] via-[#FDF2F4] to-[#FCE7EB]",
    bannerText: "text-zinc-900",
    bannerAccent: "text-[#C2185B]",
    primaryButton: "bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-xs",
    primaryLightBg: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    primaryText: "text-[#E11D48] dark:text-rose-400",
    primaryBorder: "border-[#E11D48]",
    activeTabBorder: "border-[#E11D48]",
    activeTabText: "text-[#E11D48] dark:text-rose-400 font-bold",
    chipActive: "bg-[#E11D48] text-white border-[#E11D48] shadow-xs",
    loyaltyChip: "bg-[#FDF2F4] dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-300",
    counterBadge: "bg-[#E11D48] text-white shadow-xs",
    cardHighlight: "border-rose-200 dark:border-rose-900/60",
    focusRing: "focus:ring-[#E11D48]",
  },
  terracotta: {
    name: "Warm Terracotta / Coffee",
    pageBg: "bg-amber-50/30 dark:bg-zinc-950",
    headerBorder: "border-amber-100 dark:border-zinc-800",
    bannerBg: "bg-gradient-to-r from-amber-800 via-terracotta-700 to-terracotta-600",
    bannerText: "text-white",
    bannerAccent: "text-amber-200",
    primaryButton: "bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-xs",
    primaryLightBg: "bg-terracotta-50 dark:bg-terracotta-950/30 text-terracotta-700 dark:text-terracotta-300 border-terracotta-200 dark:border-terracotta-900",
    primaryText: "text-terracotta-600 dark:text-terracotta-400",
    primaryBorder: "border-terracotta-600",
    activeTabBorder: "border-terracotta-600",
    activeTabText: "text-terracotta-600 dark:text-terracotta-400 font-bold",
    chipActive: "bg-terracotta-600 text-white border-terracotta-600 shadow-xs",
    loyaltyChip: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
    counterBadge: "bg-terracotta-600 text-white shadow-xs",
    cardHighlight: "border-amber-200 dark:border-amber-900/60",
    focusRing: "focus:ring-terracotta-500",
  },
  mint: {
    name: "Fresh Mint & Matcha",
    pageBg: "bg-emerald-50/30 dark:bg-zinc-950",
    headerBorder: "border-emerald-100 dark:border-zinc-800",
    bannerBg: "bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-600",
    bannerText: "text-white",
    bannerAccent: "text-emerald-100",
    primaryButton: "bg-teal-600 hover:bg-teal-700 text-white shadow-xs",
    primaryLightBg: "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900",
    primaryText: "text-teal-600 dark:text-teal-400",
    primaryBorder: "border-teal-600",
    activeTabBorder: "border-teal-600",
    activeTabText: "text-teal-600 dark:text-teal-400 font-bold",
    chipActive: "bg-teal-600 text-white border-teal-600 shadow-xs",
    loyaltyChip: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
    counterBadge: "bg-teal-600 text-white shadow-xs",
    cardHighlight: "border-emerald-200 dark:border-emerald-900/60",
    focusRing: "focus:ring-teal-500",
  },
  mono: {
    name: "Modern Monochrome",
    pageBg: "bg-stone-50 dark:bg-zinc-950",
    headerBorder: "border-stone-200 dark:border-zinc-800",
    bannerBg: "bg-zinc-900 text-stone-100",
    bannerText: "text-stone-100",
    bannerAccent: "text-zinc-300",
    primaryButton: "bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 shadow-xs",
    primaryLightBg: "bg-stone-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-stone-200 dark:border-zinc-700",
    primaryText: "text-zinc-900 dark:text-zinc-100",
    primaryBorder: "border-zinc-900 dark:border-zinc-100",
    activeTabBorder: "border-zinc-900 dark:border-zinc-100",
    activeTabText: "text-zinc-900 dark:text-zinc-100 font-bold",
    chipActive: "bg-zinc-900 text-white border-zinc-900 dark:bg-stone-100 dark:text-zinc-900 shadow-xs",
    loyaltyChip: "bg-stone-100 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200",
    counterBadge: "bg-zinc-900 text-white shadow-xs",
    cardHighlight: "border-stone-300 dark:border-zinc-700",
    focusRing: "focus:ring-zinc-800",
  },
};

function getItemImage(name: string, fallbackUrl?: string | null): string {
  if (fallbackUrl && fallbackUrl.startsWith("http")) return fallbackUrl;
  const n = name.toLowerCase();
  if (n.includes("spiral") || (n.includes("potato") && !n.includes("fry"))) {
    return "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("watermelon") || n.includes("mojito")) {
    return "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("kesar") || n.includes("chai") || n.includes("tea")) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("waffle")) {
    return "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("oreo") || n.includes("shake") || n.includes("smoothie")) {
    return "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("peri") || n.includes("frie") || n.includes("fries")) {
    return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("coffee") || n.includes("latte") || n.includes("cappuccino") || n.includes("brew") || n.includes("espresso")) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("combo") || n.includes("deal") || n.includes("study break") || n.includes("gang") || n.includes("together") || n.includes("therapy")) {
    return "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("bun") || n.includes("bread") || n.includes("sandwich") || n.includes("toast")) {
    return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80";
  }
  if (n.includes("pastry") || n.includes("croissant") || n.includes("cake") || n.includes("dessert")) {
    return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
}

function getCategoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("combo") || n.includes("deal")) return "🔥";
  if (n.includes("chai") || n.includes("tea")) return "☕";
  if (n.includes("snack") || n.includes("fries") || n.includes("frie")) return "🍟";
  if (n.includes("waffle")) return "🧇";
  if (n.includes("shake")) return "🥤";
  if (n.includes("mojito") || n.includes("cooler")) return "🌿";
  if (n.includes("coffee")) return "☕";
  if (n.includes("bread") || n.includes("bun") || n.includes("sandwich") || n.includes("burger")) return "🥪";
  if (n.includes("special")) return "✨";
  return "🍽️";
}

function CuteCoffeeMascot() {
  return (
    <div className="relative flex flex-col items-center select-none shrink-0">
      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
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
      <div className="text-[10px] font-black leading-tight text-center text-[#B23B44] -mt-1.5 tracking-tight whitespace-nowrap rotate-[-3deg]">
        Good Coffee
        <br />
        Happier You!
      </div>
    </div>
  );
}

export default function StoreOrderingView({
  storeSlug: propStoreSlug,
  initialCustomer,
  embedded = false,
  initialCategory,
  onBackToHome,
  onNavigateTab,
}: StoreOrderingViewProps = {}) {
  const params = useParams<{ storeSlug?: string }>();
  const searchParams = useSearchParams();
  const storeSlug = propStoreSlug || params?.storeSlug || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<{
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string;
    currency: string;
    address: string | null;
    phone: string | null;
    tax_percentage: number;
    order_prefix: string;
    order_expiry_minutes: number;
    require_table_number?: boolean;
    theme_preset?: string;
  } | null>(null);

  const [loyaltyOffer, setLoyaltyOffer] = useState<{
    points_per_currency_unit: number;
    currency_unit: number;
    minimum_purchase_amount: number;
    maximum_points_per_transaction: number;
    points_value_per_100: number;
    minimum_redemption_points: number;
    signup_bonus_points: number;
    campaign_name: string | null;
    campaign_multiplier: number;
  } | null>(null);

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [items, setItems] = useState<StoreMenuItem[]>([]);
  const [storeRewards, setStoreRewards] = useState<{
    id: string;
    name: string;
    description: string | null;
    points_required: number;
    monetary_value: number;
  }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-select category if initialCategory prop is supplied
  useEffect(() => {
    if (initialCategory && categories.length > 0) {
      if (initialCategory === "all") {
        setSelectedCategory("all");
      } else {
        const match = categories.find((c) =>
          c.name.toLowerCase().includes(initialCategory.toLowerCase())
        );
        if (match) {
          setSelectedCategory(match.id);
        }
      }
    }
  }, [initialCategory, categories]);

  // Customer session state
  const [customer, setCustomer] = useState<CustomerSession | null>(
    initialCustomer || null
  );

  useEffect(() => {
    if (initialCustomer) {
      setCustomer((prev) => {
        if (!prev) return initialCustomer;
        return {
          ...prev,
          ...initialCustomer,
        };
      });
    }
  }, [initialCustomer]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [regPhone, setRegPhone] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regLoyaltyConsent, setRegLoyaltyConsent] = useState(true);
  const [regMarketingConsent, setRegMarketingConsent] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Customer Account Drawer & Profile state
  const [showAccountDrawer, setShowAccountDrawer] = useState(false);
  const [refreshingPoints, setRefreshingPoints] = useState(false);
  const [copiedCardNum, setCopiedCardNum] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Customer Edit Profile Modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBdayDay, setEditBdayDay] = useState("");
  const [editBdayMonth, setEditBdayMonth] = useState("");
  const [editMarketing, setEditMarketing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState<string | null>(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Item customization modal state
  const [customizingItem, setCustomizingItem] = useState<StoreMenuItem | null>(
    null
  );
  const [chosenVariantId, setChosenVariantId] = useState<string>("");
  const [chosenAddonIds, setChosenAddonIds] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState("");

  // Cart & Checkout state
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"menu" | "cart" | "order">("menu");
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "pickup">(
    "dine_in"
  );
  const [tableNumber, setTableNumber] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [redeemPointsToggle, setRedeemPointsToggle] = useState(false);
  const [applyStoreCreditToggle, setApplyStoreCreditToggle] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Multi-order Queue & Active Selection
  const [orders, setOrders] = useState<ActiveOrderView[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<
    {
      id: string;
      public_token: string;
      order_number: string;
      status: string;
      total: number;
      points_earned: number;
      created_at: string;
    }[]
  >([]);
  const [refreshingOrder, setRefreshingOrder] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  // Resolve current active order view from queue
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const match = orders.find((o) => o.id === selectedOrderId);
      if (match) return match;
    }
    return orders[0] || null;
  }, [orders, selectedOrderId]);

  // Resolve active theme style
  const theme = useMemo(() => {
    return THEME_STYLES[store?.theme_preset || "rose"] || THEME_STYLES.rose;
  }, [store?.theme_preset]);

  // Capture viral referral link if present in query parameter
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      try {
        window.localStorage.setItem("loopa_referral_ref", ref);
      } catch {}
    }
  }, [searchParams]);

  // 1-Tap Reorder items from customer's latest order
  const favoriteItems = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const pastOrder = orders.find((o) => o.items && o.items.length > 0);
    return pastOrder ? pastOrder.items : [];
  }, [orders]);

  const handleReorderFavorites = () => {
    if (favoriteItems.length === 0) return;
    const newCartEntries: CartEntry[] = [];
    for (const fav of favoriteItems) {
      const match = items.find(
        (it) => it.name.toLowerCase() === fav.item_name.toLowerCase()
      );
      if (match) {
        newCartEntries.push({
          cartKey: `${match.id}_reorder_${Date.now()}_${Math.random()}`,
          menuItem: match,
          quantity: fav.quantity,
          selectedVariant: null,
          selectedAddons: [],
          notes: "",
        });
      }
    }
    if (newCartEntries.length > 0) {
      setCart((prev) => [...prev, ...newCartEntries]);
      setActiveTab("cart");
    }
  };

  // Smart Upsell Recommendations (frequently paired snacks, drinks, desserts)
  const upsellItems = useMemo(() => {
    if (cart.length === 0 || items.length === 0) return [];
    const inCartIds = new Set(cart.map((c) => c.menuItem.id));
    const candidates = items.filter(
      (it) => it.is_available && it.is_visible && !inCartIds.has(it.id)
    );
    return candidates
      .sort((a, b) => {
        const aBoost = /fries|mojito|shake|waffle|coffee|spiral|tea/i.test(
          a.name
        )
          ? 1
          : 0;
        const bBoost = /fries|mojito|shake|waffle|coffee|spiral|tea/i.test(
          b.name
        )
          ? 1
          : 0;
        return bBoost - aBoost || a.price - b.price;
      })
      .slice(0, 6);
  }, [cart, items]);

  const handleQuickAddUpsell = (item: StoreMenuItem) => {
    const cartKey = `${item.id}_default`;
    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey);
      if (existing) {
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          cartKey,
          menuItem: item,
          quantity: 1,
          selectedVariant: null,
          selectedAddons: [],
          notes: "",
        },
      ];
    });
  };

  const customerRef = useRef(customer);
  customerRef.current = customer;
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const sessionRestoredRef = useRef(false);
  const lastFetchedCardRef = useRef<string | null>(null);

  const storageKey = `loopa_store_session_${storeSlug}`;

  const loadStoreData = useCallback(
    async (isInitial = true, retryCount = 0) => {
      if (isInitial && retryCount === 0) {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await fetch(`/api/s/${storeSlug}`, { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (retryCount < 2 && res.status >= 500) {
            await new Promise((r) => setTimeout(r, 1000));
            return loadStoreData(isInitial, retryCount + 1);
          }
          setError(data.error || "Unable to load store.");
          return;
        }
        const data = await res.json();
        setStore(data.store);
        setLoyaltyOffer(data.loyaltyOffer);
        setCategories(data.categories || []);
        setItems(data.items || []);
        setStoreRewards(data.rewards || []);
      } catch {
        if (retryCount < 2) {
          await new Promise((r) => setTimeout(r, 1000));
          return loadStoreData(isInitial, retryCount + 1);
        }
        setError("Network error while loading store menu.");
      } finally {
        if (isInitial && retryCount === 0) {
          setLoading(false);
        }
      }
    },
    [storeSlug]
  );

  const fetchCustomerOrders = useCallback(
    async (targetCardPublicId?: string, targetOrderIds?: string[]) => {
      const cardId = targetCardPublicId || customerRef.current?.cardPublicId;
      const currentOrders = ordersRef.current;
      const orderIds =
        targetOrderIds || (currentOrders.length > 0 ? currentOrders.map((o) => o.id) : []);
      if (!cardId && orderIds.length === 0) return;

      setRefreshingOrder(true);
      try {
        const qs = new URLSearchParams();
        if (cardId) {
          qs.set("cardPublicId", cardId);
        } else if (orderIds.length > 0) {
          qs.set("orderIds", orderIds.join(","));
        }
        const res = await fetch(`/api/s/${storeSlug}/orders?${qs.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok) {
          if (Array.isArray(data.orders) && data.orders.length > 0) {
            setOrders((prev) => {
              // Merge newly fetched orders with any existing while preserving order
              const incomingIds = new Set(data.orders.map((o: ActiveOrderView) => o.id));
              const retained = prev.filter((o) => !incomingIds.has(o.id));
              return [...data.orders, ...retained];
            });
          }
          if (data.card) {
            setCustomer((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                pointsBalance: Number(data.card.points_balance ?? prev.pointsBalance),
                redeemableAmount: Number(data.card.redeemable_amount ?? prev.redeemableAmount),
                cardNumber: data.card.card_number || prev.cardNumber,
              };
            });
          }
        }
      } catch {
        // Silent background refresh
      } finally {
        setRefreshingOrder(false);
      }
    },
    [storeSlug]
  );

  const refreshCustomerProfile = useCallback(
    async (targetCardPublicId?: string) => {
      const cardId = targetCardPublicId || customerRef.current?.cardPublicId;
      if (!cardId) return;
      setRefreshingPoints(true);
      try {
        const res = await fetch(`/api/card/${encodeURIComponent(cardId)}`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.card) {
          setCustomer((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              pointsBalance: Number(
                data.card.pointsBalance ?? data.card.points_balance ?? prev.pointsBalance
              ),
              redeemableAmount: Number(
                data.card.redeemableAmount ?? data.card.redeemable_amount ?? prev.redeemableAmount
              ),
              fullName: data.customer?.fullName || prev.fullName,
              displayName: data.customer?.fullName || prev.displayName,
              email: data.customer?.email !== undefined ? data.customer.email : prev.email,
              maskedPhone: data.customer?.maskedPhone || prev.maskedPhone,
              birthdayDay: data.customer?.birthdayDay !== undefined ? data.customer.birthdayDay : prev.birthdayDay,
              birthdayMonth: data.customer?.birthdayMonth !== undefined ? data.customer.birthdayMonth : prev.birthdayMonth,
              marketingConsent: data.customer?.marketingConsent !== undefined ? data.customer.marketingConsent : prev.marketingConsent,
              cardNumber: data.card.cardNumber || prev.cardNumber,
            };
          });
        }
      } catch {
        // Silent background refresh
      } finally {
        setRefreshingPoints(false);
      }
    },
    []
  );

  const handleLogout = () => {
    setCustomer(null);
    setOrders([]);
    setSelectedOrderId(null);
    setRecentOrders([]);
    setCart([]);
    setShowAccountDrawer(false);
    setShowLogoutConfirm(false);
    setShowEditProfileModal(false);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
  };

  const handleOpenEditProfile = () => {
    if (!customer) return;
    setEditName(customer.fullName || "");
    setEditEmail(customer.email || "");
    setEditBdayDay(customer.birthdayDay ? String(customer.birthdayDay) : "");
    setEditBdayMonth(customer.birthdayMonth ? String(customer.birthdayMonth) : "");
    setEditMarketing(Boolean(customer.marketingConsent));
    setEditProfileError(null);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.cardPublicId) return;
    setSavingProfile(true);
    setEditProfileError(null);
    try {
      const res = await fetch(`/api/s/${storeSlug}/customer-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardPublicId: customer.cardPublicId,
          fullName: editName,
          email: editEmail || null,
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
      setCustomer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          fullName: data.customer.fullName,
          displayName: data.customer.displayName,
          email: data.customer.email,
          birthdayDay: data.customer.birthdayDay,
          birthdayMonth: data.customer.birthdayMonth,
          marketingConsent: data.customer.marketingConsent,
        };
      });
      setShowEditProfileModal(false);
      setProfileSuccessMsg("Profile updated successfully!");
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch {
      setEditProfileError("Network error. Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReorderOrder = (targetOrder: ActiveOrderView) => {
    if (!targetOrder.items || targetOrder.items.length === 0) return;
    const newCartEntries: CartEntry[] = [];
    for (const ordItem of targetOrder.items) {
      const match = items.find(
        (it) => it.name.toLowerCase() === ordItem.item_name.toLowerCase()
      );
      if (match) {
        newCartEntries.push({
          cartKey: `${match.id}_reorder_${Date.now()}_${Math.random()}`,
          menuItem: match,
          quantity: ordItem.quantity,
          selectedVariant: null,
          selectedAddons: [],
          notes: "",
        });
      }
    }
    if (newCartEntries.length > 0) {
      setCart((prev) => [...prev, ...newCartEntries]);
      setShowAccountDrawer(false);
      setActiveTab("cart");
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

  const fetchOrderLive = useCallback(
    async (orderId: string, token?: string, cardPublicId?: string) => {
      setRefreshingOrder(true);
      try {
        const qs = new URLSearchParams();
        if (token) qs.set("token", token);
        if (cardPublicId) qs.set("cardPublicId", cardPublicId);
        const res = await fetch(
          `/api/orders/${orderId}/customer-view?${qs.toString()}`
        );
        const data = await res.json();
        if (res.ok && data.order) {
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === data.order.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = data.order;
              return next;
            }
            return [data.order, ...prev];
          });
          setSelectedOrderId(data.order.id);
          if (data.card) {
            setCustomer((prev) =>
              prev
                ? {
                    ...prev,
                    pointsBalance: data.card.points_balance,
                    redeemableAmount: data.card.redeemable_amount,
                  }
                : prev
            );
          }
        }
      } catch {
        // Silent background refresh
      } finally {
        setRefreshingOrder(false);
      }
    },
    []
  );

  useEffect(() => {
    loadStoreData(true);
    if (!sessionRestoredRef.current) {
      sessionRestoredRef.current = true;
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.customer) {
            setCustomer(parsed.customer);
            if (parsed.customer.cardPublicId) {
              lastFetchedCardRef.current = parsed.customer.cardPublicId;
              fetchCustomerOrders(parsed.customer.cardPublicId);
              refreshCustomerProfile(parsed.customer.cardPublicId);
            }
          }
          if (parsed?.recentOrders) {
            setRecentOrders(parsed.recentOrders);
          }
          if (Array.isArray(parsed?.orders) && parsed.orders.length > 0) {
            setOrders(parsed.orders);
            if (parsed.selectedOrderId) {
              setSelectedOrderId(parsed.selectedOrderId);
            }
          } else if (parsed?.activeOrder) {
            setOrders([parsed.activeOrder]);
            setSelectedOrderId(parsed.activeOrder.id);
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [loadStoreData, storageKey, fetchCustomerOrders, refreshCustomerProfile]);

  // Periodic poll to keep customer points fresh (every 30 seconds when customer is active)
  useEffect(() => {
    const cardId = customer?.cardPublicId;
    if (!cardId) return;
    const interval = setInterval(() => {
      refreshCustomerProfile(cardId);
    }, 30000);
    return () => clearInterval(interval);
  }, [customer?.cardPublicId, refreshCustomerProfile]);

  // Sync state to local storage so active orders never vanish across page reloads
  useEffect(() => {
    if (!customer && orders.length === 0) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          customer,
          orders,
          selectedOrderId,
          recentOrders,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [customer, orders, selectedOrderId, recentOrders, storageKey]);

  // Refresh customer orders once customer session is established or changed
  useEffect(() => {
    const cardId = customer?.cardPublicId;
    if (cardId && lastFetchedCardRef.current !== cardId) {
      lastFetchedCardRef.current = cardId;
      fetchCustomerOrders(cardId);
      refreshCustomerProfile(cardId);
    }
  }, [customer?.cardPublicId, fetchCustomerOrders, refreshCustomerProfile]);

  // Support direct link to order status via ?orderId=...&token=...
  useEffect(() => {
    const urlOrderId = searchParams.get("orderId");
    const urlToken = searchParams.get("token");
    if (urlOrderId && urlToken) {
      setActiveTab("order");
      fetchOrderLive(urlOrderId, urlToken);
    }
  }, [searchParams, fetchOrderLive]);

  // Poll all queued orders every 8 seconds while any order is in a non-terminal state
  useEffect(() => {
    if (orders.length === 0) return;
    const terminalStates = [
      "served",
      "cancelled",
      "rejected",
      "expired",
      "refunded",
    ];
    const hasActiveOrders = orders.some(
      (o) => !terminalStates.includes(o.status)
    );
    if (!hasActiveOrders) return;

    const timer = setInterval(() => {
      fetchCustomerOrders(
        customerRef.current?.cardPublicId,
        ordersRef.current.map((o) => o.id)
      );
    }, 8000);

    return () => clearInterval(timer);
  }, [orders, fetchCustomerOrders]);

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    try {
      const res = await fetch(`/api/s/${storeSlug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: regPhone,
          fullName: regName,
          email: regEmail,
          loyaltyConsent: regLoyaltyConsent,
          marketingConsent: regMarketingConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Registration failed.");
        return;
      }

      const sess: CustomerSession = {
        id: data.customer.id,
        displayName: data.customer.displayName,
        fullName: data.customer.fullName,
        maskedPhone: data.customer.maskedPhone,
        phoneLast4: data.customer.phoneLast4,
        cardPublicId: data.card.public_id,
        cardNumber: data.card.card_number,
        pointsBalance: data.card.points_balance,
        redeemableAmount: data.card.redeemable_amount,
      };
      setCustomer(sess);
      setRecentOrders(data.recentOrders || []);
      setShowAuthModal(false);

      // Immediately fetch all previous & active orders for this card
      fetchCustomerOrders(data.card.public_id);
    } catch {
      setRegError("Network error. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleAddItemClick = (item: StoreMenuItem) => {
    if (!item.is_available) return;
    if ((item.variants?.length || 0) > 0 || (item.addons?.length || 0) > 0) {
      setCustomizingItem(item);
      setChosenVariantId(item.variants?.[0]?.id || "");
      setChosenAddonIds([]);
      setItemNote("");
      return;
    }
    addEntryToCart(item, null, [], "");
  };

  const addEntryToCart = (
    item: StoreMenuItem,
    variant: VariantOption | null,
    addons: AddonOption[],
    notes: string
  ) => {
    const addonKey = addons
      .map((a) => a.id)
      .sort()
      .join(",");
    const cartKey = `${item.id}:${variant?.id || "base"}:${addonKey}:${notes.trim()}`;

    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartKey);
      if (existing) {
        return prev.map((c) =>
          c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          cartKey,
          menuItem: item,
          quantity: 1,
          selectedVariant: variant,
          selectedAddons: addons,
          notes: notes.trim(),
        },
      ];
    });
    setCustomizingItem(null);
  };

  const updateCartQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.cartKey === cartKey
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let totalItems = 0;
    let itemBonusPointsEstimate = 0;
    let comboSpend = 0;
    let regularSpend = 0;
    let hasComboItems = false;
    let comboSavingsTotal = 0;

    for (const entry of cart) {
      const varDelta = entry.selectedVariant?.price_delta || 0;
      const addonsSum = entry.selectedAddons.reduce(
        (sum, a) => sum + a.price,
        0
      );
      const unit = entry.menuItem.price + varDelta + addonsSum;
      const lineTotal = unit * entry.quantity;
      subtotal += lineTotal;
      totalItems += entry.quantity;

      const isCombo =
        /combo/i.test(entry.menuItem.name) ||
        /save ₹/i.test(entry.menuItem.description || "") ||
        categories.some(
          (c) => c.id === entry.menuItem.category_id && /combo/i.test(c.name)
        );

      if (isCombo) {
        comboSpend += lineTotal;
        hasComboItems = true;
        const savMatch = entry.menuItem.description?.match(/Save ₹(\d+)/i);
        if (savMatch) {
          comboSavingsTotal += Number(savMatch[1]) * entry.quantity;
        }
      } else {
        regularSpend += lineTotal;
        if (
          loyaltyOffer &&
          entry.menuItem.loyalty_multiplier > 1 &&
          loyaltyOffer.currency_unit > 0
        ) {
          itemBonusPointsEstimate +=
            (lineTotal / loyaltyOffer.currency_unit) *
            loyaltyOffer.points_per_currency_unit *
            (entry.menuItem.loyalty_multiplier - 1);
        }
      }
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const taxRate = store?.tax_percentage ?? 5;
    const taxTotal = Math.round(((subtotal * taxRate) / 100) * 100) / 100;

    let pointsToRedeem = 0;
    let discountTotal = 0;
    if (
      redeemPointsToggle &&
      customer &&
      loyaltyOffer &&
      customer.pointsBalance >= loyaltyOffer.minimum_redemption_points
    ) {
      pointsToRedeem = loyaltyOffer.minimum_redemption_points;
      discountTotal = Math.min(
        subtotal + taxTotal,
        Math.round(
          ((pointsToRedeem / 100) * loyaltyOffer.points_value_per_100) * 100
        ) / 100
      );
    }

    const availableCredit = Number(customer?.redeemableAmount || 0);
    let storeCreditApplied = 0;
    if (applyStoreCreditToggle && availableCredit > 0) {
      const maxApplicable = Math.max(0, subtotal + taxTotal - discountTotal);
      storeCreditApplied = Math.min(availableCredit, maxApplicable);
    }

    const total = Math.max(
      0,
      Math.round((subtotal + taxTotal - discountTotal - storeCreditApplied) * 100) / 100
    );

    let estimatedPoints = 0;
    if (loyaltyOffer && total >= loyaltyOffer.minimum_purchase_amount) {
      // Loopa Specification Section 13:
      // Combos earn 1 pt per ₹20 spent (floor(combo_spend / 20))
      // Regular items earn 1 pt per ₹10 spent (floor(regular_spend / 10))
      const comboPts = Math.floor(comboSpend / 20);
      const regPts =
        Math.floor(regularSpend / (loyaltyOffer.currency_unit || 10)) *
        (loyaltyOffer.points_per_currency_unit || 1);
      const multPts =
        regPts * (loyaltyOffer.campaign_multiplier || 1) - regPts;
      estimatedPoints = Math.min(
        loyaltyOffer.maximum_points_per_transaction,
        Math.floor(comboPts + regPts + multPts + itemBonusPointsEstimate)
      );
    }

    return {
      subtotal,
      taxTotal,
      discountTotal,
      storeCreditApplied,
      pointsToRedeem,
      total,
      totalItems,
      estimatedPoints,
      hasComboItems,
      comboSavingsTotal,
      regularSpend,
      comboSpend,
    };
  }, [
    cart,
    customer,
    loyaltyOffer,
    redeemPointsToggle,
    applyStoreCreditToggle,
    store?.tax_percentage,
    categories,
  ]);

  // Next unlockable reward
  const nextReward = useMemo(() => {
    if (!storeRewards || storeRewards.length === 0) {
      return {
        id: "default_bev",
        name: "Free Beverage",
        points_required: 50,
      };
    }
    const sorted = [...storeRewards].sort(
      (a, b) => a.points_required - b.points_required
    );
    const candidate = sorted.find(
      (r) => r.points_required > (customer?.pointsBalance || 0)
    );
    return (
      candidate ||
      sorted[0] || {
        id: "default_bev",
        name: "Free Beverage",
        points_required: 50,
      }
    );
  }, [storeRewards, customer?.pointsBalance]);

  // Gamified treat progress calculation
  const treatProgress = useMemo(() => {
    const currentPts = customer?.pointsBalance || 0;
    const cartPts = cartTotals.estimatedPoints;
    const projectedPts = currentPts + cartPts;
    const targetPts = nextReward?.points_required || 50;
    const pointsRemaining = Math.max(0, targetPts - projectedPts);
    const currencyUnit = loyaltyOffer?.currency_unit || 10;
    const pointsPerUnit = loyaltyOffer?.points_per_currency_unit || 1;
    const amountNeeded = Math.ceil(
      pointsRemaining * (currencyUnit / pointsPerUnit)
    );
    const progressPercent = Math.min(
      100,
      Math.max(8, Math.round((projectedPts / targetPts) * 100))
    );

    return {
      currentPts,
      cartPts,
      projectedPts,
      targetPts,
      pointsRemaining,
      amountNeeded,
      progressPercent,
    };
  }, [customer?.pointsBalance, cartTotals.estimatedPoints, nextReward, loyaltyOffer]);

  // Booster / Cross-sell item for treat card
  const boosterItem = useMemo(() => {
    const inCartIds = new Set(cart.map((c) => c.menuItem.id));
    const coffee = items.find(
      (i) =>
        i.is_available &&
        i.name.toLowerCase().includes("hot coffee") &&
        !inCartIds.has(i.id)
    );
    if (coffee) return coffee;

    const notInCart = items.filter(
      (i) => i.is_available && !inCartIds.has(i.id)
    );
    if (notInCart.length > 0) {
      return (
        notInCart.find((i) => i.price <= 50) ||
        notInCart[0]
      );
    }
    return null;
  }, [items, cart]);

  const boosterPoints = useMemo(() => {
    if (!boosterItem) return 0;
    const unit = loyaltyOffer?.currency_unit || 10;
    const ptsPer = loyaltyOffer?.points_per_currency_unit || 1;
    return Math.max(1, Math.round((boosterItem.price / unit) * ptsPer));
  }, [boosterItem, loyaltyOffer]);

  const handlePlaceOrder = async () => {
    if (!customer) {
      setShowAuthModal(true);
      return;
    }
    if (cart.length === 0) return;
    if (
      Boolean(store?.require_table_number) &&
      orderType === "dine_in" &&
      !tableNumber.trim()
    ) {
      setOrderError("Please enter your Table Number for Dine-In orders.");
      return;
    }

    setOrderError(null);
    setSubmittingOrder(true);
    try {
      const idempotencyKey = `ord_${customer.cardPublicId}_${Date.now()}`;
      const referredByCardPublicId =
        searchParams.get("ref") ||
        (() => {
          try {
            return window.localStorage.getItem("loopa_referral_ref");
          } catch {
            return null;
          }
        })();

      const res = await fetch(`/api/s/${storeSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardPublicId: customer.cardPublicId,
          customerDisplayName: customer.displayName,
          orderType,
          tableNumber: orderType === "dine_in" ? tableNumber.trim() : null,
          notes: orderNotes.trim() || null,
          rewardPointsToRedeem: cartTotals.pointsToRedeem,
          storeCreditToApply: cartTotals.storeCreditApplied,
          idempotencyKey,
          referredByCardPublicId: referredByCardPublicId || null,
          items: cart.map((c) => ({
            menuItemId: c.menuItem.id,
            quantity: c.quantity,
            variantId: c.selectedVariant?.id || null,
            addonIds: c.selectedAddons.map((a) => a.id),
            notes: c.notes || null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOrderError(data.error || "Could not place order.");
        return;
      }

      setCart([]);
      setOrderNotes("");
      setRedeemPointsToggle(false);
      setApplyStoreCreditToggle(false);
      setOrders((prev) => {
        const withoutCurrent = prev.filter((o) => o.id !== data.order.id);
        return [data.order, ...withoutCurrent];
      });
      setSelectedOrderId(data.order.id);
      setActiveTab("order");

      await fetchOrderLive(
        data.order.id,
        data.order.public_token,
        customer.cardPublicId
      );
      fetchCustomerOrders(customer.cardPublicId);
    } catch {
      setOrderError("Network error while placing order. Please try again.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    setCancellingOrder(true);
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: activeOrder.public_token,
          cardPublicId: customer?.cardPublicId,
          reason: "Cancelled by customer from order screen",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Unable to cancel order.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id
            ? {
                ...o,
                status: "cancelled",
                cancellation_reason: "Cancelled by customer from order screen",
              }
            : o
        )
      );
      await fetchCustomerOrders(customer?.cardPublicId);
    } finally {
      setCancellingOrder(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat =
        selectedCategory === "all" || item.category_id === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [items, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 p-4 max-w-xl mx-auto space-y-4">
        <div className="h-28 bg-stone-200 dark:bg-zinc-900 animate-pulse rounded-sm" />
        <div className="h-12 bg-stone-200 dark:bg-zinc-900 animate-pulse rounded-sm" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 bg-stone-200 dark:bg-zinc-900 animate-pulse rounded-sm"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <QrCode className="w-10 h-10 text-terracotta-600 mx-auto" />
          <h1 className="text-xl font-bold">Store Unavailable</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {error || "This QR code could not be linked to an active store."}
          </p>
          <Button onClick={() => loadStoreData(true)} className="w-full">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg} text-zinc-900 dark:text-zinc-100 pb-28 relative overflow-x-hidden font-sans selection:bg-rose-500 selection:text-white`}>
      {/* Soft Ambient Cafe Glows */}
      <div className="absolute top-10 -left-20 w-60 h-60 bg-amber-200/30 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 -right-16 w-60 h-60 bg-rose-200/35 dark:bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Store Header */}
      {!embedded && (
        <header className={`border-b border-rose-100/60 dark:border-zinc-800/60 bg-[#FAF6F0]/90 dark:bg-[#121110]/90 backdrop-blur-md sticky top-0 z-30`}>
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-12 h-12 rounded-full object-cover border border-rose-100 shadow-2xs bg-white p-0.5 shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs uppercase bg-[#E11D48]"
              >
                {store.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-serif font-black text-xl text-zinc-900 dark:text-zinc-50 leading-none truncate">
                {store.name}
              </h1>
              <p className="text-[9px] font-bold tracking-[0.2em] text-[#C2185B] dark:text-rose-400 uppercase mt-1 truncate">
                GOOD COFFEE · BRIGHTER DAYS
              </p>
            </div>
          </div>

          {customer ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAccountDrawer(true);
                  if (customer.cardPublicId) {
                    refreshCustomerProfile(customer.cardPublicId);
                    fetchCustomerOrders(customer.cardPublicId);
                  }
                }}
                className="bg-[#FDF2F4] dark:bg-rose-950/40 rounded-2xl px-3 py-1.5 border border-rose-200/70 dark:border-rose-900/40 flex items-center gap-2 transition-all hover:shadow-xs active:scale-95 cursor-pointer shadow-2xs"
                title="View Account, Live Points & Order History"
              >
                <div className="w-6 h-6 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shadow-xs uppercase">
                  {(customer.displayName || customer.fullName || "S").slice(0, 1)}
                </div>
                <div className="flex flex-col text-left leading-none">
                  <span className="font-black text-xs text-zinc-900 dark:text-zinc-100 tabular-nums flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>{customer.pointsBalance} pts</span>
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 truncate max-w-[65px] sm:max-w-[100px] mt-0.5">
                    {customer.displayName || customer.fullName?.split(" ")[0] || "Shivam"}
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAuthModal(true)}
              className="rounded-full px-4 text-xs font-bold"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Sign In
            </Button>
          )}
        </div>

        {/* Live Active Order Alert Bar for Handiness */}
        {activeOrder &&
          (activeOrder.status === "preparing" || activeOrder.status === "ready") &&
          activeTab !== "order" && (
            <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <span className="truncate">
                  {activeOrder.status === "ready"
                    ? "🎉 Order is READY at counter!"
                    : "🍳 Kitchen is preparing your order"}{" "}
                  ({activeOrder.order_number})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("order")}
                className="px-2.5 py-1 rounded bg-white text-emerald-900 font-bold text-[11px] hover:bg-emerald-50 shrink-0 shadow-2xs"
              >
                Track Live →
              </button>
            </div>
          )}
      </header>
      )}

      <main className="max-w-xl mx-auto px-4 pt-3 space-y-4">
        {/* Hero Promo Banner */}
        <div className="bg-gradient-to-r from-[#FDE8E1] via-[#FDF2F4] to-[#FCE7EB] dark:from-rose-950/40 dark:to-amber-950/20 rounded-3xl p-4 sm:p-5 border border-rose-100/70 dark:border-rose-900/40 relative overflow-hidden flex items-center justify-between shadow-xs">
          <div className="space-y-1.5 max-w-[210px] sm:max-w-xs z-10">
            <h2 className="font-serif italic font-black text-2xl sm:text-3xl text-[#C2185B] dark:text-rose-400 leading-[1.15] tracking-tight">
              Cravings look better with rewards!
            </h2>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span>Earn 1 point for every ₹10 spent</span>
            </p>
          </div>
          <div className="shrink-0 relative z-10 -mr-1">
            <CuteCoffeeMascot />
          </div>
        </div>

        {/* Navigation Tabs (Pill style matching target design) */}
        <div className="flex items-center gap-2 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "menu"
                ? "bg-[#E11D48] text-white shadow-md shadow-rose-500/20"
                : "bg-white/80 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 border border-rose-100/60"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Menu ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cart")}
            className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "cart"
                ? "bg-[#E11D48] text-white shadow-md shadow-rose-500/20"
                : "bg-white/80 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 border border-rose-100/60"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart ({cartTotals.totalItems})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("order")}
            className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "order"
                ? "bg-[#E11D48] text-white shadow-md shadow-rose-500/20"
                : "bg-white/80 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 border border-rose-100/60"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>
              Orders ({orders.length > 0 ? orders.length : recentOrders.length})
            </span>
          </button>
        </div>

        {/* Customer Quick Registration Card if not logged in */}
        {!customer && activeTab === "menu" && (
          <Card className="p-4 border border-rose-200/80 bg-white/90 dark:bg-zinc-900 rounded-3xl flex items-center justify-between gap-3 shadow-xs">
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Register with your phone number in 5 seconds
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                No app download or OTP required. Earn automatic loyalty points on every order.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="bg-[#E11D48] text-white rounded-xl px-3.5 text-xs font-bold hover:bg-[#BE123C] shrink-0"
            >
              Enter Phone
            </Button>
          </Card>
        )}

        {/* TAB 1: DIGITAL MENU */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            {/* Customer Quick Reorder Card */}
            {customer && (
              <div className="bg-[#FDF2F4] dark:bg-rose-950/30 rounded-2xl p-3 sm:p-3.5 border border-rose-100/80 dark:border-rose-900/40 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#E11D48] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <span>Your usual, {customer.displayName || customer.fullName?.split(" ")[0] || "Friend"}?</span>
                    </p>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5 font-medium">
                      {favoriteItems.length > 0
                        ? favoriteItems.map((i) => i.item_name).join(" + ")
                        : "Kesar Chai + Potato Spiral"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReorderFavorites}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white shrink-0 flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                >
                  <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                  <span>Reorder</span>
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you craving today?"
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl border border-rose-100/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-[#E11D48] text-white shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-rose-100/70 hover:bg-rose-50"
                }`}
              >
                <span>⊞</span>
                <span>All</span>
              </button>
              {categories.map((cat) => {
                const isComboCat = /combo|deal/i.test(cat.name);
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                      isComboCat
                        ? isSelected
                          ? "bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-black shadow-md ring-2 ring-rose-400/50"
                          : "bg-gradient-to-r from-amber-50 via-rose-50 to-pink-50 dark:from-amber-950/40 dark:to-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-extrabold hover:bg-rose-100 shadow-2xs"
                        : isSelected
                        ? "bg-[#E11D48] text-white shadow-xs font-bold"
                        : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-rose-100/70 hover:bg-rose-50 font-semibold"
                    }`}
                  >
                    <span>{isComboCat ? "🔥" : getCategoryIcon(cat.name)}</span>
                    <span>{cat.name}</span>
                    {isComboCat && (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-md text-[9px] font-black uppercase tracking-wider shadow-2xs">
                        Save ₹
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Special Highlight Banner when viewing Combos */}
            {selectedCategory !== "all" &&
              categories.some(
                (c) => c.id === selectedCategory && /combo|deal/i.test(c.name)
              ) && (
                <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl animate-bounce">🔥</span>
                    <div>
                      <span className="font-black text-sm block">
                        Curated Combos & Value Deals
                      </span>
                      <span className="text-[11px] text-white/90">
                        Guaranteed savings up to ₹73 on our most loved pairings!
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-white text-rose-600 rounded-xl font-black text-[10px] shrink-0 uppercase shadow-2xs">
                    Best Value
                  </span>
                </div>
              )}

            {/* Section Heading: "Made for your cravings" */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h3 className="font-serif font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight flex items-center gap-1.5">
                  <span>Made for your cravings</span>
                  <span className="text-amber-500 text-xs">✨</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Every bite earns you points
                </p>
              </div>
              <span className="text-[#E11D48] text-lg font-bold">♡</span>
            </div>

            {/* Menu Items List (2-COLUMN GRID with Rich Imagery!) */}
            {filteredItems.length === 0 ? (
              <Card className="p-8 text-center space-y-2 rounded-3xl bg-white dark:bg-zinc-900 border border-rose-100">
                <Coffee className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="font-semibold text-sm">No matching menu items</p>
                <p className="text-xs text-zinc-500">
                  Try clearing your search filter or selecting another category.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {filteredItems.map((item) => {
                  const inCartQty = cart
                    .filter((c) => c.menuItem.id === item.id)
                    .reduce((sum, c) => sum + c.quantity, 0);

                  const isComboItem =
                    /combo/i.test(item.name) ||
                    /save ₹/i.test(item.description || "") ||
                    categories.some(
                      (c) => c.id === item.category_id && /combo|deal/i.test(c.name)
                    );

                  const savingsMatch = item.description?.match(/Save ₹(\d+)/i);
                  const savingsAmount = savingsMatch ? savingsMatch[1] : null;

                  const originalMatch = item.description?.match(/Menu Total ₹(\d+)/i);
                  const originalTotal = originalMatch ? originalMatch[1] : null;

                  // Specification Section 13:
                  // Combos earn 1 pt per ₹20 spent (floor(price / 20))
                  // Regular items earn 1 pt per ₹10 spent (floor(price / 10))
                  const pointsEarned = isComboItem
                    ? Math.floor(item.price / 20)
                    : Math.floor(
                        (item.price / (loyaltyOffer?.currency_unit || 10)) *
                          (loyaltyOffer?.points_per_currency_unit || 1) *
                          (item.loyalty_multiplier || 1)
                      );

                  return (
                    <div
                      key={item.id}
                      className={`bg-white dark:bg-zinc-900 rounded-3xl p-2.5 sm:p-3 border shadow-2xs flex flex-col justify-between hover:shadow-md transition-all group overflow-hidden ${
                        isComboItem
                          ? "border-rose-200/90 dark:border-rose-900/60 ring-1 ring-rose-200/50"
                          : "border-rose-100/70 dark:border-zinc-800/80"
                      } ${!item.is_available ? "opacity-60" : ""}`}
                    >
                      <div>
                        {/* Food Image */}
                        <div className="h-32 sm:h-36 w-full rounded-2xl overflow-hidden bg-rose-50 dark:bg-zinc-800 mb-2 relative">
                          <img
                            src={getItemImage(item.name, item.image_url)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {!item.is_available && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center">
                              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Sold Out
                              </span>
                            </div>
                          )}

                          {isComboItem && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <span>🔥</span>
                              <span>COMBO</span>
                            </div>
                          )}

                          {isComboItem && savingsAmount && (
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                              SAVE ₹{savingsAmount}
                            </div>
                          )}

                          {!isComboItem && item.loyalty_multiplier > 1 && (
                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                              {item.loyalty_multiplier}x Pts
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Bottom Row: Price, Points & Add Button */}
                      <div className="pt-2 flex items-center justify-between gap-1.5 mt-auto">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
                              {formatCurrency(item.price, store.currency)}
                            </span>
                            {isComboItem && originalTotal && (
                              <span className="text-[10px] text-zinc-400 line-through">
                                ₹{originalTotal}
                              </span>
                            )}
                          </div>
                          {loyaltyOffer && (
                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                              <span className="text-[11px]">☆</span>
                              <span>+{pointsEarned} pts</span>
                            </div>
                          )}
                        </div>

                        {/* Add to Cart / Quantity Stepper */}
                        <div className="shrink-0">
                          {inCartQty > 0 &&
                          (item.variants?.length || 0) === 0 &&
                          (item.addons?.length || 0) === 0 ? (
                            <div className="flex items-center gap-1 bg-[#FDF2F4] dark:bg-zinc-800 rounded-xl p-0.5 border border-rose-200">
                              <button
                                type="button"
                                onClick={() => {
                                  const cartKey = `${item.id}_default`;
                                  setCart((prev) => {
                                    const existing = prev.find(
                                      (c) => c.cartKey === cartKey
                                    );
                                    if (!existing) return prev;
                                    if (existing.quantity <= 1) {
                                      return prev.filter(
                                        (c) => c.cartKey !== cartKey
                                      );
                                    }
                                    return prev.map((c) =>
                                      c.cartKey === cartKey
                                        ? { ...c, quantity: c.quantity - 1 }
                                        : c
                                    );
                                  });
                                }}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-700 hover:bg-white"
                              >
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center tabular-nums">
                                {inCartQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddItemClick(item)}
                                className="w-6 h-6 rounded-lg bg-[#E11D48] text-white flex items-center justify-center hover:bg-[#BE123C]"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={!item.is_available}
                              onClick={() => handleAddItemClick(item)}
                              className="w-8 h-8 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white flex items-center justify-center shadow-xs active:scale-95 transition-transform disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CART & CHECKOUT (Matching award-winning target UI) */}
        {activeTab === "cart" && (
          <div className="space-y-4 max-w-xl mx-auto pb-20">
            {cart.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h2 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 font-serif">
                  Your cart is empty
                </h2>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Browse the menu and add your favorite treats to earn loyalty points and redeem rewards!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* 1. Gamified Treat Progress Card */}
                <div className="bg-gradient-to-b from-[#FFF5F7] via-[#FFF5F7] to-[#FFE8EF]/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border border-rose-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  {/* Title & Mascot Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight font-serif flex items-center gap-1.5 flex-wrap">
                        <span>So close</span>
                        <span className="text-[#E11D48] italic">
                          to your next free treat!
                        </span>
                        <span>☕</span>
                        <span className="text-rose-400">🪄</span>
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        {treatProgress.currentPts} points + {treatProgress.cartPts} from this cart ={" "}
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {treatProgress.projectedPts}
                        </span>
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 text-2xl shrink-0">
                      🎁
                    </div>
                  </div>

                  {/* Progress Bar Row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 rounded-full bg-rose-200/70 dark:bg-zinc-800 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-[#E11D48] transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(6, treatProgress.progressPercent))}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 tabular-nums shrink-0">
                      {treatProgress.projectedPts} / {treatProgress.targetPts}
                    </span>
                  </div>

                  {/* Dynamic Helper Note */}
                  <div className="bg-rose-100/70 dark:bg-rose-950/40 rounded-xl px-3.5 py-2 text-center text-xs font-bold text-rose-950 dark:text-rose-200">
                    {treatProgress.pointsRemaining > 0
                      ? `Just ₹${treatProgress.amountNeeded} more in your cart unlocks your ${treatProgress.targetPts}-point reward after payment!`
                      : `🎉 This order unlocks your ${treatProgress.targetPts}-point ${nextReward.name} reward!`}
                  </div>

                  {/* Smart Booster Cross-sell Card */}
                  {boosterItem && (
                    <div className="bg-white dark:bg-zinc-850 rounded-2xl p-3 border border-rose-100 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-3">
                      <img
                        src={getItemImage(boosterItem.name, boosterItem.image_url)}
                        alt={boosterItem.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            🔥 Popular
                          </span>
                        </div>
                        <p className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                          Add {boosterItem.name} · {formatCurrency(boosterItem.price, store.currency)}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {boosterItem.description || "A classic to make your day brighter!"}
                        </p>
                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                          +{boosterPoints} more points, projected {treatProgress.projectedPts + boosterPoints}/{treatProgress.targetPts}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickAddUpsell(boosterItem)}
                        className="px-3.5 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Your Cart Section */}
                <div className="space-y-3 pt-1">
                  <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-serif tracking-tight">
                    <span>Your Cart</span>
                    <span className="text-rose-500">🪄</span>
                  </h3>
                  <div className="space-y-2.5">
                    {cart.map((entry) => {
                      const varDelta = entry.selectedVariant?.price_delta || 0;
                      const addonSum = entry.selectedAddons.reduce(
                        (s, a) => s + a.price,
                        0
                      );
                      const unitPrice =
                        entry.menuItem.price + varDelta + addonSum;
                      const linePts = Math.floor(
                        (unitPrice * entry.quantity) /
                          (loyaltyOffer?.currency_unit || 10)
                      ) * (loyaltyOffer?.points_per_currency_unit || 1);

                      return (
                        <div
                          key={entry.cartKey}
                          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-3"
                        >
                          <img
                            src={getItemImage(
                              entry.menuItem.name,
                              entry.menuItem.image_url
                            )}
                            alt={entry.menuItem.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 shadow-2xs"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                              {entry.menuItem.name}
                            </p>
                            {entry.selectedVariant && (
                              <p className="text-[11px] text-zinc-500">
                                Option: {entry.selectedVariant.name}
                              </p>
                            )}
                            {entry.selectedAddons.length > 0 && (
                              <p className="text-[11px] text-zinc-500">
                                Add-ons:{" "}
                                {entry.selectedAddons
                                  .map((a) => a.name)
                                  .join(", ")}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-[11px] italic text-zinc-500 truncate">
                                “{entry.notes}”
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                {formatCurrency(
                                  unitPrice * entry.quantity,
                                  store.currency
                                )}
                              </span>
                              <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                                ⭐{" "}
                                <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                                  +{linePts} pts
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              aria-label="Remove item"
                              onClick={() =>
                                setCart((prev) =>
                                  prev.filter(
                                    (c) => c.cartKey !== entry.cartKey
                                  )
                                )
                              }
                              className="w-8 h-8 rounded-xl border border-stone-200 dark:border-zinc-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-center border border-stone-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-stone-50/50 dark:bg-zinc-800">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() => updateCartQty(entry.cartKey, -1)}
                                className="w-7 h-8 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                                {entry.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => updateCartQty(entry.cartKey, 1)}
                                className="w-7 h-8 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. How would you like your order? Section */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span className="text-rose-500">📍</span>
                    <span>How would you like your order?</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { val: "dine_in" as const, label: "Dine-In", icon: "🪑" },
                      { val: "takeaway" as const, label: "Takeaway", icon: "🛍️" },
                      {
                        val: "pickup" as const,
                        label: "Counter Pickup",
                        icon: "🏪",
                      },
                    ].map(({ val, label, icon }) => {
                      const isSelected = orderType === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setOrderType(val)}
                          className={`relative py-3.5 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "border-[#E11D48] bg-rose-50/60 dark:bg-rose-950/20 shadow-2xs"
                              : "border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-stone-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#E11D48] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                          <span className="text-2xl">{icon}</span>
                          <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        <span>🪑</span>
                        <span>
                          {store?.require_table_number
                            ? "Table number (required)"
                            : "Table number (optional)"}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g., Table 04 (Leave blank if sitting elsewhere)"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#E11D48] focus:ring-2 focus:ring-rose-100 transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        <span>📝</span>
                        <span>
                          Any special instructions or allergies? (optional)
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g., Less sugar, serve warm, oat milk..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-[#E11D48] focus:ring-2 focus:ring-rose-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Use your rewards Section */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-serif">
                    <span className="text-rose-500">🎁</span>
                    <span>Use your rewards</span>
                    <span className="text-rose-500">🪄</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Store Credit Card */}
                    <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(
                            customer?.redeemableAmount || 100,
                            store.currency
                          )}{" "}
                          available store credit
                        </p>
                        <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applyStoreCreditToggle}
                            onChange={(e) =>
                              setApplyStoreCreditToggle(e.target.checked)
                            }
                            disabled={
                              !customer ||
                              (customer?.redeemableAmount || 0) <= 0
                            }
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-[#E11D48]"
                          />
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Apply credit to this order
                          </span>
                        </label>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Up to{" "}
                          {formatCurrency(
                            Math.min(
                              customer?.redeemableAmount || 100,
                              cartTotals.subtotal + cartTotals.taxTotal
                            ),
                            store.currency
                          )}{" "}
                          can be applied
                        </p>
                      </div>
                    </div>

                    {/* Locked / Available Next Reward Card */}
                    <div className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/40 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100/70 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        {treatProgress.projectedPts >= treatProgress.targetPts ? (
                          <Sparkles className="w-5 h-5" />
                        ) : (
                          <div className="flex items-center justify-center">
                            <Lock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>
                            {nextReward.name} — {treatProgress.targetPts} pts
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          {treatProgress.projectedPts >= treatProgress.targetPts
                            ? "Unlocks with this order! Claim at counter after payment."
                            : "Unlocks after enough points are credited."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {cartTotals.hasComboItems && (
                    <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Combo Deal:</strong> Combos in your cart already include guaranteed bundled savings and earn 1 point per ₹20 spent.
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-500 flex items-center gap-1 pl-1">
                    <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Points and store credit are separate balances.</span>
                  </p>
                </div>

                {/* 5. Bill Breakdown */}
                <div className="pt-2">
                  <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(cartTotals.subtotal, store.currency)}
                      </span>
                    </div>
                    {cartTotals.comboSavingsTotal > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Bundle & Combo Savings</span>
                        <span className="tabular-nums">
                          -{formatCurrency(cartTotals.comboSavingsTotal, store.currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>GST / Taxes ({store.tax_percentage}%)</span>
                      <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(cartTotals.taxTotal, store.currency)}
                      </span>
                    </div>
                    {cartTotals.discountTotal > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>
                          Loyalty Points Discount ({cartTotals.pointsToRedeem} pts)
                        </span>
                        <span className="tabular-nums">
                          -{formatCurrency(cartTotals.discountTotal, store.currency)}
                        </span>
                      </div>
                    )}
                    {cartTotals.storeCreditApplied > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Store Credit Applied</span>
                        <span className="tabular-nums">
                          -{formatCurrency(cartTotals.storeCreditApplied, store.currency)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-stone-200 dark:border-zinc-800 pt-2 flex justify-between items-baseline">
                      <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                        Total at counter
                      </span>
                      <span className="font-extrabold text-base sm:text-lg tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(cartTotals.total, store.currency)}
                      </span>
                    </div>
                    <div className="pt-0.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                      <span>⭐</span>
                      <span>
                        You&apos;ll earn +{cartTotals.estimatedPoints} points after
                        payment
                      </span>
                    </div>
                  </div>
                </div>

                {orderError && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                    {orderError}
                  </div>
                )}

                {/* 6. Action Bar */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={submittingOrder}
                    onClick={handlePlaceOrder}
                    className="w-full bg-[#E11D48] hover:bg-[#BE123C] text-white py-3.5 px-6 rounded-full shadow-lg shadow-rose-500/25 flex items-center justify-between transition-all transform active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                  >
                    <div className="text-left">
                      <p className="text-base sm:text-lg font-extrabold tracking-tight">
                        {submittingOrder
                          ? "Creating Order Token..."
                          : customer
                          ? `Place Order • ${formatCurrency(cartTotals.total, store.currency)}`
                          : "Enter Phone Number & Place Order"}
                      </p>
                      <p className="text-[11px] text-rose-100 font-medium">
                        Pay at counter
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E11D48] shrink-0 shadow-sm">
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: LIVE ORDER CONFIRMATION & STATUS */}
        {activeTab === "order" && (
          <div className="space-y-4">
            {/* Orders Queue Switcher (multi-order support so previous orders never vanish) */}
            {orders.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Your Orders ({orders.length})
                    </span>
                    {orders.filter(
                      (o) =>
                        ![
                          "served",
                          "cancelled",
                          "rejected",
                          "expired",
                          "refunded",
                        ].includes(o.status)
                    ).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                        {
                          orders.filter(
                            (o) =>
                              ![
                                "served",
                                "cancelled",
                                "rejected",
                                "expired",
                                "refunded",
                              ].includes(o.status)
                          ).length
                        }{" "}
                        active
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("menu")}
                    className={`text-xs font-semibold flex items-center gap-1 ${theme.primaryText} hover:underline`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Order More Items
                  </button>
                </div>

                {/* Queue Cards Horizontal Carousel / Scroller */}
                <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
                  {orders.map((ord) => {
                    const isSelected = ord.id === activeOrder?.id;
                    const isReady = ord.status === "ready";
                    const isTerminal = [
                      "served",
                      "cancelled",
                      "rejected",
                      "expired",
                      "refunded",
                    ].includes(ord.status);

                    return (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => setSelectedOrderId(ord.id)}
                        className={`flex-shrink-0 text-left p-2.5 rounded-sm border transition-all min-w-[175px] relative ${
                          isSelected
                            ? `${theme.cardHighlight} bg-white dark:bg-zinc-900 shadow-md ring-2 ${theme.primaryBorder}`
                            : "bg-white/80 dark:bg-zinc-900/70 border-stone-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 opacity-85 hover:opacity-100"
                        } ${
                          isReady
                            ? "ring-2 ring-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.6)] animate-pulse bg-emerald-50/50 dark:bg-emerald-950/20"
                            : ""
                        }`}
                      >
                        {isReady && (
                          <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5 animate-bounce">
                            <Sparkles className="w-2.5 h-2.5" /> Ready!
                          </span>
                        )}
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-sm tracking-tight">
                            {ord.order_number}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              isReady
                                ? "bg-emerald-600 text-white"
                                : isTerminal
                                ? "bg-stone-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {ord.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                          <span className="truncate max-w-[95px]">
                            {ord.items?.length || 0}{" "}
                            {ord.items?.length === 1 ? "item" : "items"}
                          </span>
                          <span className="font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                            {formatCurrency(
                              ord.total,
                              ord.currency || store.currency
                            )}
                          </span>
                        </div>
                        {isSelected && (
                          <div
                            className={`mt-1.5 text-[10px] font-semibold ${theme.primaryText} flex items-center gap-1`}
                          >
                            <span>● Viewing this token</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!activeOrder ? (
              <Card className="p-8 text-center space-y-3">
                <Utensils className="w-10 h-10 text-zinc-400 mx-auto" />
                <h2 className="font-bold text-base">No active order selected</h2>
                <p className="text-xs text-zinc-500">
                  Place an order from the menu to receive your counter token and track live preparation status.
                </p>
                <Button onClick={() => setActiveTab("menu")} className={theme.primaryButton}>
                  Go to Menu
                </Button>
              </Card>
            ) : (
              <>
                {/* Prominent Counter Confirmation Card (ORD-07, ORD-08) */}
                <Card className={`p-6 text-center space-y-3 border-2 ${theme.cardHighlight} bg-white dark:bg-zinc-900 shadow-sm`}>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm ${theme.counterBadge} text-xs font-bold uppercase tracking-wider`}>
                    <QrCode className="w-3.5 h-3.5" />
                    Show this screen at the counter
                  </div>

                  <div className="pt-1">
                    <p className="text-xs uppercase tracking-widest text-zinc-500">
                      Order Number
                    </p>
                    <p className="text-4xl font-extrabold tracking-tight tabular-nums mt-0.5">
                      {activeOrder.order_number}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <span>Name: {activeOrder.customer_display_name}</span>
                    <span>•</span>
                    <span className="uppercase text-xs font-bold px-2 py-0.5 rounded-sm bg-stone-200 dark:bg-zinc-800">
                      {activeOrder.order_type.replace("_", " ")}
                      {activeOrder.table_number
                        ? ` (${activeOrder.table_number})`
                        : ""}
                    </span>
                  </div>

                  {/* Earned Points Callout once Paid */}
                  {activeOrder.points_earned > 0 && (
                    <div className="p-3 rounded-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Payment verified! +{activeOrder.points_earned} loyalty points credited to your card.
                      </span>
                    </div>
                  )}

                  {activeOrder.status === "rejected" ||
                  activeOrder.status === "cancelled" ||
                  activeOrder.status === "expired" ||
                  activeOrder.status === "refunded" ? (
                    <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold space-y-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        <span className="uppercase">
                          Order {activeOrder.status}
                        </span>
                      </div>
                      {activeOrder.cancellation_reason && (
                        <p className="font-normal">
                          Reason: {activeOrder.cancellation_reason}
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        fetchOrderLive(
                          activeOrder.id,
                          activeOrder.public_token,
                          customer?.cardPublicId
                        )
                      }
                      disabled={refreshingOrder}
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 mr-1.5 ${
                          refreshingOrder ? "animate-spin" : ""
                        }`}
                      />
                      Refresh Status
                    </Button>

                    {(activeOrder.status === "created" ||
                      activeOrder.status === "awaiting_confirmation") && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={handleCancelOrder}
                        disabled={cancellingOrder}
                      >
                        {cancellingOrder ? "Cancelling..." : "Cancel Order"}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setActiveTab("menu")}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Order More Items
                    </Button>
                  </div>
                </Card>

                {/* Glowing Ready for Pickup Announcement Banner */}
                {activeOrder.status === "ready" && (
                  <div className="p-4 rounded-sm bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.85)] animate-pulse border-2 border-emerald-300 text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Ready at Counter for Pickup!</span>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                    </div>
                    <p className="text-xs text-emerald-50 font-medium">
                      Your order is freshly prepared. Head to the counter and show Token{" "}
                      <strong className="text-white underline font-bold text-sm">
                        {activeOrder.order_number}
                      </strong>{" "}
                      to collect your food!
                    </p>
                  </div>
                )}

                {/* Live Fulfilment Stepper with Super Glowing Step 5 */}
                <Card className="p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Live Order Progress
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      {
                        key: "awaiting_confirmation",
                        label: "1. Show at Counter",
                        done: [
                          "confirmed",
                          "awaiting_payment",
                          "paid",
                          "points_credited",
                          "preparing",
                          "ready",
                          "served",
                        ].includes(activeOrder.status),
                        current:
                          activeOrder.status === "created" ||
                          activeOrder.status === "awaiting_confirmation",
                      },
                      {
                        key: "confirmed",
                        label: "2. Staff Confirmed",
                        done: [
                          "paid",
                          "points_credited",
                          "preparing",
                          "ready",
                          "served",
                        ].includes(activeOrder.status),
                        current:
                          activeOrder.status === "confirmed" ||
                          activeOrder.status === "awaiting_payment",
                      },
                      {
                        key: "points_credited",
                        label: "3. Paid & Points Added",
                        done: [
                          "points_credited",
                          "preparing",
                          "ready",
                          "served",
                        ].includes(activeOrder.status),
                        current: activeOrder.status === "paid",
                      },
                      {
                        key: "preparing",
                        label: "4. Preparing",
                        done: ["ready", "served"].includes(activeOrder.status),
                        current:
                          activeOrder.status === "points_credited" ||
                          activeOrder.status === "preparing",
                      },
                      {
                        key: "ready",
                        label: "5. Ready at Counter",
                        done: activeOrder.status === "served",
                        current: activeOrder.status === "ready",
                      },
                      {
                        key: "served",
                        label: "6. Served",
                        done: activeOrder.status === "served",
                        current: false,
                      },
                    ].map((step) => {
                      const isReadyStep =
                        step.key === "ready" && step.current;
                      return (
                        <div
                          key={step.key}
                          className={`p-2.5 rounded-sm border text-xs flex items-center justify-between gap-2 transition-all ${
                            isReadyStep
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.95)] ring-4 ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 animate-pulse font-extrabold scale-[1.03] z-10"
                              : step.done
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium"
                              : step.current
                              ? `${theme.primaryLightBg} ${theme.primaryBorder} font-bold`
                              : "border-stone-200 dark:border-zinc-800 text-zinc-400 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isReadyStep ? (
                              <span className="relative flex h-3 w-3 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-90"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                              </span>
                            ) : step.done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="truncate">{step.label}</span>
                          </div>
                          {isReadyStep && (
                            <span className="px-1.5 py-0.5 rounded bg-white text-emerald-900 text-[10px] font-black uppercase tracking-wider shrink-0 animate-bounce shadow-sm">
                              Ready!
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Ordered Items Summary */}
                <Card className="p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Order Items
                  </h3>
                  <div className="divide-y divide-stone-200 dark:divide-zinc-800 text-sm">
                    {(activeOrder.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-semibold">
                            {item.quantity}x {item.item_name}
                          </span>
                        </div>
                        <span className="tabular-nums font-medium">
                          {formatCurrency(item.total_price, activeOrder.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-stone-200 dark:border-zinc-800 pt-2 flex justify-between font-bold text-sm">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatCurrency(activeOrder.total, activeOrder.currency)}
                    </span>
                  </div>
                </Card>
              </>
            )}

            {/* Recent Orders List */}
            {recentOrders.length > 0 && (
              <Card className="p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Your Recent Orders at {store.name}
                </h3>
                <div className="divide-y divide-stone-200 dark:divide-zinc-800">
                  {recentOrders.map((ro) => (
                    <button
                      key={ro.id}
                      type="button"
                      onClick={() =>
                        fetchOrderLive(
                          ro.id,
                          ro.public_token,
                          customer?.cardPublicId
                        )
                      }
                      className="w-full py-2.5 flex items-center justify-between text-left text-xs hover:bg-stone-100 dark:hover:bg-zinc-800/50 px-2 rounded-sm"
                    >
                      <div>
                        <span className="font-bold">{ro.order_number}</span>
                        <span className="text-zinc-500 ml-2">
                          {formatDate(ro.created_at, true)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{ro.status}</Badge>
                        <span className="font-bold tabular-nums">
                          {formatCurrency(ro.total, store.currency)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Sticky Bottom View Cart Pill Bar */}
      {activeTab === "menu" && (
        <div className={`fixed ${embedded ? "bottom-20" : "bottom-20"} inset-x-0 z-40 px-4 max-w-xl mx-auto pointer-events-none`}>
          <button
            type="button"
            onClick={() => setActiveTab("cart")}
            className="w-full pointer-events-auto bg-gradient-to-r from-[#E11D48] via-[#E11D48] to-[#D81159] hover:from-[#BE123C] hover:to-[#C00D4E] text-white rounded-2xl p-3.5 sm:p-4 shadow-xl shadow-rose-500/25 flex items-center justify-between cursor-pointer transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white stroke-[2.2]" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold leading-tight">
                  View Cart
                </div>
                <div className="text-xs text-white/90">
                  {cartTotals.totalItems} {cartTotals.totalItems === 1 ? "item" : "items"}
                  {cartTotals.totalItems > 0 &&
                    ` · ${formatCurrency(cartTotals.total, store.currency)}`}
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-white/90 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Item Customization Modal (Variants & Add-ons) */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-md p-5 space-y-4 bg-white dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-base">{customizingItem.name}</h3>
                <p className="text-xs text-zinc-500">
                  Base price:{" "}
                  {formatCurrency(customizingItem.price, store.currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                Close
              </button>
            </div>

            {(customizingItem.variants?.length || 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Choose Option
                </p>
                <div className="space-y-1.5">
                  {customizingItem.variants.map((v) => (
                    <label
                      key={v.id}
                      className="flex items-center justify-between p-2.5 rounded-sm border border-stone-200 dark:border-zinc-800 text-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="variant"
                          checked={chosenVariantId === v.id}
                          onChange={() => setChosenVariantId(v.id)}
                          style={{
                            accentColor:
                              store?.primary_color ||
                              (store?.theme_preset === "rose"
                                ? "#E11D48"
                                : "#18181B"),
                          }}
                        />
                        <span className="font-medium">{v.name}</span>
                      </span>
                      <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                        {v.price_delta > 0
                          ? `+${formatCurrency(v.price_delta, store.currency)}`
                          : "Included"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(customizingItem.addons?.length || 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Optional Add-Ons
                </p>
                <div className="space-y-1.5">
                  {customizingItem.addons.map((a) => {
                    const checked = chosenAddonIds.includes(a.id);
                    return (
                      <label
                        key={a.id}
                        className="flex items-center justify-between p-2.5 rounded-sm border border-stone-200 dark:border-zinc-800 text-xs cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setChosenAddonIds((prev) => [...prev, a.id]);
                              } else {
                                setChosenAddonIds((prev) =>
                                  prev.filter((id) => id !== a.id)
                                );
                              }
                            }}
                            style={{
                              accentColor:
                                store?.primary_color ||
                                (store?.theme_preset === "rose"
                                  ? "#E11D48"
                                  : "#18181B"),
                            }}
                          />
                          <span className="font-medium">{a.name}</span>
                        </span>
                        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                          +{formatCurrency(a.price, store.currency)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <Input
              label="Item Note (Optional)"
              placeholder="e.g., Extra hot, less ice..."
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
            />

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setCustomizingItem(null)}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${theme.primaryButton}`}
                onClick={() => {
                  const v =
                    customizingItem.variants?.find(
                      (row) => row.id === chosenVariantId
                    ) || null;
                  const adds = (customizingItem.addons || []).filter((row) =>
                    chosenAddonIds.includes(row.id)
                  );
                  addEntryToCart(customizingItem, v, adds, itemNote);
                }}
              >
                Add to Cart
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Minimal Phone Registration Modal (REG-01..07) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {store.logo_url && (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-10 h-10 rounded-sm object-cover border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-xs"
                  />
                )}
                <div>
                  <h2 className="text-lg font-bold">
                    Join {store.name} Loyalty & Order
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Phone number is the only required field. Returning customers are signed in automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRegisterCustomer} className="space-y-3.5">
              <Input
                label="Mobile Number (Required)"
                type="tel"
                placeholder="e.g., 98450 98765"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                required
              />

              <Input
                label="Your Name (Optional — shown on order callout)"
                placeholder="e.g., Ananya"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />

              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="you@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />

              <label className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regLoyaltyConsent}
                  onChange={(e) => setRegLoyaltyConsent(e.target.checked)}
                  required
                  className="mt-0.5"
                  style={{
                    accentColor:
                      store?.primary_color ||
                      (store?.theme_preset === "rose"
                        ? "#E11D48"
                        : "#18181B"),
                  }}
                />
                <span>
                  I consent to loyalty points tracking and agree to the{" "}
                  <Link href="/terms" className="underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline">
                    Privacy Policy
                  </Link>{" "}
                  (DPDP Act 2023).
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regMarketingConsent}
                  onChange={(e) => setRegMarketingConsent(e.target.checked)}
                  className="mt-0.5"
                  style={{
                    accentColor:
                      store?.primary_color ||
                      (store?.theme_preset === "rose"
                        ? "#E11D48"
                        : "#18181B"),
                  }}
                />
                <span>
                  Send me occasional seasonal menu & bonus point offers (Optional).
                </span>
              </label>

              {regError && (
                <p className="text-xs text-red-600 font-medium">{regError}</p>
              )}

              <Button
                type="submit"
                className={`w-full ${theme.primaryButton}`}
                disabled={regLoading}
              >
                {regLoading ? "Signing In..." : "Continue to Order"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Customer Account & Past Orders Drawer (ACC-01..05) */}
      {showAccountDrawer && customer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-stone-50/70 dark:bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs uppercase"
                  style={{
                    backgroundColor:
                      store?.primary_color ||
                      (store?.theme_preset === "rose" ? "#E11D48" : "#18181B"),
                  }}
                >
                  {(customer.displayName || customer.fullName || "U").slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">My Account & Loyalty</h3>
                  <p className="text-[11px] text-zinc-500">{store?.name || "Store"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountDrawer(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 truncate">
                        {customer.fullName || customer.displayName || "Valued Customer"}
                      </h4>
                      <Badge variant="success" className="shrink-0 text-[10px]">Verified Member</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      {customer.maskedPhone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenEditProfile}
                    className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
                  >
                    <Edit3 className="w-3 h-3 text-terracotta-600 dark:text-terracotta-400" />
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
                    {!customer.email && (
                      <button
                        type="button"
                        onClick={handleOpenEditProfile}
                        className="text-[11px] text-terracotta-600 dark:text-terracotta-400 font-semibold hover:underline shrink-0 ml-2"
                      >
                        + Add Email
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
                    {(!customer.birthdayDay || !customer.birthdayMonth) ? (
                      <button
                        type="button"
                        onClick={handleOpenEditProfile}
                        className="text-[11px] text-terracotta-600 dark:text-terracotta-400 font-semibold hover:underline shrink-0 ml-2"
                      >
                        + Add for Free Treat
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0 ml-2">🎂 Club Active</span>
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
                    className="inline-flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300 hover:text-foreground shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCardNum ? "Copied!" : "Copy #"}</span>
                  </button>
                </div>
              </div>

              {/* Live Wallets */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950/50 text-center relative overflow-hidden">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-mono uppercase text-zinc-500">
                    <span>Loyalty Points</span>
                    <button
                      type="button"
                      onClick={() => refreshCustomerProfile(customer.cardPublicId)}
                      disabled={refreshingPoints}
                      title="Refresh points balance"
                      className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
                    {formatCurrency(customer.redeemableAmount, store.currency)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Redeemable Wallet
                  </div>
                </div>
              </div>

              {/* Unlock Your Rewards Button */}
              {embedded && onNavigateTab ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountDrawer(false);
                    onNavigateTab("rewards");
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all hover:opacity-90 active:scale-[0.99] ${theme.loyaltyChip}`}
                >
                  <Gift className="w-4 h-4 shrink-0" />
                  <span>Unlock Your Rewards</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
                </button>
              ) : (
                <Link
                  href={`/card/${customer.cardPublicId}?tab=rewards`}
                  target="_blank"
                  className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all hover:opacity-90 active:scale-[0.99] ${theme.loyaltyChip}`}
                >
                  <Gift className="w-4 h-4 shrink-0" />
                  <span>Unlock Your Rewards</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
                </Link>
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
                    onClick={() => fetchCustomerOrders(customer.cardPublicId)}
                    disabled={refreshingOrder}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-foreground flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingOrder ? "animate-spin" : ""}`} />
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
                                {formatCurrency(ord.total, store.currency)}
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
                              {ord.items.map((it) => `${it.quantity}x ${it.item_name}`).join(", ")}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-1 border-t border-stone-100 dark:border-zinc-800/80">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderId(ord.id);
                                setShowAccountDrawer(false);
                                setActiveTab("order");
                              }}
                              className="flex-1 py-1 px-2 rounded border border-stone-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800"
                            >
                              Track Status
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorderOrder(ord)}
                              className="flex-1 py-1 px-2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-bold hover:opacity-90 flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>1-Tap Reorder</span>
                            </button>
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
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        onClick={handleLogout}
                      >
                        Confirm Log Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && customer && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 dark:border-zinc-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-terracotta-50 dark:bg-terracotta-950/50 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Edit Profile</h3>
                  <p className="text-[11px] text-zinc-500">Update your membership details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editProfileError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                {editProfileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Shivam"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Email Address (for order receipts & rewards)
                </label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. shivam@gmail.com"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Birthday (for Annual Birthday Club treats 🎂)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editBdayDay}
                    onChange={(e) => setEditBdayDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-foreground focus:outline-hidden focus:ring-1 focus:ring-terracotta-500"
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-foreground focus:outline-hidden focus:ring-1 focus:ring-terracotta-500"
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

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editMarketing}
                  onChange={(e) => setEditMarketing(e.target.checked)}
                  className="rounded-xs text-terracotta-600 focus:ring-terracotta-500"
                />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Receive exclusive offers & point balance alerts on WhatsApp
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditProfileModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingProfile}
                  className="bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5-Tab Bottom Navigation Bar when viewed directly as standalone */}
      {!embedded && (
        <nav
          aria-label="Store navigation"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-rose-100/60 dark:border-zinc-800 shadow-lg no-print"
        >
          <div className="max-w-md mx-auto grid grid-cols-5 py-2 px-1 text-center">
            {customer ? (
              <Link
                href={`/card/${customer.cardPublicId}`}
                className="flex flex-col items-center justify-center gap-1 py-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <Home className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px]">Home</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex flex-col items-center justify-center gap-1 py-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <Home className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px]">Home</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("menu")}
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
                activeTab === "menu"
                  ? "text-[#E11D48] font-bold"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Coffee className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px]">Menu</span>
            </button>

            {customer ? (
              <Link
                href={`/card/${customer.cardPublicId}?tab=rewards`}
                className="flex flex-col items-center justify-center gap-1 py-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <Gift className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px]">Rewards</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex flex-col items-center justify-center gap-1 py-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <Gift className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px]">Rewards</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("order")}
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
                activeTab === "order"
                  ? "text-[#E11D48] font-bold"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px]">Orders</span>
            </button>

            {customer ? (
              <button
                type="button"
                onClick={() => setShowAccountDrawer(true)}
                className="flex flex-col items-center justify-center gap-1 py-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <User className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px]">Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex flex-col items-center justify-center gap-1 py-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <User className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px]">Profile</span>
              </button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

