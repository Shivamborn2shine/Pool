"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileJson,
  Layers,
  Pencil,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { formatCurrency } from "@/lib/utils";
import {
  AI_MENU_EXTRACTION_PROMPT,
  SCOOP_N_BREW_MENU_PRESET,
} from "@/lib/menu-presets";

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  status: string;
}

interface MenuItemRow {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  is_available: boolean;
  is_visible: boolean;
  sort_order: number;
  loyalty_multiplier: number;
  variants: { id: string; name: string; price_delta: number }[];
  addons: { id: string; name: string; price: number }[];
}

export default function AdminMenuAndQrPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [qrInfo, setQrInfo] = useState<{
    slug: string;
    label: string;
    publicUrl: string;
    qrDataUrl: string;
  } | null>(null);
  const [business, setBusiness] = useState<{
    name: string;
    slug: string;
    currency: string;
    order_prefix?: string;
    tax_percentage?: number;
    order_expiry_minutes?: number;
    require_table_number?: boolean;
    primary_color?: string;
    theme_preset?: string;
  } | null>(null);
  const [orderStats, setOrderStats] = useState<{
    totalOrders: number;
    paidOrders: number;
    paidRevenue: number;
    totalPointsIssued: number;
    topItems: { itemName: string; totalQuantity: number; totalRevenue: number }[];
  } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState(false);

  // Order & QR settings form
  const [orderPrefix, setOrderPrefix] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("5");
  const [orderExpiryMinutes, setOrderExpiryMinutes] = useState("20");
  const [requireTableNumber, setRequireTableNumber] = useState(false);
  const [themePreset, setThemePreset] = useState("rose");
  const [primaryColor, setPrimaryColor] = useState("#E11D48");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const settingsDirtyRef = React.useRef(false);

  // New Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSort, setCatSort] = useState("1");
  const [creatingCat, setCreatingCat] = useState(false);

  // Manage Categories Modal & Edit/Delete Category States
  const [showManageCategoriesModal, setShowManageCategoriesModal] =
    useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [editCatSort, setEditCatSort] = useState("1");
  const [editCatStatus, setEditCatStatus] = useState<"active" | "inactive">(
    "active"
  );
  const [savingCatEdit, setSavingCatEdit] = useState(false);

  const [deletingCat, setDeletingCat] = useState<MenuCategory | null>(null);
  const [moveItemsToCatId, setMoveItemsToCatId] = useState<string>("");
  const [deletingCatLoading, setDeletingCatLoading] = useState(false);

  // New Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemMultiplier, setItemMultiplier] = useState("1");
  const [itemVariantsText, setItemVariantsText] = useState("");
  const [itemAddonsText, setItemAddonsText] = useState("");
  const [creatingItem, setCreatingItem] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Item Modal
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [editItemCatId, setEditItemCatId] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [editItemDesc, setEditItemDesc] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editItemMultiplier, setEditItemMultiplier] = useState("1");
  const [savingItemEdit, setSavingItemEdit] = useState(false);

  // Bulk Import / AI Menu Modal
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState("");
  const [bulkImportMode, setBulkImportMode] = useState<"replace" | "merge">(
    "replace"
  );
  const [importingBulk, setImportingBulk] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [menuRes, qrRes, repRes] = await Promise.all([
        fetch("/api/staff/menu/items"),
        fetch("/api/staff/qr"),
        fetch("/api/staff/reports/orders"),
      ]);
      const menuData = await menuRes.json();
      const qrData = await qrRes.json();
      const repData = await repRes.json();

      if (menuRes.ok) {
        setCategories(menuData.categories || []);
        setItems(menuData.items || []);
        if (menuData.categories?.length > 0) {
          setItemCategoryId((prev) => prev || menuData.categories[0].id);
        }
      }
      if (qrRes.ok && qrData.business) {
        setQrInfo(qrData.qr);
        setBusiness(qrData.business);
        if (!settingsDirtyRef.current && qrData.business.order_prefix) {
          setOrderPrefix(qrData.business.order_prefix);
        }
        if (
          !settingsDirtyRef.current &&
          qrData.business.tax_percentage !== undefined
        ) {
          setTaxPercentage(String(qrData.business.tax_percentage));
        }
        if (
          !settingsDirtyRef.current &&
          qrData.business.order_expiry_minutes !== undefined
        ) {
          setOrderExpiryMinutes(
            String(qrData.business.order_expiry_minutes)
          );
        }
        if (
          !settingsDirtyRef.current &&
          qrData.business.require_table_number !== undefined
        ) {
          setRequireTableNumber(Boolean(qrData.business.require_table_number));
        }
        if (
          !settingsDirtyRef.current &&
          qrData.business.theme_preset !== undefined
        ) {
          setThemePreset(qrData.business.theme_preset);
        }
        if (
          !settingsDirtyRef.current &&
          qrData.business.primary_color !== undefined
        ) {
          setPrimaryColor(qrData.business.primary_color);
        }
      }
      if (repRes.ok && repData.summary) {
        setOrderStats({
          ...repData.summary,
          topItems: repData.topItems || [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveOrderSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      const res = await fetch("/api/staff/qr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderPrefix,
          taxPercentage: Number(taxPercentage),
          orderExpiryMinutes: Number(orderExpiryMinutes),
          requireTableNumber,
          themePreset,
          primaryColor,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        settingsDirtyRef.current = false;
        setSettingsSaved(true);
        if (data.business) {
          setBusiness((prev) => ({ ...prev, ...data.business }));
          if (data.business.order_prefix) {
            setOrderPrefix(data.business.order_prefix);
          }
          if (data.business.require_table_number !== undefined) {
            setRequireTableNumber(Boolean(data.business.require_table_number));
          }
          if (data.business.theme_preset !== undefined) {
            setThemePreset(data.business.theme_preset);
          }
          if (data.business.primary_color !== undefined) {
            setPrimaryColor(data.business.primary_color);
          }
        }
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCat(true);
    setFormError(null);
    try {
      const res = await fetch("/api/staff/menu/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catName,
          description: catDesc,
          sortOrder: Number(catSort) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create category.");
        return;
      }
      setCatName("");
      setCatDesc("");
      setShowCatModal(false);
      await loadAll();
    } finally {
      setCreatingCat(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingItem(true);
    setFormError(null);
    try {
      // Parse comma-separated variants like "Regular:0, Large:50"
      const variants = itemVariantsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((pair) => {
          const [n, p] = pair.split(":");
          return {
            name: (n || "").trim(),
            priceDelta: Number((p || "0").trim()) || 0,
          };
        })
        .filter((v) => v.name.length > 0);

      // Parse comma-separated add-ons like "Extra Shot:40, Oat Milk:45"
      const addons = itemAddonsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((pair) => {
          const [n, p] = pair.split(":");
          return {
            name: (n || "").trim(),
            price: Number((p || "0").trim()) || 0,
          };
        })
        .filter((a) => a.name.length > 0);

      const res = await fetch("/api/staff/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: itemCategoryId,
          name: itemName,
          description: itemDesc,
          price: Number(itemPrice),
          loyaltyMultiplier: Number(itemMultiplier) || 1,
          isAvailable: true,
          isVisible: true,
          variants,
          addons,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to add menu item.");
        return;
      }
      setItemName("");
      setItemDesc("");
      setItemPrice("");
      setItemMultiplier("1");
      setItemVariantsText("");
      setItemAddonsText("");
      setShowItemModal(false);
      await loadAll();
    } finally {
      setCreatingItem(false);
    }
  };

  const toggleItemField = async (
    item: MenuItemRow,
    field: "isAvailable" | "isVisible",
    nextVal: boolean
  ) => {
    await fetch(`/api/staff/menu/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: nextVal }),
    });
    await loadAll();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item from your store menu?")) return;
    await fetch(`/api/staff/menu/items/${id}`, { method: "DELETE" });
    await loadAll();
  };

  const openEditCategory = (cat: MenuCategory) => {
    setFormError(null);
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || "");
    setEditCatSort(String(cat.sort_order ?? 1));
    setEditCatStatus(cat.status === "inactive" ? "inactive" : "active");
  };

  const handleSaveCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    setSavingCatEdit(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/staff/menu/categories/${editingCat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCatName,
          description: editCatDesc,
          sortOrder: Number(editCatSort) || 1,
          status: editCatStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update category.");
        return;
      }
      setEditingCat(null);
      await loadAll();
    } finally {
      setSavingCatEdit(false);
    }
  };

  const toggleCategoryStatus = async (cat: MenuCategory) => {
    const nextStatus = cat.status === "inactive" ? "active" : "inactive";
    await fetch(`/api/staff/menu/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadAll();
  };

  const moveCategoryOrder = async (
    catIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? catIndex - 1 : catIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const currentCat = categories[catIndex];
    const swapCat = categories[targetIndex];
    await Promise.all([
      fetch(`/api/staff/menu/categories/${currentCat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: targetIndex + 1 }),
      }),
      fetch(`/api/staff/menu/categories/${swapCat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: catIndex + 1 }),
      }),
    ]);
    await loadAll();
  };

  const openDeleteCategory = (cat: MenuCategory) => {
    setFormError(null);
    setDeletingCat(cat);
    const otherCats = categories.filter((c) => c.id !== cat.id);
    setMoveItemsToCatId(otherCats.length > 0 ? otherCats[0].id : "");
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCat) return;
    setDeletingCatLoading(true);
    setFormError(null);
    try {
      const query = moveItemsToCatId
        ? `?moveItemsToCategoryId=${encodeURIComponent(moveItemsToCatId)}`
        : "";
      const res = await fetch(
        `/api/staff/menu/categories/${deletingCat.id}${query}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to remove category.");
        return;
      }
      setDeletingCat(null);
      await loadAll();
    } finally {
      setDeletingCatLoading(false);
    }
  };

  const openEditItem = (item: MenuItemRow) => {
    setFormError(null);
    setEditingItem(item);
    setEditItemCatId(item.category_id);
    setEditItemName(item.name);
    setEditItemDesc(item.description || "");
    setEditItemPrice(String(item.price));
    setEditItemMultiplier(String(item.loyalty_multiplier ?? 1));
  };

  const handleSaveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingItemEdit(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/staff/menu/items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editItemCatId,
          name: editItemName,
          description: editItemDesc,
          price: Number(editItemPrice),
          loyaltyMultiplier: Number(editItemMultiplier) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update menu item.");
        return;
      }
      setEditingItem(null);
      await loadAll();
    } finally {
      setSavingItemEdit(false);
    }
  };

  const handleExportCurrentMenuJson = () => {
    const exported = {
      mode: bulkImportMode,
      orderPrefix: orderPrefix || "SNB",
      categories: categories.map((cat, idx) => ({
        name: cat.name,
        description: cat.description || undefined,
        sortOrder: cat.sort_order ?? idx + 1,
        items: items
          .filter((i) => i.category_id === cat.id)
          .map((item) => ({
            name: item.name,
            description: item.description || undefined,
            price: Number(item.price),
            loyaltyMultiplier: Number(item.loyalty_multiplier ?? 1),
            isAvailable: item.is_available,
            isVisible: item.is_visible,
            variants: (item.variants || []).map((v) => ({
              name: v.name,
              priceDelta: Number(v.price_delta),
            })),
            addons: (item.addons || []).map((a) => ({
              name: a.name,
              price: Number(a.price),
            })),
          })),
      })),
    };
    setBulkJsonText(JSON.stringify(exported, null, 2));
    setFormError(null);
    setBulkSuccessMsg(null);
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setBulkSuccessMsg(null);

    let parsedJson: Record<string, unknown>;
    try {
      // Strip optional markdown code fences if user pasted directly from AI chat
      const cleaned = bulkJsonText
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      parsedJson = JSON.parse(cleaned);
    } catch {
      setFormError(
        "Invalid JSON format. Make sure you pasted valid JSON without extra text."
      );
      return;
    }

    setImportingBulk(true);
    try {
      const res = await fetch("/api/staff/menu/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsedJson,
          mode: bulkImportMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to import menu JSON.");
        return;
      }
      setBulkSuccessMsg(
        `Imported ${data.categoriesCreated} categories and ${data.itemsCreated} menu items!`
      );
      await loadAll();
    } finally {
      setImportingBulk(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Store QR Code & Digital Menu Manager
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Print your single generic Store QR code for counter/table ordering and manage categories, item availability, and bonus point multipliers.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormError(null);
              setBulkSuccessMsg(null);
              if (!bulkJsonText) {
                setBulkJsonText(
                  JSON.stringify(SCOOP_N_BREW_MENU_PRESET, null, 2)
                );
              }
              setShowBulkImportModal(true);
            }}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Bulk Import / AI Menu
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormError(null);
              setShowManageCategoriesModal(true);
            }}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Manage Categories ({categories.length})
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormError(null);
              setCatSort(String(categories.length + 1));
              setShowCatModal(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Category
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setShowItemModal(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Store QR Code & Ordering Settings Row */}
      {qrInfo && business && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generic Store QR Standee Card */}
          <Card className="p-6 flex flex-col items-center text-center space-y-4">
            <Badge variant="warning">Generic Store QR Code (Dynamic)</Badge>
            <h2 className="text-lg font-bold">{business.name}</h2>
            <p className="text-xs text-zinc-500">
              Scan to Register with Phone, Order from Menu & Earn Loyalty Points
            </p>
            <div className="p-3 bg-white border border-stone-300 rounded-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrInfo.qrDataUrl}
                alt={`Store QR code for ${business.name}`}
                className="w-44 h-44"
              />
            </div>

            <div className="w-full flex items-center gap-1.5 bg-stone-100 dark:bg-zinc-800 px-3 py-2 rounded-sm text-xs font-mono">
              <span className="truncate flex-1 text-left">
                {qrInfo.publicUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qrInfo.publicUrl);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="text-terracotta-600 font-sans font-semibold shrink-0 flex items-center gap-1"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 pt-1 print:hidden">
              <a
                href="/api/staff/qr?format=png"
                className="py-2 px-3 rounded-sm border border-stone-300 dark:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                <Download className="w-3.5 h-3.5" />
                PNG
              </a>
              <a
                href="/api/staff/qr?format=svg"
                className="py-2 px-3 rounded-sm border border-stone-300 dark:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                <Download className="w-3.5 h-3.5" />
                SVG
              </a>
              <Link
                href={`/s/${business.slug}`}
                target="_blank"
                className="py-2 px-3 rounded-sm bg-zinc-900 text-white dark:bg-stone-100 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Store Page
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3 rounded-sm border border-stone-300 dark:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Standee
              </button>
            </div>
          </Card>

          {/* Order Number Prefix, Tax & Expiry Config */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold">
                Counter Token & Tax Configuration
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure how order tokens (e.g. {orderPrefix || business?.order_prefix || "SNB"}-1001) and taxes are calculated server-side.
              </p>
            </div>
            <form onSubmit={handleSaveOrderSettings} className="space-y-3.5">
              <Input
                label="Order Number Prefix (2–5 chars)"
                value={orderPrefix}
                onChange={(e) => {
                  settingsDirtyRef.current = true;
                  setOrderPrefix(
                    e.target.value
                      .replace(/[^a-zA-Z0-9]/g, "")
                      .toUpperCase()
                      .slice(0, 5)
                  );
                }}
                placeholder={business?.order_prefix || "e.g. SNB"}
                required
              />
              <Input
                label="GST / Tax Percentage (%)"
                type="number"
                step="0.01"
                value={taxPercentage}
                onChange={(e) => {
                  settingsDirtyRef.current = true;
                  setTaxPercentage(e.target.value);
                }}
                required
              />
              <Input
                label="Unconfirmed Order Expiry Window (Minutes)"
                type="number"
                value={orderExpiryMinutes}
                onChange={(e) => {
                  settingsDirtyRef.current = true;
                  setOrderExpiryMinutes(e.target.value);
                }}
                required
              />

              <div className="pt-1 flex items-start gap-2.5">
                <input
                  id="requireTableNumber"
                  type="checkbox"
                  checked={requireTableNumber}
                  onChange={(e) => {
                    settingsDirtyRef.current = true;
                    setRequireTableNumber(e.target.checked);
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 text-zinc-900 focus:ring-zinc-900 accent-terracotta-600 cursor-pointer"
                />
                <label
                  htmlFor="requireTableNumber"
                  className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none"
                >
                  <span className="font-semibold block">
                    Require Table Number for Dine-In Orders
                  </span>
                  <span className="text-zinc-500 block text-[11px] mt-0.5">
                    When unchecked, customers can place Dine-In orders without being forced to enter a table number.
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                  Customer Ordering Page Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: "rose",
                      name: "Rose Pink (Scoop n Brew)",
                      color: "#E11D48",
                    },
                    {
                      id: "coffee",
                      name: "Warm Terracotta / Coffee",
                      color: "#C2410C",
                    },
                    {
                      id: "mint",
                      name: "Fresh Mint & Matcha",
                      color: "#059669",
                    },
                    {
                      id: "mono",
                      name: "Modern Monochrome",
                      color: "#18181B",
                    },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        settingsDirtyRef.current = true;
                        setThemePreset(preset.id);
                        setPrimaryColor(preset.color);
                      }}
                      className={`p-2.5 rounded-sm border text-left flex items-center gap-2 transition-all text-xs ${
                        themePreset === preset.id
                          ? "ring-2 ring-zinc-900 dark:ring-white border-zinc-900 dark:border-white font-bold bg-stone-50 dark:bg-zinc-800"
                          : "border-stone-200 dark:border-zinc-800 hover:border-zinc-400 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/10"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                {settingsSaved ? (
                  <span className="text-xs font-semibold text-emerald-600">
                    Settings saved!
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" size="sm" disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save Order Settings"}
                </Button>
              </div>
            </form>
          </Card>

          {/* QR Ordering Performance Summary (RPT-01..03) */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold">
                QR Ordering & Loyalty Metrics
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Real-time conversion from your store QR code.
              </p>
            </div>

            {orderStats && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-sm bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800">
                    <p className="text-[11px] uppercase text-zinc-500">
                      Paid QR Revenue
                    </p>
                    <p className="text-lg font-extrabold tabular-nums mt-0.5">
                      {formatCurrency(
                        orderStats.paidRevenue,
                        business.currency
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-sm bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800">
                    <p className="text-[11px] uppercase text-zinc-500">
                      Points Credited
                    </p>
                    <p className="text-lg font-extrabold tabular-nums text-terracotta-600 mt-0.5">
                      {orderStats.totalPointsIssued} pts
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Top Selling Menu Items
                  </p>
                  {orderStats.topItems.length === 0 ? (
                    <p className="text-xs text-zinc-500">No orders yet.</p>
                  ) : (
                    <div className="divide-y divide-stone-200 dark:divide-zinc-800 text-xs">
                      {orderStats.topItems.slice(0, 4).map((t) => (
                        <div
                          key={t.itemName}
                          className="py-1.5 flex items-center justify-between"
                        >
                          <span className="truncate font-medium">
                            {t.itemName}
                          </span>
                          <span className="tabular-nums font-bold shrink-0 ml-2">
                            {t.totalQuantity} sold
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Categories & Menu Items Table */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 bg-stone-200 dark:bg-zinc-900 animate-pulse rounded-sm"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <Utensils className="w-10 h-10 text-zinc-400 mx-auto" />
            <h3 className="text-base font-bold">No menu categories yet</h3>
            <p className="text-xs text-zinc-500">
              Create your first category (e.g. Filter Coffee, Bakery, Cold Brews) to start adding items.
            </p>
            <Button onClick={() => setShowCatModal(true)}>
              Create First Category
            </Button>
          </Card>
        ) : (
          categories.map((cat, catIndex) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            const isHiddenCat = cat.status === "inactive";
            return (
              <Card key={cat.id} className="overflow-hidden">
                <div className="p-4 bg-stone-100 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base">{cat.name}</h3>
                      <Badge variant="neutral">{catItems.length} items</Badge>
                      {isHiddenCat && (
                        <Badge variant="warning">Hidden from Menu</Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-zinc-500">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      disabled={catIndex === 0}
                      onClick={() => moveCategoryOrder(catIndex, "up")}
                      className="p-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 disabled:opacity-40"
                      title="Move category up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={catIndex === categories.length - 1}
                      onClick={() => moveCategoryOrder(catIndex, "down")}
                      className="p-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 disabled:opacity-40"
                      title="Move category down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCategoryStatus(cat)}
                      className="p-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                      title={
                        isHiddenCat
                          ? "Show category on customer menu"
                          : "Hide category from customer menu"
                      }
                    >
                      {isHiddenCat ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCategory(cat)}
                      className="px-2.5 py-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 flex items-center gap-1"
                      title="Edit category name or description"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteCategory(cat)}
                      className="px-2.5 py-1.5 rounded-sm border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-950 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
                      title="Remove category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setFormError(null);
                        setItemCategoryId(cat.id);
                        setShowItemModal(true);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {catItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    No items in this category yet.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200 dark:divide-zinc-800">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">
                              {item.name}
                            </span>
                            <span className="font-bold text-sm tabular-nums text-terracotta-600">
                              {formatCurrency(item.price, item.currency)}
                            </span>
                            {item.loyalty_multiplier > 1 && (
                              <Badge variant="warning">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {item.loyalty_multiplier}x Points
                              </Badge>
                            )}
                            {!item.is_available && (
                              <Badge variant="danger">Sold Out</Badge>
                            )}
                            {!item.is_visible && (
                              <Badge variant="neutral">Hidden</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              {item.description}
                            </p>
                          )}
                          {((item.variants?.length || 0) > 0 ||
                            (item.addons?.length || 0) > 0) && (
                            <p className="text-[11px] text-zinc-500">
                              {item.variants?.length > 0 &&
                                `Variants: ${item.variants
                                  .map((v) => v.name)
                                  .join(", ")} `}
                              {item.addons?.length > 0 &&
                                `• Add-ons: ${item.addons
                                  .map((a) => a.name)
                                  .join(", ")}`}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              toggleItemField(
                                item,
                                "isAvailable",
                                !item.is_available
                              )
                            }
                            className={`px-2.5 py-1.5 rounded-sm text-xs font-semibold border ${
                              item.is_available
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                                : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {item.is_available ? "In Stock" : "Sold Out"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditItem(item)}
                            className="p-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                            title="Edit menu item or move to another category"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleItemField(
                                item,
                                "isVisible",
                                !item.is_visible
                              )
                            }
                            className="p-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                            title={
                              item.is_visible
                                ? "Hide from customer menu"
                                : "Show on customer menu"
                            }
                          >
                            {item.is_visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete menu item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Manage Categories Modal */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 bg-white dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold">Manage Menu Categories</h3>
                <p className="text-xs text-zinc-500">
                  Add, rename, reorder, hide, or remove categories from your digital store menu.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setFormError(null);
                    setCatSort(String(categories.length + 1));
                    setShowCatModal(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Category
                </Button>
                <button
                  type="button"
                  onClick={() => setShowManageCategoriesModal(false)}
                  className="p-1.5 rounded-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No categories found. Click &ldquo;Add Category&rdquo; to create your first category.
              </div>
            ) : (
              <div className="divide-y divide-stone-200 dark:divide-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-sm">
                {categories.map((cat, idx) => {
                  const count = items.filter(
                    (i) => i.category_id === cat.id
                  ).length;
                  const isHidden = cat.status === "inactive";
                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-zinc-400">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-sm">{cat.name}</span>
                          <Badge variant="neutral">{count} items</Badge>
                          {isHidden ? (
                            <Badge variant="warning">Hidden</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </div>
                        {cat.description && (
                          <p className="text-xs text-zinc-500">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCategoryOrder(idx, "up")}
                          className="p-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 disabled:opacity-40"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categories.length - 1}
                          onClick={() => moveCategoryOrder(idx, "down")}
                          className="p-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 disabled:opacity-40"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCategoryStatus(cat)}
                          className="px-2.5 py-1 rounded-sm border border-stone-300 dark:border-zinc-700 text-xs font-semibold"
                        >
                          {isHidden ? "Show" : "Hide"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditCategory(cat)}
                          className="px-2.5 py-1 rounded-sm border border-stone-300 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Rename / Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteCategory(cat)}
                          className="px-2.5 py-1 rounded-sm border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowManageCategoriesModal(false)}
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-bold">Create Menu Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <Input
                label="Category Name"
                placeholder="e.g., Artisanal Bakehouse"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
              <Input
                label="Description (Optional)"
                placeholder="e.g., Freshly baked sourdough viennoiserie"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
              <Input
                label="Display Sort Order"
                type="number"
                value={catSort}
                onChange={(e) => setCatSort(e.target.value)}
              />
              {formError && (
                <p className="text-xs text-red-600">{formError}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCatModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingCat}>
                  {creatingCat ? "Creating..." : "Create Category"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-bold">Edit Category</h3>
            <form onSubmit={handleSaveCategoryEdit} className="space-y-3.5">
              <Input
                label="Category Name"
                value={editCatName}
                onChange={(e) => setEditCatName(e.target.value)}
                required
              />
              <Input
                label="Description (Optional)"
                value={editCatDesc}
                onChange={(e) => setEditCatDesc(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Display Sort Order"
                  type="number"
                  value={editCatSort}
                  onChange={(e) => setEditCatSort(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Visibility Status
                  </label>
                  <select
                    value={editCatStatus}
                    onChange={(e) =>
                      setEditCatStatus(
                        e.target.value as "active" | "inactive"
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Hidden from Menu</option>
                  </select>
                </div>
              </div>
              {formError && (
                <p className="text-xs text-red-600">{formError}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingCat(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingCatEdit}>
                  {savingCatEdit ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete / Remove Category Confirmation Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-red-600">
              Remove Category: {deletingCat.name}
            </h3>
            {(() => {
              const catItemsCount = items.filter(
                (i) => i.category_id === deletingCat.id
              ).length;
              const otherCats = categories.filter(
                (c) => c.id !== deletingCat.id
              );

              return (
                <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                  {catItemsCount === 0 ? (
                    <p>
                      This category has <strong>0 items</strong>. Are you sure
                      you want to remove <strong>{deletingCat.name}</strong>?
                    </p>
                  ) : (
                    <>
                      <p>
                        This category currently contains{" "}
                        <strong>{catItemsCount} menu item(s)</strong>. Choose
                        what should happen to those items when this category is
                        removed:
                      </p>
                      {otherCats.length > 0 ? (
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                            Item Handling Option
                          </label>
                          <select
                            value={moveItemsToCatId}
                            onChange={(e) =>
                              setMoveItemsToCatId(e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          >
                            {otherCats.map((c) => (
                              <option key={c.id} value={c.id}>
                                Move {catItemsCount} item(s) to &ldquo;{c.name}
                                &rdquo;
                              </option>
                            ))}
                            <option value="">
                              Delete all {catItemsCount} item(s) with this
                              category
                            </option>
                          </select>
                        </div>
                      ) : (
                        <p className="text-red-600 font-medium">
                          There are no other categories to move items into.
                          Removing this category will also delete its{" "}
                          {catItemsCount} menu item(s).
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {formError && <p className="text-xs text-red-600">{formError}</p>}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingCat(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deletingCatLoading}
                onClick={handleConfirmDeleteCategory}
              >
                {deletingCatLoading ? "Removing..." : "Confirm Remove Category"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 bg-white dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">Add Store Menu Item</h3>
            <form onSubmit={handleCreateItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Category
                </label>
                <select
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Item Name"
                placeholder="e.g., Sourdough Almond Croissant"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />

              <Input
                label="Description"
                placeholder="e.g., Twice-baked laminated croissant with roasted almond cream"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price (INR)"
                  type="number"
                  step="0.01"
                  placeholder="240"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  required
                />
                <Input
                  label="Loyalty Points Multiplier"
                  type="number"
                  step="0.25"
                  placeholder="1.0"
                  value={itemMultiplier}
                  onChange={(e) => setItemMultiplier(e.target.value)}
                />
              </div>

              <Input
                label="Variants (Optional — format: Name:PriceDelta, Name:PriceDelta)"
                placeholder="e.g., Regular:0, Large Tumbler:50"
                value={itemVariantsText}
                onChange={(e) => setItemVariantsText(e.target.value)}
              />

              <Input
                label="Add-Ons (Optional — format: Name:Price, Name:Price)"
                placeholder="e.g., Extra Espresso Shot:40, Oat Milk:45"
                value={itemAddonsText}
                onChange={(e) => setItemAddonsText(e.target.value)}
              />

              {formError && (
                <p className="text-xs text-red-600">{formError}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowItemModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingItem}>
                  {creatingItem ? "Adding Item..." : "Save Menu Item"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 bg-white dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">Edit Menu Item</h3>
            <form onSubmit={handleSaveItemEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Category
                </label>
                <select
                  value={editItemCatId}
                  onChange={(e) => setEditItemCatId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Item Name"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                required
              />

              <Input
                label="Description"
                value={editItemDesc}
                onChange={(e) => setEditItemDesc(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price (INR)"
                  type="number"
                  step="0.01"
                  value={editItemPrice}
                  onChange={(e) => setEditItemPrice(e.target.value)}
                  required
                />
                <Input
                  label="Loyalty Points Multiplier"
                  type="number"
                  step="0.25"
                  value={editItemMultiplier}
                  onChange={(e) => setEditItemMultiplier(e.target.value)}
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600">{formError}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingItemEdit}>
                  {savingItemEdit ? "Saving..." : "Save Item Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Bulk Import / AI Menu Loader Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-6 space-y-4 bg-white dark:bg-zinc-900 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-terracotta-600" />
                  Bulk Import / AI Menu JSON Loader
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Convert any menu photo or text into JSON using AI, or load a preset / upload a JSON file to populate all categories, items, variants, and add-ons in one click.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="p-1.5 rounded-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 bg-stone-50 dark:bg-zinc-950 p-3 rounded-sm border border-stone-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(AI_MENU_EXTRACTION_PROMPT);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2500);
                }}
                className="px-3 py-1.5 rounded-sm bg-zinc-900 text-white dark:bg-stone-100 dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied AI Prompt! Paste in ChatGPT/Gemini with Menu Image
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    1. Copy AI Prompt (for ChatGPT / Gemini / Claude)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkJsonText(
                    JSON.stringify(SCOOP_N_BREW_MENU_PRESET, null, 2)
                  );
                  setFormError(null);
                  setBulkSuccessMsg(null);
                }}
                className="px-3 py-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                Load &ldquo;Scoop n Brew&rdquo; Full Menu Preset
              </button>

              <button
                type="button"
                onClick={handleExportCurrentMenuJson}
                className="px-3 py-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                Export Current Store Menu JSON
              </button>

              <label className="px-3 py-1.5 rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Upload .json File
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setBulkJsonText(reader.result);
                        setFormError(null);
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  2. Paste AI-Generated Menu JSON Below
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500 font-medium">Import Mode:</span>
                  <select
                    value={bulkImportMode}
                    onChange={(e) =>
                      setBulkImportMode(e.target.value as "replace" | "merge")
                    }
                    className="px-2.5 py-1 rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-semibold"
                  >
                    <option value="replace">
                      Replace Entire Menu (Clean Slate)
                    </option>
                    <option value="merge">
                      Merge / Append into Existing Categories
                    </option>
                  </select>
                </div>
              </div>

              <textarea
                rows={14}
                value={bulkJsonText}
                onChange={(e) => setBulkJsonText(e.target.value)}
                placeholder='{"categories": [{"name": "Mojitos", "items": [{"name": "Watermelon Mojito", "price": 99}]}]}'
                className="w-full p-3 font-mono text-xs rounded-sm border border-stone-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-terracotta-600"
                required
              />

              {formError && (
                <p className="text-xs font-semibold text-red-600">{formError}</p>
              )}
              {bulkSuccessMsg && (
                <p className="text-xs font-semibold text-emerald-600">
                  {bulkSuccessMsg}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-zinc-500">
                  Supports categories, items, variants (priceDelta), and add-ons (e.g. With Kulhad +10).
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowBulkImportModal(false)}
                  >
                    Close
                  </Button>
                  <Button type="submit" disabled={importingBulk}>
                    {importingBulk ? "Importing Menu..." : "Import Menu Now"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

