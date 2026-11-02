"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Check,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  Camera,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Gift,
  Upload,
  RotateCcw,
  Search,
  LayoutGrid,
  List,
  ExternalLink,
} from "lucide-react";
import {
  StatusBadge,
  EmptyState,
  ConfirmModal,
  Badge,
  Button,
  Card,
  Input,
} from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RewardItem {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_required: number;
  monetary_value: number | string;
  stock_limit: number | null;
  redeemed_count: number;
  status: "active" | "inactive";
  sort_order: number;
  created_at: string;
  updated_at: string;
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

const REWARD_IMAGE_PRESETS: {
  name: string;
  url: string;
  badge: string;
}[] = [
  {
    name: "Regular Chai",
    url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
    badge: "Hot Aromatic Chai",
  },
  {
    name: "Plain Coffee",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    badge: "Filter Coffee Crema",
  },
  {
    name: "Free Pastry / Croissant",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
    badge: "Fresh Butter Croissant",
  },
  {
    name: "₹50 Off Bill Voucher",
    url: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80",
    badge: "Store Discount Pass",
  },
  {
    name: "Peri Peri Fries",
    url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    badge: "Crispy Spicy Fries",
  },
  {
    name: "Handcrafted Mojito",
    url: "/images/menu/watermelon-mojito.jpg",
    badge: "Scoop N Brew Original",
  },
  {
    name: "Chocolate Waffle",
    url: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80",
    badge: "Warm Chocolate Drizzle",
  },
  {
    name: "Biscoff Waffle",
    url: "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=600&auto=format&fit=crop&q=80",
    badge: "Lotus Biscoff Spread",
  },
  {
    name: "Watermelon Mojito",
    url: "/images/menu/watermelon-mojito.jpg",
    badge: "Scoop N Brew Original",
  },
  {
    name: "Blueberry Mojito",
    url: "/images/menu/blueberry-mojito.jpg",
    badge: "Scoop N Brew Original",
  },
  {
    name: "Iced Tea",
    url: "/images/menu/iced-tea.jpg",
    badge: "Scoop N Brew Original",
  },
  {
    name: "Peach Tea",
    url: "/images/menu/peach-tea.jpg",
    badge: "Scoop N Brew Original",
  },
  {
    name: "Free Beverage / Shake",
    url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
    badge: "Cold Thickshake",
  },
  {
    name: "Exclusive Merchandise",
    url: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&auto=format&fit=crop&q=80",
    badge: "Cafe Bag & Tumbler",
  },
];

export default function RewardsAndRedemptionsPage() {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [role, setRole] = useState("owner");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // View mode & filters
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "custom_photo"
  >("all");

  // Create reward state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsRequired, setPointsRequired] = useState("100");
  const [monetaryValue, setMonetaryValue] = useState("50");
  const [stockLimit, setStockLimit] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit Reward State
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPoints, setEditPoints] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [editSortOrder, setEditSortOrder] = useState("10");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Reward State
  const [deletingReward, setDeletingReward] = useState<RewardItem | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Dedicated Photo Modal State
  const [imageModalReward, setImageModalReward] = useState<RewardItem | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState("");
  const [imageModalUploading, setImageModalUploading] = useState(false);
  const [imageModalSaving, setImageModalSaving] = useState(false);
  const [imageModalError, setImageModalError] = useState<string | null>(null);
  const [imageModalTab, setImageModalTab] = useState<
    "presets" | "upload" | "url"
  >("presets");

  // Cancel/Reject redemption modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rwRes, rdRes] = await Promise.all([
        fetch("/api/rewards"),
        fetch("/api/redemptions"),
      ]);
      const rwJson = await rwRes.json();
      const rdJson = await rdRes.json();
      if (rwRes.ok) {
        const sorted = (rwJson.rewards || []).sort(
          (a: RewardItem, b: RewardItem) =>
            (a.sort_order ?? 100) - (b.sort_order ?? 100)
        );
        setRewards(sorted);
        setRole(rwJson.role || "owner");
      }
      if (rdRes.ok) {
        setRedemptions(rdJson.redemptions || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Filtered rewards
  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesDesc = (r.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      if (statusFilter === "active") return r.status === "active";
      if (statusFilter === "inactive") return r.status === "inactive";
      if (statusFilter === "custom_photo") {
        return Boolean(r.image_url && r.image_url.trim().length > 0);
      }
      return true;
    });
  }, [rewards, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = rewards.length;
    const active = rewards.filter((r) => r.status === "active").length;
    const customPhotos = rewards.filter(
      (r) => Boolean(r.image_url && r.image_url.trim().length > 0)
    ).length;
    return { total, active, customPhotos };
  }, [rewards]);

  async function handleCreateReward(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setCreating(true);

    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          pointsRequired: Number(pointsRequired),
          monetaryValue: Number(monetaryValue),
          stockLimit: stockLimit ? Number(stockLimit) : null,
          imageUrl: imageUrl.trim() || null,
          sortOrder: sortOrder ? Number(sortOrder) : (rewards.length + 1) * 10,
          status: "active",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Could not create reward.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `Reward "${json.reward.name}" published to customer cards.`,
        });
        setName("");
        setDescription("");
        setStockLimit("");
        setImageUrl("");
        setSortOrder("");
        setShowAddForm(false);
        await loadAll();
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleRewardStatus(rewardId: string, currentStatus: string) {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    const res = await fetch(`/api/rewards/${rewardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      setRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? { ...r, status: nextStatus } : r))
      );
      await loadAll();
    }
  }

  // Reordering: Move reward Up or Down
  const moveRewardOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rewards.length) return;

    const currentReward = rewards[index];
    const targetReward = rewards[targetIndex];

    const currentOrder = currentReward.sort_order ?? (index + 1) * 10;
    const targetOrder = targetReward.sort_order ?? (targetIndex + 1) * 10;

    let newCurrentOrder = targetOrder;
    let newTargetOrder = currentOrder;

    if (newCurrentOrder === newTargetOrder) {
      newCurrentOrder = direction === "up" ? currentOrder - 5 : currentOrder + 5;
    }

    // Optimistically update
    const updated = [...rewards];
    updated[index] = { ...currentReward, sort_order: newCurrentOrder };
    updated[targetIndex] = { ...targetReward, sort_order: newTargetOrder };
    setRewards(
      updated.sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100))
    );

    try {
      await Promise.all([
        fetch(`/api/rewards/${currentReward.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: newCurrentOrder }),
        }),
        fetch(`/api/rewards/${targetReward.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: newTargetOrder }),
        }),
      ]);
      await loadAll();
    } catch {
      setFeedback({
        type: "error",
        text: "Failed to persist arrangement.",
      });
    }
  };

  // Open Edit Modal
  const openEditReward = (reward: RewardItem) => {
    setEditingReward(reward);
    setEditName(reward.name);
    setEditDesc(reward.description || "");
    setEditPoints(String(reward.points_required));
    setEditValue(String(reward.monetary_value));
    setEditStock(reward.stock_limit ? String(reward.stock_limit) : "");
    setEditStatus(reward.status);
    setEditSortOrder(String(reward.sort_order ?? 100));
    setEditImageUrl(reward.image_url || "");
    setEditError(null);
  };

  const handleSaveRewardEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/rewards/${editingReward.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
          pointsRequired: Number(editPoints),
          monetaryValue: Number(editValue),
          stockLimit: editStock ? Number(editStock) : null,
          status: editStatus,
          sortOrder: Number(editSortOrder) || 100,
          imageUrl: editImageUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update reward.");
        return;
      }
      setEditingReward(null);
      await loadAll();
      setFeedback({
        type: "success",
        text: `Reward "${editName}" updated successfully.`,
      });
    } catch {
      setEditError("Failed to save reward changes. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Reward
  const handleDeleteReward = async () => {
    if (!deletingReward) return;
    setDeletingLoading(true);
    try {
      const res = await fetch(`/api/rewards/${deletingReward.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        setFeedback({
          type: "error",
          text: json.error || "Failed to delete reward.",
        });
      } else {
        setFeedback({
          type: "success",
          text: `Reward "${deletingReward.name}" removed from catalog.`,
        });
        setDeletingReward(null);
        await loadAll();
      }
    } finally {
      setDeletingLoading(false);
    }
  };

  // Open Photo Modal
  const openPhotoModal = (reward: RewardItem) => {
    setImageModalReward(reward);
    setImageModalUrl(reward.image_url || "");
    setImageModalError(null);
    setImageModalUploading(false);
    setImageModalSaving(false);
    setImageModalTab(reward.image_url ? "upload" : "presets");
  };

  // Upload photo file
  const handleUploadImageFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !imageModalReward) return;
    setImageModalUploading(true);
    setImageModalError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "business-assets");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setImageModalUrl(data.url);
          setImageModalUploading(false);
          return;
        }
      }

      // Canvas compression fallback (< 150KB)
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxDim = 800;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.85);
            setImageModalUrl(compressed);
            setImageModalUploading(false);
          };
          img.onerror = () => {
            setImageModalUrl(reader.result as string);
            setImageModalUploading(false);
          };
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setImageModalError("Upload issue. You can paste an image URL or choose a preset.");
      setImageModalUploading(false);
    }
  };

  const handleSavePhotoModal = async () => {
    if (!imageModalReward) return;
    setImageModalSaving(true);
    setImageModalError(null);
    try {
      const res = await fetch(`/api/rewards/${imageModalReward.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageModalUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImageModalError(data.error || "Failed to update reward photo.");
        return;
      }
      setRewards((prev) =>
        prev.map((r) =>
          r.id === imageModalReward.id
            ? { ...r, image_url: imageModalUrl.trim() || null }
            : r
        )
      );
      setImageModalReward(null);
      await loadAll();
    } catch {
      setImageModalError("Failed to save image. Please check your connection.");
    } finally {
      setImageModalSaving(false);
    }
  };

  const handleRemovePhotoModal = async () => {
    if (!imageModalReward) return;
    setImageModalSaving(true);
    setImageModalError(null);
    try {
      const res = await fetch(`/api/rewards/${imageModalReward.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: null,
        }),
      });
      if (res.ok) {
        setRewards((prev) =>
          prev.map((r) =>
            r.id === imageModalReward.id ? { ...r, image_url: null } : r
          )
        );
        setImageModalReward(null);
        await loadAll();
      }
    } finally {
      setImageModalSaving(false);
    }
  };

  async function updateRedemptionStatus(
    redemptionId: string,
    status: "fulfilled" | "cancelled" | "rejected"
  ) {
    setFeedback(null);
    const res = await fetch("/api/redemptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        redemptionId,
        status,
        notes:
          status === "fulfilled"
            ? "Fulfilled at counter"
            : "Cancelled — balance reversed to customer card",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: json.error || "Action failed." });
    } else {
      setFeedback({
        type: "success",
        text:
          status === "fulfilled"
            ? "Reward marked as fulfilled!"
            : "Redemption cancelled and points/credit restored via reversal transaction.",
      });
      setCancelTarget(null);
      await loadAll();
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-terracotta-600" />
            <span>Rewards Catalog & Arrangement Studio</span>
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Full control over reward ordering, photos, point requirements, and fulfillment. Changes update your customer pass in real time.
          </p>
        </div>
        {(role === "owner" || role === "manager") && (
          <Button
            size="sm"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setSortOrder(String((rewards.length + 1) * 10));
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>{showAddForm ? "Hide Form" : "Add New Reward"}</span>
          </Button>
        )}
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

      {/* Create New Reward Form */}
      {showAddForm && (role === "owner" || role === "manager") && (
        <form
          onSubmit={handleCreateReward}
          className="p-5 rounded-xl bg-surface border border-border space-y-4 text-xs shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Plus className="w-4 h-4 text-terracotta-600" />
              <span>Publish New Treat to Rewards Catalog</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted hover:text-foreground text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="rw-name"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Reward Title <span className="text-red-600">*</span>
              </label>
              <input
                id="rw-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Free Pastry or Handcrafted Mojito"
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="rw-points"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Points Required <span className="text-red-600">*</span>
              </label>
              <input
                id="rw-points"
                type="number"
                min="1"
                required
                value={pointsRequired}
                onChange={(e) => setPointsRequired(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="rw-value"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Monetary Value (Worth ₹) <span className="text-red-600">*</span>
              </label>
              <input
                id="rw-value"
                type="number"
                min="0"
                required
                value={monetaryValue}
                onChange={(e) => setMonetaryValue(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label
                htmlFor="rw-desc"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Description & Terms (e.g. Qualifying order ₹149+)
              </label>
              <input
                id="rw-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Any handcrafted cooler or hot treat. (Qualifying order ₹149+)"
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>

            <div>
              <label
                htmlFor="rw-stock"
                className="block font-semibold uppercase tracking-wider text-foreground"
              >
                Stock Limit (Optional)
              </label>
              <input
                id="rw-stock"
                type="number"
                min="1"
                value={stockLimit}
                onChange={(e) => setStockLimit(e.target.value)}
                placeholder="Unlimited if blank"
                className="mt-1 w-full px-3 py-2 text-sm rounded border border-border bg-background"
              />
            </div>
          </div>

          {/* Photo & Preset input */}
          <div className="space-y-1.5 pt-1">
            <label className="block font-semibold uppercase tracking-wider text-foreground">
              Reward Photo (Optional Image URL or Preset)
            </label>
            <div className="flex gap-2.5 items-center">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800 shrink-0 border border-border shadow-2xs">
                <img
                  src={getRewardImage(name || "Reward", imageUrl)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                placeholder="e.g. /images/menu/watermelon-mojito.jpg or paste URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded border border-border bg-background"
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-xs text-red-500 hover:underline shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-terracotta-600 text-white hover:bg-terracotta-700 shadow-xs"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Publish Reward</span>
            </button>
          </div>
        </form>
      )}

      {/* Rewards Catalog Studio & Ordering Management */}
      <section className="space-y-4">
        {/* Studio Controls Card */}
        <Card className="p-4 bg-surface border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">
                Rewards Catalog ({rewards.length})
              </h2>
              <Badge variant="success">{stats.active} Active</Badge>
              <Badge variant="neutral">{stats.customPhotos} Custom Photos</Badge>
            </div>
            <p className="text-xs text-muted">
              Use the <span className="font-bold text-foreground">↑ Up</span> and <span className="font-bold text-foreground">↓ Down</span> buttons to change reward order on the customer pass.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="p-1 rounded-lg bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "visual"
                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Visual Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                  statusFilter === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-surface text-muted border-border"
                }`}
              >
                All ({rewards.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-surface text-emerald-700 border-emerald-300 dark:border-emerald-900"
                }`}
              >
                Active ({stats.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("custom_photo")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                  statusFilter === "custom_photo"
                    ? "bg-terracotta-600 text-white border-terracotta-600"
                    : "bg-surface text-terracotta-700 border-terracotta-300 dark:border-terracotta-900"
                }`}
              >
                Photo ({stats.customPhotos})
              </button>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 bg-surface border border-border rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <EmptyState
            title="No rewards match your filter"
            description="Try switching the filter to 'All' or add a new reward above."
          />
        ) : viewMode === "visual" ? (
          /* ========================================================================= */
          /* VISUAL REWARDS CARDS & ORDERING STUDIO                                    */
          /* ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRewards.map((r, index) => {
              const imgUrl = getRewardImage(r.name, r.image_url);
              const hasCustomPhoto = Boolean(
                r.image_url && r.image_url.trim().length > 0
              );

              return (
                <Card
                  key={r.id}
                  className="overflow-hidden flex flex-col group border-border hover:shadow-md transition-shadow relative"
                >
                  {/* Visual Image Header */}
                  <div className="relative h-44 w-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
                      }}
                      loading="lazy"
                    />

                    {/* Top Left: Rank & Status */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="bg-zinc-900/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                        #{index + 1}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>

                    {/* Top Right: Custom Photo or Fallback Indicator */}
                    <div className="absolute top-2.5 right-2.5">
                      {hasCustomPhoto ? (
                        <span className="bg-emerald-600/95 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Custom
                        </span>
                      ) : (
                        <span className="bg-zinc-900/75 text-zinc-200 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                          Smart Fallback
                        </span>
                      )}
                    </div>

                    {/* Hover Overlay Button to Change Photo */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <button
                        type="button"
                        onClick={() => openPhotoModal(r)}
                        className="bg-white text-zinc-900 font-extrabold text-xs px-3.5 py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-terracotta-600" />
                        Change Photo
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-foreground line-clamp-1">
                          {r.name}
                        </h4>
                        <span className="font-extrabold text-sm text-terracotta-600 dark:text-terracotta-400 tabular-nums shrink-0">
                          {r.points_required} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 min-h-[32px]">
                        {r.description ||
                          `Special reward treat at ${r.points_required} loyalty points.`}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-border">
                        <span className="font-semibold text-foreground">
                          Worth {formatCurrency(r.monetary_value)}
                        </span>
                        <span>
                          Redeemed: {r.redeemed_count}
                          {r.stock_limit ? ` / ${r.stock_limit}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar & Reorder Controls */}
                    <div className="pt-2 border-t border-border space-y-2">
                      {/* Photo Button */}
                      <button
                        type="button"
                        onClick={() => openPhotoModal(r)}
                        className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold bg-surface-elevated hover:bg-surface text-foreground flex items-center justify-center gap-1.5 transition-colors border border-border"
                      >
                        <Camera className="w-3.5 h-3.5 text-terracotta-600" />
                        <span>{hasCustomPhoto ? "Edit Photo" : "Upload / Set Photo"}</span>
                      </button>

                      {/* Arrangement Controls (Move Up/Down) & Item Actions */}
                      <div className="flex items-center justify-between gap-1.5">
                        {/* Up/Down Reorder */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveRewardOrder(index, "up")}
                            className="p-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-foreground disabled:opacity-30"
                            title="Move reward up in order"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === rewards.length - 1}
                            onClick={() => moveRewardOrder(index, "down")}
                            className="p-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-foreground disabled:opacity-30"
                            title="Move reward down in order"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Status Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleRewardStatus(r.id, r.status)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                            r.status === "active"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-border"
                          }`}
                        >
                          {r.status === "active" ? "Active" : "Inactive"}
                        </button>

                        {/* Edit & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditReward(r)}
                            className="p-1.5 rounded border border-border text-foreground hover:bg-surface-elevated"
                            title="Edit Reward Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingReward(r)}
                            className="p-1.5 rounded border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete Reward"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* COMPACT CATALOG TABLE VIEW                                                */
          /* ========================================================================= */
          <div className="border border-border bg-surface rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                    <th className="py-3 px-3 w-16 text-center">Order</th>
                    <th className="py-3 px-4">Reward & Photo</th>
                    <th className="py-3 px-4 text-right">Points</th>
                    <th className="py-3 px-4 text-right">Worth</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Redeemed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRewards.map((r, index) => {
                    const imgUrl = getRewardImage(r.name, r.image_url);
                    const hasCustomPhoto = Boolean(
                      r.image_url && r.image_url.trim().length > 0
                    );

                    return (
                      <tr key={r.id} className="hover:bg-surface-elevated/50">
                        {/* Order & Reorder Controls */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-mono font-bold text-xs text-muted w-5">
                              #{index + 1}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveRewardOrder(index, "up")}
                                className="p-0.5 rounded hover:bg-stone-200 dark:hover:bg-zinc-800 disabled:opacity-30"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === rewards.length - 1}
                                onClick={() => moveRewardOrder(index, "down")}
                                className="p-0.5 rounded hover:bg-stone-200 dark:hover:bg-zinc-800 disabled:opacity-30"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Thumbnail & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openPhotoModal(r)}
                              className="relative w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 group shadow-2xs"
                              title="Click to change photo"
                            >
                              <img
                                src={imgUrl}
                                alt={r.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Camera className="w-3.5 h-3.5" />
                              </div>
                            </button>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground">
                                  {r.name}
                                </span>
                                {hasCustomPhoto && (
                                  <Badge variant="success">Photo</Badge>
                                )}
                              </div>
                              {r.description && (
                                <p className="text-muted text-[11px] line-clamp-1">
                                  {r.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          {r.points_required} pts
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-muted">
                          {formatCurrency(r.monetary_value)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={r.status} />
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-muted">
                          {r.redeemed_count}
                          {r.stock_limit ? ` / ${r.stock_limit}` : ""}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openPhotoModal(r)}
                              className="p-1.5 rounded border border-border text-foreground hover:bg-surface"
                              title="Change Photo"
                            >
                              <Camera className="w-3.5 h-3.5 text-terracotta-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleRewardStatus(r.id, r.status)}
                              className="px-2 py-1 rounded border border-border text-[11px] font-medium hover:bg-surface"
                            >
                              {r.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditReward(r)}
                              className="p-1.5 rounded border border-border text-foreground hover:bg-surface"
                              title="Edit Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingReward(r)}
                              className="p-1.5 rounded border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* DEDICATED REWARD PHOTO & IMAGE MODAL                                      */}
      {/* ========================================================================= */}
      {imageModalReward && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-2xl p-5 sm:p-6 space-y-4 bg-white dark:bg-zinc-900 max-h-[92vh] overflow-y-auto shadow-2xl border-stone-200 dark:border-zinc-800">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-terracotta-600" />
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Manage Photo: {imageModalReward.name}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Cost: {imageModalReward.points_required} pts • Worth: {formatCurrency(imageModalReward.monetary_value)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageModalReward(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dual Live Customer Pass Preview */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                Live Customer Preview (How customers see this treat):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Preview 1: "Rewards for you" Home Card */}
                <div className="bg-[#FDF2F4] dark:bg-rose-950/30 border border-rose-100/70 dark:border-rose-900/30 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-2xs">
                  <span className="text-[9px] font-bold text-rose-600 uppercase mb-1">
                    Home &ldquo;Rewards for you&rdquo; Card
                  </span>
                  <div className="w-full h-20 rounded-xl overflow-hidden mb-2 bg-white/70 dark:bg-zinc-800/70 flex items-center justify-center p-1">
                    <img
                      src={getRewardImage(imageModalReward.name, imageModalUrl)}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
                      }}
                    />
                  </div>
                  <h4 className="text-xs font-serif font-bold text-zinc-900 dark:text-zinc-100 truncate w-full">
                    {imageModalReward.name}
                  </h4>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    at {imageModalReward.points_required} points
                  </span>
                </div>

                {/* Preview 2: "More treats to unlock" Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-rose-100 dark:border-zinc-800 shadow-2xs space-y-2">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block">
                    &ldquo;More treats to unlock&rdquo; Card
                  </span>
                  <div className="relative w-full h-24 rounded-xl overflow-hidden bg-zinc-100">
                    <img
                      src={getRewardImage(imageModalReward.name, imageModalUrl)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80";
                      }}
                    />
                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/95 text-zinc-800 shadow-xs">
                      {imageModalReward.points_required} pts
                    </span>
                  </div>
                  <p className="font-bold text-xs truncate">{imageModalReward.name}</p>
                </div>
              </div>
            </div>

            {/* Option Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setImageModalTab("presets")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  imageModalTab === "presets"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                ✨ Cafe Presets (1-Click)
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab("upload")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  imageModalTab === "upload"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                📷 Upload Photo File
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab("url")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  imageModalTab === "url"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                🔗 Paste Image URL
              </button>
            </div>

            {/* Tab 1: Presets */}
            {imageModalTab === "presets" && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">
                  Select any high-resolution photo to assign it to &ldquo;{imageModalReward.name}&rdquo;:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {REWARD_IMAGE_PRESETS.map((preset) => {
                    const isSelected = imageModalUrl === preset.url;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageModalUrl(preset.url)}
                        className={`group relative rounded-xl overflow-hidden border text-left transition-all ${
                          isSelected
                            ? "ring-2 ring-terracotta-600 border-terracotta-600 scale-[1.02]"
                            : "border-stone-200 dark:border-zinc-800 hover:border-zinc-400"
                        }`}
                      >
                        <div className="h-20 w-full bg-stone-100 dark:bg-zinc-800 relative">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-terracotta-600/30 flex items-center justify-center">
                              <span className="bg-terracotta-600 text-white rounded-full p-1 shadow-md">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-1.5 bg-white dark:bg-zinc-900">
                          <p className="font-bold text-[11px] truncate text-zinc-900 dark:text-zinc-100">
                            {preset.name}
                          </p>
                          <span className="text-[9px] text-zinc-400 block truncate">
                            {preset.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Upload */}
            {imageModalTab === "upload" && (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-stone-300 dark:border-zinc-700 hover:border-terracotta-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-stone-50/50 dark:bg-zinc-950/50">
                  <div className="p-3 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {imageModalUploading
                      ? "Processing & Optimizing Image..."
                      : "Click or drag reward photo here"}
                  </span>
                  <span className="text-xs text-zinc-500 mt-1">
                    Accepts JPG, PNG, WebP (Max 5MB). Photo is automatically optimized for mobile display.
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={imageModalUploading}
                    onChange={handleUploadImageFile}
                  />
                </label>
              </div>
            )}

            {/* Tab 3: URL */}
            {imageModalTab === "url" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Image URL or Local Relative Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageModalUrl}
                    onChange={(e) => setImageModalUrl(e.target.value)}
                    placeholder="e.g. /images/menu/watermelon-mojito.jpg or https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                  {imageModalUrl && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setImageModalUrl("")}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            {imageModalError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
                {imageModalError}
              </p>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-zinc-800">
              {imageModalReward.image_url ? (
                <button
                  type="button"
                  onClick={handleRemovePhotoModal}
                  disabled={imageModalSaving}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Smart Fallback
                </button>
              ) : (
                <span className="text-xs text-zinc-400">
                  Currently using smart category fallback
                </span>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setImageModalReward(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={imageModalSaving || imageModalUploading}
                  onClick={handleSavePhotoModal}
                >
                  {imageModalSaving ? "Saving Photo..." : "Save Image to Reward"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT REWARD DETAILS MODAL                                                 */}
      {/* ========================================================================= */}
      {editingReward && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg p-5 sm:p-6 space-y-4 bg-white dark:bg-zinc-900 max-h-[92vh] overflow-y-auto shadow-2xl border-stone-200 dark:border-zinc-800">
            <div className="flex items-start justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-foreground">Edit Catalog Reward</h3>
              <button
                type="button"
                onClick={() => setEditingReward(null)}
                className="p-1 rounded text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRewardEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-foreground mb-1">
                  Reward Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-foreground mb-1">
                  Description / Terms (e.g. Qualifying order ₹149+)
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Details shown to customer"
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-foreground mb-1">
                    Points Required <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editPoints}
                    onChange={(e) => setEditPoints(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-foreground mb-1">
                    Monetary Value (Worth ₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-foreground mb-1">
                    Display Rank (Sort)
                  </label>
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-foreground mb-1">
                    Stock Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-foreground mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "active" | "inactive")}
                    className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Photo preview and URL */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-foreground mb-1">
                  Photo URL / Path
                </label>
                <div className="flex gap-2 items-center">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800 shrink-0 border border-border shadow-2xs">
                    <img
                      src={getRewardImage(editName, editImageUrl)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="/images/... or https://..."
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded border border-border bg-background"
                  />
                  {editImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditImageUrl("")}
                      className="text-xs text-red-500 hover:underline shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {editError && (
                <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded border border-red-200">
                  {editError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingReward(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Reward Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Reward Confirm Modal */}
      {deletingReward && (
        <ConfirmModal
          open={Boolean(deletingReward)}
          title="Delete Catalog Reward?"
          description="Are you sure you want to permanently remove this reward from your catalog? Existing redemptions will still be tracked in the ledger."
          recordName={`${deletingReward.name} (${deletingReward.points_required} pts)`}
          confirmLabel={deletingLoading ? "Deleting..." : "Delete Reward"}
          variant="destructive"
          onConfirm={handleDeleteReward}
          onClose={() => setDeletingReward(null)}
        />
      )}

      {/* Redemption Requests & Fulfillment Queue */}
      <section className="border border-border bg-surface rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            Redemption Fulfillment Queue & History ({redemptions.length})
          </h2>
          <p className="text-xs text-muted">
            When a customer requests a reward redemption, points are deducted
            immediately. Rejecting or cancelling automatically writes a reversal
            transaction.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted font-mono uppercase">
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4">Customer & Card</th>
                <th className="py-3 px-4">Reward / Store Credit</th>
                <th className="py-3 px-4 text-right">Points / Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No redemption requests yet.
                  </td>
                </tr>
              ) : (
                redemptions.map((rr) => (
                  <tr key={rr.id}>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {formatDate(rr.requested_at, true)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">
                        {rr.customer_name}
                      </div>
                      <div className="font-mono text-muted">{rr.card_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">
                        {rr.reward_name || "Store Credit Bill Discount"}
                      </div>
                      {rr.notes && <div className="text-muted">{rr.notes}</div>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {rr.points_used > 0 ? `${rr.points_used} pts · ` : ""}
                      {formatCurrency(rr.monetary_value)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={rr.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {rr.status === "requested" || rr.status === "approved" ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateRedemptionStatus(rr.id, "fulfilled")
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Fulfill</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelTarget(rr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-700 text-white font-semibold"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel & Reverse</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">
                          {rr.processed_by_name || "Completed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel Redemption & Reverse Balance"
        description="Cancelling this redemption request will write an immutable reversal transaction that restores the deducted points or store credit back to the customer's card."
        recordName={
          cancelTarget
            ? `${cancelTarget.customer_name} — ${
                cancelTarget.reward_name ||
                formatCurrency(cancelTarget.monetary_value)
              }`
            : undefined
        }
        confirmLabel="Cancel & Restore Balance"
        variant="destructive"
        onConfirm={() =>
          cancelTarget && updateRedemptionStatus(cancelTarget.id, "cancelled")
        }
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
