"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ClipboardCheck,
  Gift,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Utensils,
  QrCode,
  Camera,
  Upload,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface AdminShellProps {
  businessName: string;
  businessSlug: string;
  businessLogoUrl?: string | null;
  businessPrimaryColor?: string | null;
  userName: string;
  userEmail: string;
  role: UserRole;
  isPlatformAdmin: boolean;
  isImpersonating: boolean;
  impersonationReason: string | null;
  children: React.ReactNode;
}

export function AdminShell({
  businessName,
  businessSlug,
  businessLogoUrl,
  businessPrimaryColor,
  userName,
  role,
  isPlatformAdmin,
  isImpersonating,
  impersonationReason,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(
    businessLogoUrl || null
  );
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentLogoUrl(businessLogoUrl || null);
  }, [businessLogoUrl]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["owner", "manager", "cashier"],
    },
    {
      href: "/orders",
      label: "Live QR Orders",
      icon: Utensils,
      roles: ["owner", "manager", "cashier"],
    },
    {
      href: "/menu",
      label: "Store QR & Menu",
      icon: QrCode,
      roles: ["owner", "manager", "cashier"],
    },
    {
      href: "/customers",
      label: "Customers & Cards",
      icon: Users,
      roles: ["owner", "manager", "cashier"],
    },
    {
      href: "/purchases",
      label: "Purchases & POS",
      icon: ShoppingBag,
      roles: ["owner", "manager", "cashier"],
    },
    {
      href: "/claims",
      label: "Claims & Approvals",
      icon: ClipboardCheck,
      roles: ["owner", "manager"],
    },
    {
      href: "/rewards",
      label: "Rewards & Redeem",
      icon: Gift,
      roles: ["owner", "manager", "cashier"],
    },
    {
      href: "/reports",
      label: "Reports & Export",
      icon: BarChart3,
      roles: ["owner", "manager", "cashier"],
    },
    {
      href: "/settings",
      label: "Rules & Settings",
      icon: Settings,
      roles: ["owner", "manager"],
    },
  ].filter((item) => item.roles.includes(role));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function stopImpersonating() {
    await fetch("/api/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop_impersonation" }),
    });
    router.push("/platform");
    router.refresh();
  }

  async function handleUploadLogo(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setUploadingLogo(true);
    setLogoError(null);
    try {
      let newLogoUrl = "";

      // 1. Try Supabase Storage CDN upload first
      try {
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("bucket", "business-assets");
        const upRes = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const upData = await upRes.json();
        if (upRes.ok && upData.url) {
          newLogoUrl = upData.url;
        }
      } catch (storageErr) {
        console.warn("Storage upload failed, falling back to local encoding:", storageErr);
      }

      // 2. Seamless Data URL fallback if storage API was unavailable
      if (!newLogoUrl) {
        newLogoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      // 3. Save to business profile
      const patchRes = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName,
          logoUrl: newLogoUrl,
          primaryColor: businessPrimaryColor || "#18181B",
        }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        setLogoError(
          patchData.error || "Failed to save logo to business profile."
        );
        return;
      }

      setCurrentLogoUrl(newLogoUrl);
      setShowLogoModal(false);
      setSelectedFile(null);
      setLogoPreview(null);
      router.refresh();
    } catch (err: any) {
      setLogoError(err?.message || "Network error uploading logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    setUploadingLogo(true);
    setLogoError(null);
    try {
      const patchRes = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName,
          logoUrl: "",
          primaryColor: businessPrimaryColor || "#18181B",
        }),
      });
      if (patchRes.ok) {
        setCurrentLogoUrl(null);
        setSelectedFile(null);
        setLogoPreview(null);
        setShowLogoModal(false);
        router.refresh();
      }
    } catch {
      setLogoError("Network error removing logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isImpersonating && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between no-print">
          <span>
            <strong>Platform Impersonation Active:</strong> Viewing{" "}
            <u>{businessName}</u> (Reason: {impersonationReason || "Support"})
          </span>
          <button
            type="button"
            onClick={stopImpersonating}
            className="px-2.5 py-1 rounded bg-white text-zinc-900 font-semibold hover:bg-zinc-100"
          >
            Exit Impersonation
          </button>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface h-14 px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open navigation menu"
            className="lg:hidden p-1.5 rounded border border-border bg-surface text-foreground"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground group"
            >
              {currentLogoUrl ? (
                <img
                  src={currentLogoUrl}
                  alt={businessName}
                  className="w-7 h-7 rounded object-cover border border-border shadow-2xs shrink-0"
                />
              ) : (
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded text-white font-bold text-xs shrink-0 shadow-2xs uppercase"
                  style={{ backgroundColor: businessPrimaryColor || "#18181B" }}
                >
                  {businessName.slice(0, 1)}
                </span>
              )}
              <span className="truncate max-w-[170px] sm:max-w-xs">
                {businessName}
              </span>
            </Link>

            {(role === "owner" || role === "manager") && (
              <button
                type="button"
                onClick={() => {
                  setShowLogoModal(true);
                  setSelectedFile(null);
                  setLogoPreview(null);
                  setLogoError(null);
                }}
                title="Upload personalized business logo"
                className="p-1 rounded text-zinc-400 hover:text-foreground hover:bg-surface-elevated transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}

            <span className="px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider rounded-xs bg-surface-elevated border border-border text-accent font-semibold">
              {role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/s/${businessSlug || "araku-filter-coffee"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-border bg-surface hover:bg-surface-elevated text-accent"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Store QR Menu</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <Link
            href="/card/cd_araku_ananya_01"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-border bg-surface hover:bg-surface-elevated text-muted hover:text-foreground"
          >
            <span>Demo QR Card</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          {isPlatformAdmin && (
            <Link
              href="/platform"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-amber-400/60 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Platform SaaS Admin</span>
            </Link>
          )}

          <ThemeToggle />

          <div className="hidden sm:block text-right text-xs leading-tight">
            <div className="font-semibold text-foreground">{userName}</div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border border-border bg-surface hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface p-3 justify-between no-print">
          <div>
            <div className="flex items-center justify-between gap-2 p-2 mb-2.5 rounded bg-surface-elevated/70 border border-border">
              <div className="flex items-center gap-2 min-w-0">
                {currentLogoUrl ? (
                  <img
                    src={currentLogoUrl}
                    alt={businessName}
                    className="w-7 h-7 rounded object-cover border border-border shadow-2xs shrink-0"
                  />
                ) : (
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded text-white font-bold text-xs shrink-0 shadow-2xs uppercase"
                    style={{
                      backgroundColor: businessPrimaryColor || "#18181B",
                    }}
                  >
                    {businessName.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-xs text-foreground truncate">
                    {businessName}
                  </p>
                  <span className="text-[10px] font-mono uppercase text-accent font-semibold">
                    {role}
                  </span>
                </div>
              </div>
              {(role === "owner" || role === "manager") && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoModal(true);
                    setSelectedFile(null);
                    setLogoPreview(null);
                    setLogoError(null);
                  }}
                  title="Upload personalized business logo"
                  className="p-1 rounded text-zinc-400 hover:text-foreground hover:bg-surface transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <nav
              aria-label="Merchant workspace navigation"
              className="space-y-1"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded transition-colors",
                      active
                        ? "bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                        : "text-muted hover:text-foreground hover:bg-surface-elevated"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3 rounded bg-surface-elevated border border-border text-xs space-y-1.5">
            <div className="font-semibold text-foreground">
              Counter Shortcuts
            </div>
            <div className="text-muted">
              Record purchases and scan customer QR cards in under 15 seconds.
            </div>
            <div className="pt-1 flex gap-2">
              <Link
                href="/docs"
                className="text-accent hover:underline font-medium"
              >
                Staff Guide →
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 no-print"
            onClick={() => setMobileMenuOpen(false)}
          >
            <aside
              className="w-64 h-full bg-surface border-r border-border p-4 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pb-3 mb-2 border-b border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {currentLogoUrl ? (
                    <img
                      src={currentLogoUrl}
                      alt={businessName}
                      className="w-7 h-7 rounded object-cover border border-border shadow-2xs shrink-0"
                    />
                  ) : (
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded text-white font-bold text-xs shrink-0 shadow-2xs uppercase"
                      style={{
                        backgroundColor: businessPrimaryColor || "#18181B",
                      }}
                    >
                      {businessName.slice(0, 1)}
                    </span>
                  )}
                  <span className="font-bold text-sm truncate">
                    {businessName}
                  </span>
                </div>
                {(role === "owner" || role === "manager") && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogoModal(true);
                      setSelectedFile(null);
                      setLogoPreview(null);
                      setLogoError(null);
                    }}
                    title="Upload personalized business logo"
                    className="p-1 rounded text-zinc-400 hover:text-foreground"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded",
                      active
                        ? "bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </aside>
          </div>
        )}

        {/* Main Workspace Content */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto"
        >
          {children}
        </main>
      </div>

      {/* Personalized Logo Upload Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded bg-surface border border-border p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-sm text-foreground">
                  Personalized Business Logo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLogoModal(false);
                  setSelectedFile(null);
                  setLogoPreview(null);
                  setLogoError(null);
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {logoError && (
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-800">
                {logoError}
              </p>
            )}

            <div className="flex flex-col items-center justify-center gap-2.5 py-2">
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-surface-elevated shadow-xs">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                ) : currentLogoUrl ? (
                  <img
                    src={currentLogoUrl}
                    alt={businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="w-full h-full flex items-center justify-center text-white font-bold text-2xl uppercase"
                    style={{
                      backgroundColor: businessPrimaryColor || "#18181B",
                    }}
                  >
                    {businessName.slice(0, 1)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted text-center leading-relaxed">
                Upload your official store logo. Appears on customer digital passes, menu headers, and admin workspace.
              </p>
            </div>

            <form onSubmit={handleUploadLogo} className="space-y-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setSelectedFile(f);
                    setLogoPreview(URL.createObjectURL(f));
                  }
                }}
                className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-xs file:font-semibold file:bg-surface hover:file:bg-surface-elevated text-muted cursor-pointer"
              />

              <div className="flex gap-2 pt-2 border-t border-border">
                {currentLogoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="py-1.5 px-3 rounded border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!selectedFile || uploadingLogo}
                  className="flex-1 py-1.5 px-3 rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Logo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Apply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

