import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid business email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(120),
  phone: z.string().min(8, "Enter a valid phone number").max(20).optional().or(z.literal("")),
  currency: z.string().default("INR"),
  timezone: z.string().default("Asia/Kolkata"),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const businessUpdateSchema = z.object({
  name: z.string().min(2, "Business name is required").max(120),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #18181B)"),
  currency: z.string().min(3).max(3).default("INR"),
  timezone: z.string().min(2).default("Asia/Kolkata"),
  address: z.string().max(300).optional().nullable(),
  phone: z.string().max(25).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});

export const locationCreateSchema = z.object({
  name: z.string().min(2, "Location name is required").max(100),
  address: z.string().max(250).optional().nullable(),
  phone: z.string().max(25).optional().nullable(),
});

export const staffInviteSchema = z.object({
  email: z.string().email("Enter a valid staff email address"),
  role: z.enum(["manager", "cashier"]),
  locationId: z.string().uuid().optional().nullable().or(z.literal("")),
});

export const loyaltyRulesSchema = z.object({
  pointsPerCurrencyUnit: z.coerce.number().min(0.1).max(1000),
  currencyUnit: z.coerce.number().min(1).max(100000),
  minimumPurchaseAmount: z.coerce.number().min(0).max(1000000),
  maximumPointsPerTransaction: z.coerce.number().int().min(1).max(1000000),
  pointsValuePer100: z.coerce.number().min(1).max(100000),
  minimumRedemptionPoints: z.coerce.number().int().min(1).max(1000000),
  claimEnabled: z.boolean(),
  claimWindowDays: z.coerce.number().int().min(1).max(365),
  dailyClaimLimit: z.coerce.number().int().min(1).max(50),
  receiptRequiredAboveAmount: z.coerce.number().min(0).max(1000000),
  signupBonusPoints: z.coerce.number().int().min(0).max(50000),
  pointsExpiryMonths: z.coerce.number().int().min(1).max(120).nullable().optional(),
  campaignName: z.string().max(100).optional().nullable(),
  campaignMultiplier: z.coerce.number().min(1).max(10).default(1),
  campaignEndsAt: z.string().optional().nullable(),
  managerAdjustmentLimit: z.coerce.number().int().min(0).max(1000000).default(500),
  allowNegativeBalance: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const customerCreateSchema = z.object({
  fullName: z.string().min(2, "Customer name is required").max(120),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  dateOfBirth: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().max(500).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  loyaltyConsent: z.boolean().refine((val) => val === true, {
    message: "Explicit loyalty program consent is required (DPDP Act 2023).",
  }),
  marketingConsent: z.boolean().default(false),
});

export const customerUpdateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  dateOfBirth: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().max(500).optional().nullable(),
  tags: z.array(z.string()).optional(),
  marketingConsent: z.boolean().optional(),
  cardStatus: z.enum(["active", "frozen", "closed"]).optional(),
});

export const purchaseRecordSchema = z.object({
  customerId: z.string().uuid("Valid customer is required"),
  cardId: z.string().uuid("Valid card is required"),
  locationId: z.string().uuid().optional().nullable().or(z.literal("")),
  amount: z.coerce.number().positive("Purchase amount must be greater than 0"),
  purchaseDate: z.string().optional(),
  receiptNumber: z.string().max(80).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  notes: z.string().max(400).optional().nullable(),
  overridePoints: z.coerce.number().int().min(0).optional().nullable(),
});

export const customerClaimSchema = z.object({
  phoneLast4: z
    .string()
    .regex(/^\d{4}$/, "Enter the last 4 digits of your registered phone number"),
  amount: z.coerce.number().positive("Purchase amount must be greater than 0"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  receiptNumber: z.string().max(80).optional().nullable(),
  receiptFileUrl: z.string().optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

export const claimApproveSchema = z.object({
  adjustedAmount: z.coerce.number().positive().optional(),
  overridePoints: z.coerce.number().int().min(0).optional(),
  reviewNote: z.string().max(300).optional().nullable(),
});

export const claimRejectSchema = z.object({
  reviewNote: z
    .string()
    .min(3, "A rejection reason is required so the customer knows why"),
});

export const rewardCreateSchema = z.object({
  name: z.string().min(2, "Reward name is required").max(120),
  description: z.string().max(400).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  pointsRequired: z.coerce.number().int().positive("Points cost must be > 0"),
  monetaryValue: z.coerce.number().min(0, "Value cannot be negative"),
  stockLimit: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const adminRedemptionSchema = z.object({
  cardId: z.string().uuid("Valid card ID is required"),
  redemptionType: z.enum(["reward", "store_credit"]),
  rewardId: z.string().uuid().optional().nullable(),
  creditAmount: z.coerce.number().positive().optional(),
  notes: z.string().max(300).optional().nullable(),
});

export const customerRedemptionRequestSchema = z.object({
  phoneLast4: z
    .string()
    .regex(/^\d{4}$/, "Enter the last 4 digits of your registered phone number"),
  redemptionType: z.enum(["reward", "store_credit"]),
  rewardId: z.string().uuid().optional().nullable(),
  creditAmount: z.coerce.number().positive().optional(),
  notes: z.string().max(250).optional().nullable(),
});

export const pointsToCreditConvertSchema = z.object({
  phoneLast4: z.string().regex(/^\d{4}$/).optional(),
  pointsToConvert: z.coerce.number().int().positive(),
});

export const manualAdjustmentSchema = z.object({
  cardId: z.string().uuid("Valid card ID is required"),
  walletType: z.enum(["points", "credit"]),
  pointsDelta: z.coerce.number().int().default(0),
  amountDelta: z.coerce.number().default(0),
  reason: z.string().min(4, "Provide a clear audit reason for this adjustment"),
});

export const contactSubmissionSchema = z.object({
  fullName: z.string().min(2, "Your name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(25).optional().nullable(),
  businessName: z.string().max(120).optional().nullable(),
  subject: z.string().min(3, "Subject is required").max(150),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
});

