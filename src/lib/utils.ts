import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string,
  currency: string = "INR"
): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  const safeNum = Number.isFinite(numeric) ? numeric : 0;

  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: safeNum % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(safeNum);
  } catch {
    return `₹${safeNum.toFixed(2)}`;
  }
}

export function formatDate(
  dateInput: string | Date | null | undefined,
  includeTime = false
): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return phone.trim();
}

export function verifyPhoneLast4(
  registeredPhone: string,
  submittedLast4: string
): boolean {
  const regDigits = registeredPhone.replace(/\D/g, "");
  const subDigits = submittedLast4.replace(/\D/g, "");
  if (subDigits.length < 4 || regDigits.length < 4) return false;
  return regDigits.slice(-4) === subDigits.slice(-4);
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  // Extract national phone number (last 10 digits for standard phone numbers)
  const national = digits.length >= 10 ? digits.slice(-10) : digits;
  const first2 = national.slice(0, 2);
  const last2 = national.slice(-2);
  const maskCount = Math.max(2, national.length - 4);
  return `${first2}${"*".repeat(maskCount)}${last2}`;
}

export function generateCardNumber(businessSlug: string = "LP"): string {
  const prefix = businessSlug
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(2, "X");
  const part1 = crypto.randomInt(1000, 9999);
  const part2 = crypto.randomInt(1000, 9999);
  return `${prefix}-${part1}-${part2}`;
}

export function generatePublicId(): string {
  return `cd_${crypto.randomBytes(12).toString("base64url")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

