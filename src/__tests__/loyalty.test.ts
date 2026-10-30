import { describe, expect, it } from "vitest";
import {
  calculateCreditFromPoints,
  calculateOrderPointsEarned,
  calculatePointsEarned,
  canTransitionOrderStatus,
  computeExpiryDate,
  evaluateAdjustmentPermission,
  isClaimWithinWindow,
  resolveCustomerDisplayName,
  validateRedemption,
} from "@/lib/loyalty";
import { getPublicCardUrl, generateCardQrSvg, getStoreQrUrl } from "@/lib/qr";
import { verifyPhoneLast4, normalizePhone, maskPhone } from "@/lib/utils";

describe("Loyalty Engine - Points Calculation (PRD Section 8.1)", () => {
  it("returns 0 points when purchase is below minimum purchase amount", () => {
    const result = calculatePointsEarned({
      purchaseAmount: 80,
      pointsPerCurrencyUnit: 10,
      currencyUnit: 100,
      minimumPurchaseAmount: 100,
      maximumPointsPerTransaction: 5000,
    });

    expect(result.belowMinimum).toBe(true);
    expect(result.totalPoints).toBe(0);
    expect(result.basePoints).toBe(0);
  });

  it("calculates base points accurately using floor(amount / currencyUnit) * pointsPerCurrencyUnit", () => {
    const result = calculatePointsEarned({
      purchaseAmount: 450,
      pointsPerCurrencyUnit: 10,
      currencyUnit: 100,
      minimumPurchaseAmount: 100,
      maximumPointsPerTransaction: 5000,
    });

    expect(result.belowMinimum).toBe(false);
    expect(result.basePoints).toBe(40);
    expect(result.campaignBonusPoints).toBe(0);
    expect(result.totalPoints).toBe(40);
    expect(result.cappedByMax).toBe(false);
  });

  it("applies active campaign multiplier and computes bonus points separately", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    const result = calculatePointsEarned({
      purchaseAmount: 500,
      pointsPerCurrencyUnit: 10,
      currencyUnit: 100,
      minimumPurchaseAmount: 100,
      maximumPointsPerTransaction: 5000,
      campaignMultiplier: 1.5,
      campaignEndsAt: "2026-06-30T23:59:59Z",
      referenceDate: now,
    });

    expect(result.basePoints).toBe(50);
    expect(result.campaignBonusPoints).toBe(25);
    expect(result.totalPoints).toBe(75);
    expect(result.effectiveMultiplier).toBe(1.5);
  });

  it("ignores expired campaign multiplier when referenceDate is past campaignEndsAt", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    const result = calculatePointsEarned({
      purchaseAmount: 500,
      pointsPerCurrencyUnit: 10,
      currencyUnit: 100,
      minimumPurchaseAmount: 100,
      maximumPointsPerTransaction: 5000,
      campaignMultiplier: 2.0,
      campaignEndsAt: "2026-06-30T23:59:59Z",
      referenceDate: now,
    });

    expect(result.basePoints).toBe(50);
    expect(result.campaignBonusPoints).toBe(0);
    expect(result.totalPoints).toBe(50);
    expect(result.effectiveMultiplier).toBe(1);
  });

  it("caps total points at maximumPointsPerTransaction when exceeded", () => {
    const result = calculatePointsEarned({
      purchaseAmount: 15000,
      pointsPerCurrencyUnit: 10,
      currencyUnit: 100,
      minimumPurchaseAmount: 100,
      maximumPointsPerTransaction: 1000,
    });

    expect(result.basePoints).toBe(1500);
    expect(result.totalPoints).toBe(1000);
    expect(result.cappedByMax).toBe(true);
  });
});

describe("Loyalty Engine - Points to Store Credit Conversion", () => {
  it("rejects conversion below minimumRedemptionPoints", () => {
    const res = calculateCreditFromPoints(50, 25, 100);
    expect(res.allowed).toBe(false);
    expect(res.creditAmount).toBe(0);
  });

  it("converts points into store credit at pointsValuePer100 rate", () => {
    const res = calculateCreditFromPoints(250, 20, 100);
    expect(res.allowed).toBe(true);
    expect(res.creditAmount).toBe(50);
  });
});

