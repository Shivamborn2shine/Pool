"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserCheck,
  Utensils,
  XCircle,
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

interface CustomerSession {
  id: string;
  displayName: string;
  fullName: string;
  maskedPhone: string;
  phoneLast4: string;
  cardPublicId: string;
  cardNumber: string;
  pointsBalance: number;
  redeemableAmount: number;
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
    pageBg: "bg-rose-50/40 dark:bg-zinc-950",
    headerBorder: "border-rose-100 dark:border-rose-950/40",
    bannerBg: "bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600",
    bannerText: "text-white",
    bannerAccent: "text-pink-100",
    primaryButton: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
    primaryLightBg: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    primaryText: "text-rose-600 dark:text-rose-400",
    primaryBorder: "border-rose-600",
    activeTabBorder: "border-rose-600",
    activeTabText: "text-rose-600 dark:text-rose-400 font-bold",
    chipActive: "bg-rose-600 text-white border-rose-600 shadow-xs",
    loyaltyChip: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300",
    counterBadge: "bg-rose-600 text-white shadow-xs",
    cardHighlight: "border-rose-200 dark:border-rose-900/60",
    focusRing: "focus:ring-rose-500",
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

export default function StoreQrOrderingPage() {
  const params = useParams<{ storeSlug: string }>();
  const searchParams = useSearchParams();
  const storeSlug = params.storeSlug;

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Customer session state
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [regPhone, setRegPhone] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regLoyaltyConsent, setRegLoyaltyConsent] = useState(true);
  const [regMarketingConsent, setRegMarketingConsent] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

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

  const storageKey = `loopa_store_session_${storeSlug}`;

