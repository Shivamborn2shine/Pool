import type { LoyaltyRules, UserRole } from "@/types";

export interface PointsCalculationInput {
  purchaseAmount: number;
  pointsPerCurrencyUnit: number;
  currencyUnit: number;
  minimumPurchaseAmount: number;
  maximumPointsPerTransaction: number;
  campaignMultiplier?: number;
  campaignEndsAt?: string | Date | null;
  referenceDate?: Date;
}

export interface PointsCalculationResult {
  eligibleAmount: number;
  basePoints: number;
  campaignBonusPoints: number;
  totalPoints: number;
  cappedByMax: boolean;
  belowMinimum: boolean;
  effectiveMultiplier: number;
}

/**
 * Implements Section 8.1 Points Calculation from LOYALTYCARD_PRD.md
 */
export function calculatePointsEarned(
  input: PointsCalculationInput
): PointsCalculationResult {
  const {
    purchaseAmount,
    pointsPerCurrencyUnit,
    currencyUnit,
    minimumPurchaseAmount,
    maximumPointsPerTransaction,
    campaignMultiplier = 1,
    campaignEndsAt = null,
    referenceDate = new Date(),
  } = input;

  if (
    !Number.isFinite(purchaseAmount) ||
    purchaseAmount <= 0 ||
    currencyUnit <= 0 ||
    pointsPerCurrencyUnit <= 0
  ) {
    return {
      eligibleAmount: Math.max(0, purchaseAmount || 0),
      basePoints: 0,
      campaignBonusPoints: 0,
      totalPoints: 0,
      cappedByMax: false,
      belowMinimum: true,
      effectiveMultiplier: 1,
    };
  }

  if (purchaseAmount < minimumPurchaseAmount) {
    return {
      eligibleAmount: purchaseAmount,
      basePoints: 0,
      campaignBonusPoints: 0,
      totalPoints: 0,
      cappedByMax: false,
      belowMinimum: true,
      effectiveMultiplier: 1,
    };
  }

  let effectiveMultiplier =
    Number.isFinite(campaignMultiplier) && campaignMultiplier > 0
      ? campaignMultiplier
      : 1;

  if (campaignEndsAt) {
    const endDate =
      typeof campaignEndsAt === "string"
        ? new Date(campaignEndsAt)
        : campaignEndsAt;
    if (!Number.isNaN(endDate.getTime()) && referenceDate > endDate) {
      effectiveMultiplier = 1;
    }
  }

  const basePoints =
    Math.floor(purchaseAmount / currencyUnit) * pointsPerCurrencyUnit;
  const rawCampaignPoints =
    basePoints * effectiveMultiplier - basePoints;
  const campaignBonusPoints = Math.max(0, Math.floor(rawCampaignPoints));
  let totalPoints = Math.floor(basePoints + campaignBonusPoints);

  let cappedByMax = false;
  if (
    maximumPointsPerTransaction > 0 &&
    totalPoints > maximumPointsPerTransaction
  ) {
    totalPoints = maximumPointsPerTransaction;
    cappedByMax = true;
  }

  return {
    eligibleAmount: purchaseAmount,
    basePoints: Math.floor(basePoints),
    campaignBonusPoints,
    totalPoints,
    cappedByMax,
    belowMinimum: false,
    effectiveMultiplier,
  };
}

/**
 * Calculates store credit (INR/currency) earned when converting points_balance -> redeemable_amount
 * Default: 100 points = ₹100 redeemable credit (points_value_per_100 = 100)
 */
export function calculateCreditFromPoints(
  pointsToConvert: number,
  pointsValuePer100: number,
  minimumRedemptionPoints: number
): {
  allowed: boolean;
  reason?: string;
  creditAmount: number;
} {
  if (!Number.isInteger(pointsToConvert) || pointsToConvert <= 0) {
    return {
      allowed: false,
      reason: "Points to convert must be a positive whole number.",
      creditAmount: 0,
    };
  }

  if (pointsToConvert < minimumRedemptionPoints) {
    return {
      allowed: false,
      reason: `Minimum ${minimumRedemptionPoints} points required for conversion.`,
      creditAmount: 0,
    };
  }

  const rawCredit = (pointsToConvert / 100) * pointsValuePer100;
  const creditAmount = Math.round(rawCredit * 100) / 100;

  return {
    allowed: true,
    creditAmount,
  };
}

export interface RedemptionValidationInput {
  cardStatus: string;
  businessStatus: string;
  rulesStatus: string;
  redemptionType: "reward" | "store_credit";
  pointsBalance: number;
  redeemableAmount: number;
  pointsRequired: number;
  creditAmountRequired: number;
  minimumRedemptionPoints: number;
  rewardStatus?: string;
  stockLimit?: number | null;
  redeemedCount?: number;
}

