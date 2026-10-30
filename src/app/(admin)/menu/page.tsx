"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Printer,
  QrCode,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { formatCurrency } from "@/lib/utils";

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
  const [orderPrefix, setOrderPrefix] = useState("ARK");
  const [taxPercentage, setTaxPercentage] = useState("5");
  const [orderExpiryMinutes, setOrderExpiryMinutes] = useState("20");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // New Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSort, setCatSort] = useState("1");
  const [creatingCat, setCreatingCat] = useState(false);

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
        if (menuData.categories?.length > 0 && !itemCategoryId) {
          setItemCategoryId(menuData.categories[0].id);
        }
      }
      if (qrRes.ok) {
        setQrInfo(qrData.qr);
        setBusiness(qrData.business);
        setOrderPrefix(qrData.business?.order_prefix || "ARK");
        setTaxPercentage(String(qrData.business?.tax_percentage ?? 5));
        setOrderExpiryMinutes(
          String(qrData.business?.order_expiry_minutes ?? 20)
        );
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
  }, [itemCategoryId]);

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
        }),
      });
      if (res.ok) {
        setSettingsSaved(true);
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
            onClick={() => setShowCatModal(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Category
          </Button>
          <Button size="sm" onClick={() => setShowItemModal(true)}>
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
                Configure how order tokens (e.g. ARK-1001) and taxes are calculated server-side.
              </p>
            </div>
            <form onSubmit={handleSaveOrderSettings} className="space-y-3.5">
              <Input
                label="Order Number Prefix (2–5 chars)"
                value={orderPrefix}
                onChange={(e) => setOrderPrefix(e.target.value.toUpperCase())}
                placeholder="ARK"
                required
              />
              <Input
                label="GST / Tax Percentage (%)"
                type="number"
                step="0.01"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                required
              />
              <Input
                label="Unconfirmed Order Expiry Window (Minutes)"
                type="number"
                value={orderExpiryMinutes}
                onChange={(e) => setOrderExpiryMinutes(e.target.value)}
                required
              />
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
          categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            return (
              <Card key={cat.id} className="overflow-hidden">
                <div className="p-4 bg-stone-100 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-xs text-zinc-500">{cat.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setItemCategoryId(cat.id);
                      setShowItemModal(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Item to {cat.name}
                  </Button>
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
    </div>
  );
}

