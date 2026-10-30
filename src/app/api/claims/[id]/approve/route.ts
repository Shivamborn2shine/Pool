import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { claimApproveSchema } from "@/lib/validation";
import { calculatePointsEarned, computeExpiryDate } from "@/lib/loyalty";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Section 9: Only Owner and Manager can approve/reject claims
  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only Owners and Managers can approve purchase claims." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = claimApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid approval input." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const expiresAt = computeExpiryDate(ctx.rules);

    const result = await sql.begin(async (tx) => {
      const claims = await tx`
        SELECT * FROM public.purchases
        WHERE id = ${params.id}
          AND business_id = ${ctx.business.id}
          AND source = 'customer_claim'
        FOR UPDATE
      `;

      if (claims.length === 0) {
        throw new Error("CLAIM_NOT_FOUND");
      }

      const claim = claims[0];
      if (claim.status !== "pending") {
        throw new Error("CLAIM_ALREADY_PROCESSED");
      }

      const finalAmount =
        d.adjustedAmount !== undefined ? d.adjustedAmount : Number(claim.amount);

      const calc = calculatePointsEarned({
        purchaseAmount: finalAmount,
        pointsPerCurrencyUnit: ctx.rules.points_per_currency_unit,
        currencyUnit: ctx.rules.currency_unit,
        minimumPurchaseAmount: ctx.rules.minimum_purchase_amount,
        maximumPointsPerTransaction: ctx.rules.maximum_points_per_transaction,
        campaignMultiplier: ctx.rules.campaign_multiplier,
        campaignEndsAt: ctx.rules.campaign_ends_at,
      });

      const finalPoints =
        d.overridePoints !== undefined
          ? Math.min(
              Math.max(0, d.overridePoints),
              ctx.rules.maximum_points_per_transaction
            )
          : calc.totalPoints;

      const originalPendingPoints = Number(claim.points_awarded || 0);

      const [updatedClaim] = await tx`
        UPDATE public.purchases
        SET
          amount = ${finalAmount},
          points_awarded = ${finalPoints},
          status = 'approved',
          reviewed_by_user_id = ${ctx.user.id},
          reviewed_at = NOW(),
          review_note = ${d.reviewNote || "Approved by admin"},
          updated_at = NOW()
        WHERE id = ${claim.id}
        RETURNING *
      `;

      const [updatedCard] = await tx`
        UPDATE public.loyalty_cards
        SET
          points_balance = points_balance + ${finalPoints},
          pending_points = GREATEST(0, pending_points - ${originalPendingPoints}),
          lifetime_points_earned = lifetime_points_earned + ${finalPoints},
          lifetime_purchase_amount = lifetime_purchase_amount + ${finalAmount},
          updated_at = NOW()
        WHERE id = ${claim.card_id}
        RETURNING *
      `;

      const [transaction] = await tx`
        INSERT INTO public.transactions (
          business_id,
          card_id,
          purchase_id,
          type,
          points_change,
          amount_change,
          points_balance_after,
          redeemable_amount_after,
          description,
          expires_at,
          created_by_user_id
        ) VALUES (
          ${ctx.business.id},
          ${claim.card_id},
          ${claim.id},
          'points_earned',
          ${finalPoints},
          ${finalAmount},
          ${updatedCard.points_balance},
          ${updatedCard.redeemable_amount},
          ${`Approved purchase claim ₹${finalAmount}${
            claim.receipt_number ? ` (Receipt #${claim.receipt_number})` : ""
          }`},
          ${expiresAt},
          ${ctx.user.id}
        )
        RETURNING *
      `;

      return { claim, updatedClaim, updatedCard, transaction };
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "claim.approved",
      entityType: "purchase",
      entityId: params.id,
      beforeState: {
        status: result.claim.status,
        amount: result.claim.amount,
        points: result.claim.points_awarded,
      },
      afterState: {
        status: "approved",
        amount: result.updatedClaim.amount,
        points: result.updatedClaim.points_awarded,
      },
    });

    return NextResponse.json({
      success: true,
      claim: result.updatedClaim,
      card: result.updatedCard,
      transaction: result.transaction,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "CLAIM_NOT_FOUND") {
      return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    }
    if (msg === "CLAIM_ALREADY_PROCESSED") {
      return NextResponse.json(
        { error: "This claim has already been reviewed." },
        { status: 409 }
      );
    }
    console.error("PATCH /api/claims/[id]/approve error:", err);
    return NextResponse.json(
      { error: "Failed to approve claim." },
      { status: 500 }
    );
  }
}

