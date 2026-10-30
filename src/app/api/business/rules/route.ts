import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { loyaltyRulesSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ rules: ctx.rules, role: ctx.role });
}

export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Section 9: Owner and Manager can manage loyalty rules
  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only Owners and Managers can update loyalty rules." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = loyaltyRulesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid rule values." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const [updated] = await sql`
    UPDATE public.loyalty_rules
    SET
      points_per_currency_unit = ${d.pointsPerCurrencyUnit},
      currency_unit = ${d.currencyUnit},
      minimum_purchase_amount = ${d.minimumPurchaseAmount},
      maximum_points_per_transaction = ${d.maximumPointsPerTransaction},
      points_value_per_100 = ${d.pointsValuePer100},
      minimum_redemption_points = ${d.minimumRedemptionPoints},
      claim_enabled = ${d.claimEnabled},
      claim_window_days = ${d.claimWindowDays},
      daily_claim_limit = ${d.dailyClaimLimit},
      receipt_required_above_amount = ${d.receiptRequiredAboveAmount},
      signup_bonus_points = ${d.signupBonusPoints},
      points_expiry_months = ${d.pointsExpiryMonths ?? null},
      campaign_name = ${d.campaignName || null},
      campaign_multiplier = ${d.campaignMultiplier},
      campaign_ends_at = ${d.campaignEndsAt || null},
      manager_adjustment_limit = ${d.managerAdjustmentLimit},
      allow_negative_balance = ${d.allowNegativeBalance},
      status = ${d.status},
      updated_at = NOW()
    WHERE business_id = ${ctx.business.id}
    RETURNING *
  `;

  await writeAuditLog({
    businessId: ctx.business.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.role,
    action: "loyalty_rules.updated",
    entityType: "loyalty_rules",
    entityId: updated.id,
    beforeState: ctx.rules as unknown as Record<string, unknown>,
    afterState: updated as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, rules: updated });
}

