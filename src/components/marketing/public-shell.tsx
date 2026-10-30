"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, QrCode, ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Setup Guide" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const SEARCH_INDEX = [
  {
    title: "Create Digital QR Loyalty Cards",
    description: "Launch a browser-based loyalty card program in under 2 minutes.",
    href: "/register",
  },
  {
    title: "Live Customer Card Preview (Araku Coffee)",
    description: "Inspect a real mobile QR loyalty card with points and store credit.",
    href: "/card/cd_araku_ananya_01",
  },
  {
    title: "Getting Started & Setup Documentation",
    description: "8-step guide to configuring rules, staff roles, QR cards, and claims.",
    href: "/docs",
  },
  {
    title: "Pricing Plans (Starter ₹0, Growth ₹999, Scale ₹2,499)",
    description: "Transparent INR pricing with 14-day free trial and CSV data export.",
    href: "/pricing",
  },
  {
    title: "Frequently Asked Questions",
    description: "Answers on QR security, DPDP Act 2023 compliance, and cashier rules.",
    href: "/faq",
  },
  {
    title: "Privacy Policy & DPDP Act 2023 Compliance",
    description: "How Loopa handles customer consent, data retention, and deletion.",
    href: "/privacy",
  },
  {
    title: "Merchant Dashboard Login",
    description: "Sign in as Owner, Manager, or Cashier to record purchases.",
    href: "/login",
  },
];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredSearch = SEARCH_INDEX.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-bold text-lg tracking-tight text-foreground"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 border-b-2 border-accent font-mono text-sm font-extrabold">
            L
          </span>
          <span>{SITE_CONFIG.name}</span>
          <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-surface-elevated border border-border text-muted">
            Loyalty Ledger
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1"
        >
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                  active
                    ? "bg-surface-elevated text-foreground font-semibold border border-border"
                    : "text-muted hover:text-foreground hover:bg-surface-elevated/60"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search site pages and documentation"
            className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-block px-1 py-0.2 text-[10px] font-mono bg-surface-elevated border border-border rounded-xs">
              Ctrl K
            </kbd>
          </button>

          <ThemeToggle />

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium rounded border border-border bg-surface text-foreground hover:bg-surface-elevated transition-colors"
          >
            Sign in
          </Link>

          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            <span>Create loyalty card</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded border border-border bg-surface text-foreground"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 pt-3 pb-5 space-y-2">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-3 py-2 text-sm font-medium rounded",
                  active
                    ? "bg-surface-elevated text-foreground font-semibold"
                    : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full text-center px-4 py-2 text-sm font-medium rounded border border-border bg-surface text-foreground"
            >
              Sign in to Dashboard
            </Link>
            <Link
              href="/register"
              className="w-full text-center px-4 py-2 text-sm font-medium rounded bg-accent text-white"
            >
              Create free loyalty card
            </Link>
          </div>
        </div>
      )}

      {/* Site Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-20 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Site search"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Search className="w-4 h-4 text-muted" />
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, setup guides, pricing, or demo card..."
                aria-label="Search query"
                className="w-full bg-transparent text-sm text-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="text-xs text-muted hover:text-foreground px-1.5 py-0.5 border border-border rounded-xs"
              >
                Esc
              </button>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-border">
              {filteredSearch.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No matching pages found for &ldquo;{searchQuery}&rdquo;.
                </p>
              ) : (
                filteredSearch.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(item.href);
                    }}
                    className="w-full text-left py-2.5 px-2 hover:bg-surface-elevated rounded transition-colors block"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {item.description}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface text-foreground no-print mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-base">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 border-b-2 border-accent font-mono text-xs">
                L
              </span>
              <span>{SITE_CONFIG.name}</span>
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              {SITE_CONFIG.description}
            </p>
            <p className="mt-3 text-xs text-muted">
              <strong>HQ:</strong> {SITE_CONFIG.address}
            </p>
            <p className="mt-1 text-xs text-muted">
              <strong>Support:</strong>{" "}
              <a
                href={`mailto:${SITE_CONFIG.supportEmail}`}
                className="underline hover:text-foreground"
              >
                {SITE_CONFIG.supportEmail}
              </a>{" "}
              ({SITE_CONFIG.phone})
            </p>
          </div>

          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
              Product & Live Demo
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/register" className="text-muted hover:text-foreground">
                  Create Business Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted hover:text-foreground">
                  Staff & Owner Login
                </Link>
              </li>
              <li>
                <Link
                  href="/card/cd_araku_ananya_01"
                  className="inline-flex items-center gap-1.5 text-accent font-medium hover:underline"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Live Customer QR Card</span>
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted hover:text-foreground">
                  Pricing & Plans
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
              Documentation & Company
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-muted hover:text-foreground">
                  Merchant Setup Guide
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted hover:text-foreground">
                  About Loopa
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted hover:text-foreground">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted hover:text-foreground">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
              Legal & DPDP Compliance
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted hover:text-foreground">
                  Privacy Policy (DPDP Act 2023)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-muted hover:text-foreground">
                  Sitemap XML
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div>
            © {new Date().getFullYear()} {SITE_CONFIG.legalName}. All rights
            reserved.
          </div>
          <div>
            Last updated: {SITE_CONFIG.lastUpdated} · Built for Indian local
            commerce (INR ₹ default).
          </div>
        </div>
      </div>
    </footer>
  );
}