  const loadStoreData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/s/${storeSlug}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load store.");
        return;
      }
      setStore(data.store);
      setLoyaltyOffer(data.loyaltyOffer);
      setCategories(data.categories || []);
      setItems(data.items || []);
    } catch {
      setError("Network error while loading store menu.");
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  const fetchCustomerOrders = useCallback(
    async (targetCardPublicId?: string, targetOrderIds?: string[]) => {
      const cardId = targetCardPublicId || customer?.cardPublicId;
      const orderIds =
        targetOrderIds || (orders.length > 0 ? orders.map((o) => o.id) : []);
      if (!cardId && orderIds.length === 0) return;

      setRefreshingOrder(true);
      try {
        const qs = new URLSearchParams();
        if (cardId) {
          qs.set("cardPublicId", cardId);
        } else if (orderIds.length > 0) {
          qs.set("orderIds", orderIds.join(","));
        }
        const res = await fetch(`/api/s/${storeSlug}/orders?${qs.toString()}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.orders) && data.orders.length > 0) {
          setOrders((prev) => {
            // Merge newly fetched orders with any existing while preserving order
            const incomingIds = new Set(data.orders.map((o: ActiveOrderView) => o.id));
            const retained = prev.filter((o) => !incomingIds.has(o.id));
            return [...data.orders, ...retained];
          });
        }
      } catch {
        // Silent background refresh
      } finally {
        setRefreshingOrder(false);
      }
    },
    [customer?.cardPublicId, orders, storeSlug]
  );

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
    loadStoreData();
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.customer) {
          setCustomer(parsed.customer);
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
  }, [loadStoreData, storageKey]);

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

  // Refresh customer orders once customer session is established
  useEffect(() => {
    if (customer?.cardPublicId) {
      fetchCustomerOrders(customer.cardPublicId);
    }
  }, [customer?.cardPublicId, fetchCustomerOrders]);

  // Support direct link to order status via ?orderId=...&token=...
  useEffect(() => {
    const urlOrderId = searchParams.get("orderId");
    const urlToken = searchParams.get("token");
    if (urlOrderId && urlToken) {
      setActiveTab("order");
      fetchOrderLive(urlOrderId, urlToken);
    }
  }, [searchParams, fetchOrderLive]);

  // Poll all queued orders every 5 seconds while any order is in a non-terminal state
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
        customer?.cardPublicId,
        orders.map((o) => o.id)
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [orders, customer?.cardPublicId, fetchCustomerOrders]);

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

    const total = Math.max(
      0,
      Math.round((subtotal + taxTotal - discountTotal) * 100) / 100
    );

    let estimatedPoints = 0;
    if (loyaltyOffer && total >= loyaltyOffer.minimum_purchase_amount) {
      const basePts =
        Math.floor(total / loyaltyOffer.currency_unit) *
        loyaltyOffer.points_per_currency_unit;
      const multPts =
        basePts * (loyaltyOffer.campaign_multiplier || 1) - basePts;
      estimatedPoints = Math.min(
        loyaltyOffer.maximum_points_per_transaction,
        Math.floor(basePts + multPts + itemBonusPointsEstimate)
      );
    }

    return {
      subtotal,
      taxTotal,
      discountTotal,
      pointsToRedeem,
      total,
      totalItems,
      estimatedPoints,
    };
  }, [cart, customer, loyaltyOffer, redeemPointsToggle, store?.tax_percentage]);

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
          idempotencyKey,
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
          <Button onClick={loadStoreData} className="w-full">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg} text-zinc-900 dark:text-zinc-100 pb-28`}>
      {/* Store Header */}
      <header className={`border-b ${theme.headerBorder} bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs sticky top-0 z-30`}>
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-sm flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs"
              style={{
                backgroundColor:
                  store.primary_color ||
                  (store.theme_preset === "rose" ? "#E11D48" : "#18181B"),
              }}
            >
              {store.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base truncate">{store.name}</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {store.address || "Scan, Order & Earn Loyalty Points"}
              </p>
            </div>
          </div>

          {customer ? (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/card/${customer.cardPublicId}`}
                className={`px-2.5 py-1.5 rounded-sm border text-xs font-medium flex items-center gap-1.5 transition-colors ${theme.loyaltyChip}`}
              >
                <Award className={`w-3.5 h-3.5 ${theme.primaryText}`} />
                <span className="tabular-nums font-bold">
                  {customer.pointsBalance} pts
                </span>
              </Link>
            </div>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAuthModal(true)}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Sign In / Join
            </Button>
          )}
        </div>

        {/* Loyalty Offer Banner */}
        {loyaltyOffer && (
          <div className={`${theme.bannerBg} ${theme.bannerText} px-4 py-2 text-xs`}>
            <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className={`w-3.5 h-3.5 ${theme.bannerAccent} shrink-0`} />
                <span>
                  Earn{" "}
                  <strong>
                    {loyaltyOffer.points_per_currency_unit} pt per ₹
                    {loyaltyOffer.currency_unit}
                  </strong>{" "}
                  spent
                  {loyaltyOffer.campaign_name
                    ? ` • ${loyaltyOffer.campaign_name} (${loyaltyOffer.campaign_multiplier}x)`
                    : ""}
                </span>
              </span>
              {!customer && loyaltyOffer.signup_bonus_points > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className={`${theme.bannerAccent} font-semibold underline shrink-0`}
                >
                  +{loyaltyOffer.signup_bonus_points} pts bonus
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className={`max-w-xl mx-auto px-4 flex border-t ${theme.headerBorder} bg-stone-50/70 dark:bg-zinc-900`}>
          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "menu"
                ? `${theme.activeTabBorder} ${theme.activeTabText}`
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Menu ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cart")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "cart"
                ? `${theme.activeTabBorder} ${theme.activeTabText}`
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Cart ({cartTotals.totalItems})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("order")}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "order"
                ? `${theme.activeTabBorder} ${theme.activeTabText}`
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {orders.some((o) => o.status === "ready") && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <span>
                {orders.length === 0
                  ? "Order Status"
                  : orders.length === 1
                  ? `Order ${orders[0].order_number}`
                  : `Orders (${orders.length})`}
              </span>
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Customer Quick Registration Banner if not logged in */}
        {!customer && activeTab === "menu" && (
          <Card className={`p-4 border-l-4 ${theme.primaryBorder} flex items-center justify-between gap-3`}>
            <div>
              <p className="text-sm font-semibold">
                Register with your phone number in 5 seconds
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                No app download or OTP required. Place your order and earn automatic loyalty rewards on payment.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowAuthModal(true)} className={theme.primaryButton}>
              Enter Phone
            </Button>
          </Card>
        )}

        {/* TAB 1: DIGITAL MENU */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            {/* Search & Category Pills */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search filter coffee, croissants, cold brew..."
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-stone-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 ${theme.focusRing}`}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap border transition-colors ${
                    selectedCategory === "all"
                      ? theme.chipActive
                      : "bg-white dark:bg-zinc-900 border-stone-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap border transition-colors ${
                      selectedCategory === cat.id
                        ? theme.chipActive
                        : "bg-white dark:bg-zinc-900 border-stone-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items List */}
            {filteredItems.length === 0 ? (
              <Card className="p-8 text-center space-y-2">
                <Coffee className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="font-semibold text-sm">No matching menu items</p>
                <p className="text-xs text-zinc-500">
                  Try clearing your search filter or selecting another category.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const inCartQty = cart
                    .filter((c) => c.menuItem.id === item.id)
                    .reduce((sum, c) => sum + c.quantity, 0);

                  return (
                    <Card
                      key={item.id}
                      className={`p-4 flex items-start justify-between gap-4 ${
                        !item.is_available ? "opacity-60" : ""
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm">{item.name}</h3>
                          {item.loyalty_multiplier > 1 && (
                            <Badge variant="warning">
                              {item.loyalty_multiplier}x Points
                            </Badge>
                          )}
                          {!item.is_available && (
                            <Badge variant="danger">Sold Out</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <div className="pt-1 flex items-center gap-3">
                          <span className="font-bold text-sm tabular-nums">
                            {formatCurrency(item.price, store.currency)}
                          </span>
                          {((item.variants?.length || 0) > 0 ||
                            (item.addons?.length || 0) > 0) && (
                            <span className="text-[11px] text-zinc-500">
                              Customizable
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={!item.is_available}
                          onClick={() => handleAddItemClick(item)}
                          className={theme.primaryButton}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          {inCartQty > 0 ? `Add (${inCartQty})` : "Add"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CART & CHECKOUT */}
        {activeTab === "cart" && (
          <div className="space-y-4">
            {cart.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-zinc-400 mx-auto" />
                <h2 className="font-bold text-base">Your cart is empty</h2>
                <p className="text-xs text-zinc-500">
                  Browse the store menu and add items to place your QR order.
                </p>
                <Button onClick={() => setActiveTab("menu")}>
                  Browse Menu
                </Button>
              </Card>
            ) : (
              <>
                <Card className="divide-y divide-stone-200 dark:divide-zinc-800">
                  {cart.map((entry) => {
                    const varDelta = entry.selectedVariant?.price_delta || 0;
                    const addonSum = entry.selectedAddons.reduce(
                      (s, a) => s + a.price,
                      0
                    );
                    const unitPrice =
                      entry.menuItem.price + varDelta + addonSum;
                    return (
                      <div
                        key={entry.cartKey}
                        className="p-4 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {entry.menuItem.name}
                          </p>
                          {entry.selectedVariant && (
                            <p className="text-xs text-zinc-500">
                              Option: {entry.selectedVariant.name}
                            </p>
                          )}
                          {entry.selectedAddons.length > 0 && (
                            <p className="text-xs text-zinc-500">
                              Add-ons:{" "}
                              {entry.selectedAddons
                                .map((a) => a.name)
                                .join(", ")}
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-xs italic text-zinc-500">
                              Note: “{entry.notes}”
                            </p>
                          )}
                          <p className="text-xs font-semibold tabular-nums pt-0.5">
                            {formatCurrency(
                              unitPrice * entry.quantity,
                              store.currency
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => updateCartQty(entry.cartKey, -1)}
                            className="w-7 h-7 rounded-sm border border-stone-300 dark:border-zinc-700 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-zinc-800"
                          >
                            {entry.quantity === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="w-7 text-center text-sm font-bold tabular-nums">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => updateCartQty(entry.cartKey, 1)}
                            className="w-7 h-7 rounded-sm border border-stone-300 dark:border-zinc-700 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-zinc-800"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </Card>

                {/* Order Type & Table Number */}
                <Card className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                      Order Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(
                        [
                          {
                            val: "dine_in" as const,
                            label: "Dine-In",
                            desc: "Enjoy your food at the cafe. Served directly to your seat or table.",
                          },
                          {
                            val: "takeaway" as const,
                            label: "Takeaway",
                            desc: "Freshly packed parcel to take home or enjoy on the move.",
                          },
                          {
                            val: "pickup" as const,
                            label: "Counter Pickup",
                            desc: "Collect from the counter when your token number is ready.",
                          },
                        ] as const
                      ).map(({ val, label, desc }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setOrderType(val)}
                          className={`p-3 rounded-sm text-left border transition-all ${
                            orderType === val
                              ? `${theme.chipActive} shadow-sm ring-1 ${theme.primaryBorder}`
                              : "border-stone-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700"
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center justify-between">
                            <span>{label}</span>
                            {orderType === val && (
                              <Check className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </div>
                          <p
                            className={`text-[11px] mt-1 leading-snug ${
                              orderType === val
                                ? "text-white/80 dark:text-zinc-900/80"
                                : "text-zinc-500"
                            }`}
                          >
                            {desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {orderType === "dine_in" && (
                    <Input
                      label={
                        store?.require_table_number
                          ? "Table Number (Required)"
                          : "Table Number (Optional)"
                      }
                      placeholder={
                        store?.require_table_number
                          ? "e.g., Table 04 or Window Counter"
                          : "e.g., Table 04 (Leave blank if sitting elsewhere)"
                      }
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      required={Boolean(store?.require_table_number)}
                    />
                  )}

                  <Input
                    label="Special Instructions / Allergies (Optional)"
                    placeholder="e.g., Less sugar, serve warm, oat milk..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </Card>

                {/* Loyalty Redemption Toggle (CART-10 / LOY-09) */}
                {customer &&
                  loyaltyOffer &&
                  customer.pointsBalance >=
                    loyaltyOffer.minimum_redemption_points && (
                    <Card className={`p-4 ${theme.cardHighlight} ${theme.primaryLightBg} flex items-center justify-between gap-3`}>
                      <div>
                        <p className="text-sm font-semibold">
                          Redeem {loyaltyOffer.minimum_redemption_points} Loyalty Points
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Save{" "}
                          {formatCurrency(
                            (loyaltyOffer.minimum_redemption_points / 100) *
                              loyaltyOffer.points_value_per_100,
                            store.currency
                          )}{" "}
                          on this order (Available: {customer.pointsBalance} pts)
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={redeemPointsToggle}
                        onChange={(e) =>
                          setRedeemPointsToggle(e.target.checked)
                        }
                        className="w-5 h-5"
                        style={{
                          accentColor:
                            store?.primary_color ||
                            (store?.theme_preset === "rose"
                              ? "#E11D48"
                              : "#18181B"),
                        }}
                      />
                    </Card>
                  )}

                {/* Bill Breakdown */}
                <Card className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal</span>
                    <span className="tabular-nums">
                      {formatCurrency(cartTotals.subtotal, store.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>GST / Taxes ({store.tax_percentage}%)</span>
                    <span className="tabular-nums">
                      {formatCurrency(cartTotals.taxTotal, store.currency)}
                    </span>
                  </div>
                  {cartTotals.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                      <span>
                        Loyalty Points Discount ({cartTotals.pointsToRedeem} pts)
                      </span>
                      <span className="tabular-nums">
                        -{formatCurrency(cartTotals.discountTotal, store.currency)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-stone-200 dark:border-zinc-800 pt-2 flex justify-between font-bold text-base">
                    <span>Total Payable at Counter</span>
                    <span className="tabular-nums">
                      {formatCurrency(cartTotals.total, store.currency)}
                    </span>
                  </div>
                  <div className={`pt-1 flex items-center justify-between text-xs ${theme.primaryText} font-medium`}>
                    <span>Points credited automatically after payment</span>
                    <span className="tabular-nums font-bold">
                      +{cartTotals.estimatedPoints} pts
                    </span>
                  </div>
                </Card>

                {orderError && (
                  <div className="p-3 rounded-sm bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                    {orderError}
                  </div>
                )}

                <Button
                  className={`w-full py-3 text-base ${theme.primaryButton}`}
                  onClick={handlePlaceOrder}
                  disabled={submittingOrder}
                >
                  {submittingOrder
                    ? "Creating Order Token..."
                    : customer
                    ? `Place Order • ${formatCurrency(cartTotals.total, store.currency)}`
                    : "Enter Phone Number & Place Order"}
                </Button>
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

      {/* Sticky Bottom Cart Bar on Menu Tab */}
      {activeTab === "menu" && cartTotals.totalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-zinc-900 border-t border-stone-300 dark:border-zinc-800 p-3 shadow-lg">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-500">
                {cartTotals.totalItems}{" "}
                {cartTotals.totalItems === 1 ? "item" : "items"} in cart
              </p>
              <p className="text-base font-bold tabular-nums">
                {formatCurrency(cartTotals.total, store.currency)}{" "}
                <span className={`text-xs font-normal ${theme.primaryText}`}>
                  (+{cartTotals.estimatedPoints} pts)
                </span>
              </p>
            </div>
            <Button onClick={() => setActiveTab("cart")} className={theme.primaryButton}>
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              View Cart & Order
            </Button>
          </div>
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
              <div>
                <h2 className="text-lg font-bold">
                  Join {store.name} Loyalty & Order
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Phone number is the only required field. Returning customers are signed in automatically.
                </p>
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
    </div>
  );
}

