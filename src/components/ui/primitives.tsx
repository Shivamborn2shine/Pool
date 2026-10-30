"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Copy, AlertTriangle, X, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* 1. Copy Button (PROJECT_STANDARDS.md Section 2) */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy value"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-border bg-surface text-foreground hover:bg-surface-elevated active:translate-y-[0.5px] transition-colors no-print",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-muted" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

/* 2. Accessible Tooltip (PROJECT_STANDARDS.md Section 2) */
export function Tooltip({
  content,
  children,
}: {
  content: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children || (
        <button
          type="button"
          aria-label={content}
          className="text-muted hover:text-foreground p-0.5 rounded"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 px-2.5 py-1.5 text-xs font-normal text-white bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 rounded shadow-md pointer-events-none"
        >
          {content}
        </span>
      )}
    </span>
  );
}

/* 3. Confirmation Modal (PROJECT_STANDARDS.md Section 2) */
export function ConfirmModal({
  open,
  title,
  description,
  recordName,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  recordName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmButtonRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md bg-surface border border-border rounded p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "p-2 rounded",
                variant === "destructive"
                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                  : "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
              )}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2
              id="confirm-modal-title"
              className="text-base font-semibold text-foreground"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close confirmation dialog"
            className="text-muted hover:text-foreground p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted leading-relaxed">{description}</p>

        {recordName && (
          <div className="mt-3 px-3 py-2 bg-surface-elevated border border-border rounded text-xs font-mono text-foreground">
            Affected record: <strong>{recordName}</strong>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium border border-border rounded bg-surface hover:bg-surface-elevated text-foreground disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded text-white disabled:opacity-50 transition-colors",
              variant === "destructive"
                ? "bg-red-700 hover:bg-red-800"
                : "bg-accent hover:bg-accent-hover"
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* 4. Status Badge */
export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase();
  let classes =
    "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";

  if (
    ["active", "approved", "fulfilled", "completed", "points_earned", "credit_earned"].includes(
      normalized
    )
  ) {
    classes =
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
  } else if (
    ["pending", "requested", "invited", "new"].includes(normalized)
  ) {
    classes =
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
  } else if (
    [
      "rejected",
      "cancelled",
      "suspended",
      "closed",
      "revoked",
      "duplicate",
      "expired",
    ].includes(normalized)
  ) {
    classes =
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800";
  } else if (["frozen", "inactive", "reversal"].includes(normalized)) {
    classes =
      "bg-stone-200 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-xs capitalize",
        classes
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* 5. Empty State */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="border border-dashed border-border rounded p-8 text-center bg-surface">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded bg-brand text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* 6. Button Primitive */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-stone-100 dark:text-zinc-900 dark:hover:bg-stone-200 border border-transparent",
    secondary:
      "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-stone-300 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800",
    danger:
      "bg-red-700 text-white hover:bg-red-800 border border-transparent",
    ghost:
      "bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-transparent",
  }[variant];

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  }[size];

  return (
    <button
      type={props.type || "button"}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-sm transition-colors disabled:opacity-50 disabled:pointer-events-none active:translate-y-[0.5px]",
        variantStyles,
        sizeStyles,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* 7. Card Primitive */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-sm shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* 8. Badge Primitive */
export function Badge({
  variant = "neutral",
  className,
  children,
}: {
  variant?: "neutral" | "success" | "warning" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  const styles = {
    neutral:
      "bg-stone-100 text-zinc-800 border-stone-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
    success:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    warning:
      "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    danger:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold border rounded-xs",
        styles,
        className
      )}
    >
      {children}
    </span>
  );
}

/* 9. Input Primitive */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-3 py-2 text-sm rounded-sm border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-terracotta-600",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}