describe("Loyalty Engine - Redemption Validation (PRD Section 8.3)", () => {
  it("blocks redemption when card status is frozen or inactive", () => {
    const res = validateRedemption({
      cardStatus: "frozen",
      businessStatus: "active",
      rulesStatus: "active",
      redemptionType: "reward",
      pointsBalance: 500,
      redeemableAmount: 100,
      pointsRequired: 200,
      creditAmountRequired: 0,
      minimumRedemptionPoints: 100,
      rewardStatus: "active",
      stockLimit: 10,
      redeemedCount: 2,
    });

    expect(res.valid).toBe(false);
    expect(res.error).toContain("frozen");
  });

  it("blocks catalog reward redemption when out of stock", () => {
    const res = validateRedemption({
      cardStatus: "active",
      businessStatus: "active",
      rulesStatus: "active",
      redemptionType: "reward",
      pointsBalance: 500,
      redeemableAmount: 100,
      pointsRequired: 200,
      creditAmountRequired: 0,
      minimumRedemptionPoints: 100,
      rewardStatus: "active",
      stockLimit: 5,
      redeemedCount: 5,
    });

    expect(res.valid).toBe(false);
    expect(res.error).toContain("out of stock");
  });

  it("blocks catalog reward redemption when pointsBalance is insufficient", () => {
    const res = validateRedemption({
      cardStatus: "active",
      businessStatus: "active",
      rulesStatus: "active",
      redemptionType: "reward",
      pointsBalance: 140,
      redeemableAmount: 500,
      pointsRequired: 200,
      creditAmountRequired: 0,
      minimumRedemptionPoints: 100,
      rewardStatus: "active",
      stockLimit: null,
      redeemedCount: 0,
    });

    expect(res.valid).toBe(false);
    expect(res.error).toContain("Insufficient points balance");
  });

  it("blocks store credit redemption when redeemableAmount is insufficient", () => {
    const res = validateRedemption({
      cardStatus: "active",
      businessStatus: "active",
      rulesStatus: "active",
      redemptionType: "store_credit",
      pointsBalance: 1000,
      redeemableAmount: 45,
      pointsRequired: 0,
      creditAmountRequired: 100,
      minimumRedemptionPoints: 100,
    });

    expect(res.valid).toBe(false);
    expect(res.error).toContain("Insufficient store credit balance");
  });

  it("allows valid reward and store credit redemptions", () => {
    const rewardRes = validateRedemption({
      cardStatus: "active",
      businessStatus: "active",
      rulesStatus: "active",
      redemptionType: "reward",
      pointsBalance: 350,
      redeemableAmount: 0,
      pointsRequired: 200,
      creditAmountRequired: 0,
      minimumRedemptionPoints: 100,
      rewardStatus: "active",
      stockLimit: 10,
      redeemedCount: 4,
    });
    expect(rewardRes.valid).toBe(true);

    const creditRes = validateRedemption({
      cardStatus: "active",
      businessStatus: "active",
      rulesStatus: "active",
      redemptionType: "store_credit",
      pointsBalance: 0,
      redeemableAmount: 150,
      pointsRequired: 0,
      creditAmountRequired: 100,
      minimumRedemptionPoints: 100,
    });
    expect(creditRes.valid).toBe(true);
  });
});

describe("Loyalty Engine - Claim Submission Window (CLAIM-09)", () => {
  const refNow = new Date("2026-10-30T10:00:00Z");

  it("allows claims within the configured day window", () => {
    const res = isClaimWithinWindow("2026-10-27T10:00:00Z", 7, refNow);
    expect(res.valid).toBe(true);
  });

  it("rejects claims older than the configured day window", () => {
    const res = isClaimWithinWindow("2026-10-15T10:00:00Z", 7, refNow);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("outside the 7-day submission window");
  });

  it("rejects claims dated more than 24h in the future", () => {
    const res = isClaimWithinWindow("2026-11-02T10:00:00Z", 7, refNow);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("future");
  });
});

describe("Loyalty Engine - Role Permissions & Manager Threshold (BAL-09)", () => {
  it("blocks cashiers from manual balance adjustments", () => {
    const res = evaluateAdjustmentPermission("cashier", 50, 0, 500, 25);
    expect(res.allowed).toBe(false);
    expect(res.requiresOwnerApproval).toBe(false);
  });

  it("allows managers to apply adjustments directly within managerAdjustmentLimit", () => {
    const res = evaluateAdjustmentPermission("manager", 300, 0, 500, 25);
    expect(res.allowed).toBe(true);
    expect(res.requiresOwnerApproval).toBe(false);
  });

  it("queues manager adjustments above managerAdjustmentLimit for owner approval", () => {
    const res = evaluateAdjustmentPermission("manager", 750, 0, 500, 25);
    expect(res.allowed).toBe(true);
    expect(res.requiresOwnerApproval).toBe(true);
  });

  it("allows owners unrestricted adjustments without secondary approval", () => {
    const res = evaluateAdjustmentPermission("owner", 5000, 1000, 500, 25);
    expect(res.allowed).toBe(true);
    expect(res.requiresOwnerApproval).toBe(false);
  });
});