/**
 * Implements Section 8.3 Redemption Validation from LOYALTYCARD_PRD.md
 */
export function validateRedemption(input: RedemptionValidationInput): {
  valid: boolean;
  error?: string;
} {
  if (input.cardStatus !== "active") {
    return {
      valid: false,
      error: `Card is currently ${input.cardStatus} and cannot redeem rewards.`,
    };
  }

  if (input.businessStatus !== "active" || input.rulesStatus !== "active") {
    return {
      valid: false,
      error: "This loyalty program is currently inactive.",
    };
  }

  if (input.redemptionType === "reward") {
    if (input.rewardStatus && input.rewardStatus !== "active") {
      return { valid: false, error: "Selected reward is no longer active." };
    }

    if (
      input.stockLimit !== null &&
      input.stockLimit !== undefined &&
      (input.redeemedCount ?? 0) >= input.stockLimit
    ) {
      return { valid: false, error: "This reward is currently out of stock." };
    }

    if (input.pointsRequired < input.minimumRedemptionPoints) {
      return {
        valid: false,
        error: `Minimum redemption threshold is ${input.minimumRedemptionPoints} points.`,
      };
    }

    if (input.pointsBalance < input.pointsRequired) {
      return {
        valid: false,
        error: `Insufficient points balance (${input.pointsBalance} available, ${input.pointsRequired} required).`,
      };
    }
  } else {
    if (input.creditAmountRequired <= 0) {
      return {
        valid: false,
        error: "Redemption credit amount must be greater than zero.",
      };
    }

    if (input.redeemableAmount < input.creditAmountRequired) {
      return {
        valid: false,
        error: `Insufficient store credit balance (₹${input.redeemableAmount.toFixed(
          2
        )} available, ₹${input.creditAmountRequired.toFixed(2)} requested).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Checks whether a purchase claim date falls within the allowed claim window (CLAIM-09)
 */
export function isClaimWithinWindow(
  purchaseDate: Date | string,
  claimWindowDays: number,
  now: Date = new Date()
): { valid: boolean; reason?: string } {
  const pDate =
    typeof purchaseDate === "string" ? new Date(purchaseDate) : purchaseDate;
  if (Number.isNaN(pDate.getTime())) {
    return { valid: false, reason: "Invalid purchase date." };
  }

  // Allow up to 24 hours in the future for timezone differences
  const futureBuffer = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (pDate > futureBuffer) {
    return {
      valid: false,
      reason: "Purchase date cannot be in the future.",
    };
  }

  const diffMs = now.getTime() - pDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays > claimWindowDays) {
    return {
      valid: false,
      reason: `Claim is outside the ${claimWindowDays}-day submission window.`,
    };
  }

  return { valid: true };
}

/**
 * Implements Section 9 Permissions Matrix & BAL-09 Manager Adjustment Threshold
 */
export function evaluateAdjustmentPermission(
  role: UserRole,
  pointsDelta: number,
  amountDelta: number,
  managerAdjustmentLimit: number,
  pointsValuePer100: number
): {
  allowed: boolean;
  requiresOwnerApproval: boolean;
  error?: string;
} {
  if (role === "cashier") {
    return {
      allowed: false,
      requiresOwnerApproval: false,
      error: "Cashiers do not have permission to perform manual balance adjustments.",
    };
  }

  if (role === "owner") {
    return {
      allowed: true,
      requiresOwnerApproval: false,
    };
  }

  // Manager: allowed directly within limit; queued for Owner approval above limit
  const absPoints = Math.abs(pointsDelta);
  const equivalentPointsFromAmount =
    pointsValuePer100 > 0
      ? Math.ceil((Math.abs(amountDelta) / pointsValuePer100) * 100)
      : Math.abs(amountDelta);

  const effectiveMagnitude = Math.max(absPoints, equivalentPointsFromAmount);

  if (effectiveMagnitude > managerAdjustmentLimit) {
    return {
      allowed: true,
      requiresOwnerApproval: true,
    };
  }

  return {
    allowed: true,
    requiresOwnerApproval: false,
  };
}

export function computeExpiryDate(
  rules: Pick<LoyaltyRules, "points_expiry_months">,
  fromDate: Date = new Date()
): string | null {
  if (!rules.points_expiry_months || rules.points_expiry_months <= 0) {
    return null;
  }
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + rules.points_expiry_months);
  return d.toISOString();
}