describe("Public Card Security, QR Privacy & Phone Verification (CARD-09)", () => {
  it("encodes only the non-sensitive public card URL in QR codes", async () => {
    const url = getPublicCardUrl("cd_araku_ananya_01", "https://loopa.in");
    expect(url).toBe("https://loopa.in/card/cd_araku_ananya_01");
    expect(url).not.toContain("balance");
    expect(url).not.toContain("secret");

    const svg = await generateCardQrSvg("cd_araku_ananya_01", "#18181B", "https://loopa.in");
    expect(svg).toContain("<svg");
  });

  it("verifies last 4 digits of customer phone number accurately", () => {
    expect(verifyPhoneLast4("+91 98765 48765", "8765")).toBe(true);
    expect(verifyPhoneLast4("+919876548765", "9999")).toBe(false);
    expect(verifyPhoneLast4("+919876548765", "65")).toBe(false);
  });

  it("normalizes and masks phone numbers cleanly", () => {
    expect(normalizePhone("9876548765")).toBe("+919876548765");
    expect(maskPhone("+919876548765")).toBe("•••• •••• 8765");
  });

  it("computes points expiry dates accurately when configured", () => {
    const expiry = computeExpiryDate(
      { points_expiry_months: 12 },
      new Date("2026-01-15T00:00:00.000Z")
    );
    expect(expiry).toContain("2027-01-15");
    expect(computeExpiryDate({ points_expiry_months: null })).toBeNull();
  });
});

describe("QR Ordering + Loyalty Engine (QR_ORDERING_LOYALTY_FEATURE.md)", () => {
  it("generates dynamic store QR URL without sensitive data (QR-01..08)", () => {
    const storeUrl = getStoreQrUrl("araku-filter-coffee", "https://loopa.in");
    expect(storeUrl).toBe("https://loopa.in/s/araku-filter-coffee");
    expect(storeUrl).not.toContain("phone");
    expect(storeUrl).not.toContain("balance");
  });

  it("enforces server-side order state transition rules (Section 4)", () => {
    expect(
      canTransitionOrderStatus("awaiting_confirmation", "confirmed")
    ).toBe(true);
    expect(canTransitionOrderStatus("awaiting_confirmation", "rejected")).toBe(
      true
    );
    expect(canTransitionOrderStatus("awaiting_confirmation", "served")).toBe(
      false
    );
    expect(canTransitionOrderStatus("confirmed", "paid")).toBe(true);
    expect(canTransitionOrderStatus("points_credited", "preparing")).toBe(true);
    expect(canTransitionOrderStatus("preparing", "ready")).toBe(true);
    expect(canTransitionOrderStatus("ready", "served")).toBe(true);
    expect(canTransitionOrderStatus("served", "preparing")).toBe(false);
    expect(canTransitionOrderStatus("cancelled", "confirmed")).toBe(false);
  });

  it("resolves safe customer display names without exposing phone numbers (Section 8)", () => {
    expect(
      resolveCustomerDisplayName("Ananya Deshmukh", null, "765")
    ).toBe("Ananya");
    expect(
      resolveCustomerDisplayName("", "Karthik Subramanian", "340")
    ).toBe("Karthik");
    expect(resolveCustomerDisplayName("", "Guest-101", "892")).toBe(
      "Guest-892"
    );
    expect(resolveCustomerDisplayName("+919845098765", "", "765")).toBe(
      "Guest-765"
    );
  });

  it("calculates order points with item-level loyalty multipliers and max cap (Section 8)", () => {
    const calc = calculateOrderPointsEarned({
      purchaseAmount: 700,
      pointsPerCurrencyUnit: 1,
      currencyUnit: 10,
      minimumPurchaseAmount: 50,
      maximumPointsPerTransaction: 500,
      items: [
        { totalPrice: 150, loyaltyMultiplier: 1.0 },
        { totalPrice: 550, loyaltyMultiplier: 1.5 }, // +27.5 -> 27 bonus pts
      ],
    });

    expect(calc.basePoints).toBe(70);
    expect(calc.itemBonusPoints).toBe(27);
    expect(calc.totalPoints).toBe(97);
  });
});


