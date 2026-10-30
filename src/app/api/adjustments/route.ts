import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import {
  manualAdjustmentSchema,
  pointsToCreditConvertSchema,
} from "@/lib/validation";
import {
  calculateCreditFromPoints,
  evaluateAdjustmentPermission,
} from "@/lib/loyalty";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Sub-action A: Convert Points Balance -> Store Credit (redeemable_amount)
  if (body.action === "convert_points_to_credit") {
    const parsed = pointsToCreditConvertSchema.safeParse(body);
    if (!parsed.success || !body.cardId) {
      return NextResponse.json(
        { error: "Valid cardId and pointsToConvert are required." },
        { status: 400 }
      );
    }

    const conversion = calculateCreditFromPoints(
      parsed.data.pointsToConvert,
      ctx.rules.points_value_per_100,
      ctx.rules.minimum_redemption_points
    );

    if (!conversion.allowed) {
      return NextResponse.json({ error: conversion.reason }, { status: 400 });
    }

    try {
      const result = await sql.begin(async (tx) => {
        const cards = await tx`
          SELECT * FROM public.loyalty_cards
          WHERE id = ${body.cardId} AND business_id = ${ctx.business.id}
          FOR UPDATE
        `;
        if (cards.length === 0) throw new Error("CARD_NOT_FOUND");
        const card = cards[0];
        if (card.status !== "active") throw new Error("CARD_INACTIVE");
        if (card.points_balance < parsed.data.pointsToConvert) {
          throw new Error("INSUFFICIENT_POINTS");
        }

        const [updatedCard] = await tx`
          UPDATE public.loyalty_cards
          SET
            points_balance = points_balance - ${parsed.data.pointsToConvert},
            redeemable_amount = redeemable_amount + ${conversion.creditAmount},
            lifetime_points_redeemed = lifetime_points_redeemed + ${parsed.data.pointsToConvert},
            updated_at = NOW()
          WHERE id = ${card.id}
          RETURNING *
        `;

        await tx`
          INSERT INTO public.transactions (
            business_id,
            card_id,
            type,
            points_change,
            amount_change,
            points_balance_after,
            redeemable_amount_after,
            description,
            created_by_user_id
          ) VALUES (
            ${ctx.business.id},
            ${card.id},
            'credit_earned',
            ${-parsed.data.pointsToConvert},
            ${conversion.creditAmount},
            ${updatedCard.points_balance},
            ${updatedCard.redeemable_amount},
            ${`Converted ${parsed.data.pointsToConvert} pts into ₹${conversion.creditAmount} store credit`},
            ${ctx.user.id}
          )
        `;

        return updatedCard;
      });

      await writeAuditLog({
        businessId: ctx.business.id,
        actorUserId: ctx.user.id,
        actorRole: ctx.role,
        action: "wallet.points_converted_to_credit",
        entityType: "loyalty_card",
        entityId: body.cardId,
        afterState: {
          pointsConverted: parsed.data.pointsToConvert,
          creditAdded: conversion.creditAmount,
        },
      });

      return NextResponse.json({ success: true, card: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "INSUFFICIENT_POINTS") {
        return NextResponse.json(
          { error: "Insufficient points balance for conversion." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Could not convert points to credit." },
        { status: 400 }
      );
    }
  }

  // Sub-action B: Manual Adjustment (BAL-08, BAL-09, BAL-10)
  const parsed = manualAdjustmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid adjustment fields." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const perm = evaluateAdjustmentPermission(
    ctx.role,
    d.pointsDelta,
    d.amountDelta,
    ctx.rules.manager_adjustment_limit,
    ctx.rules.points_value_per_100
  );

  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  // BAL-09: Queue for Owner approval if Manager exceeds threshold
  if (perm.requiresOwnerApproval) {
    const [reqRow] = await sql`
      INSERT INTO public.adjustment_requests (
        business_id,
        card_id,
        requested_by_user_id,
        wallet_type,
        points_delta,
        amount_delta,
        reason,
        status
      ) VALUES (
        ${ctx.business.id},
        ${d.cardId},
        ${ctx.user.id},
        ${d.walletType},
        ${d.walletType === "points" ? d.pointsDelta : 0},
        ${d.walletType === "credit" ? d.amountDelta : 0},
        ${d.reason.trim()},
        'pending'
      )
      RETURNING *
    `;

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "adjustment.queued_for_owner_approval",
      entityType: "adjustment_request",
      entityId: reqRow.id,
      afterState: reqRow as Record<string, unknown>,
    });

    return NextResponse.json(
      {
        success: true,
        queuedForApproval: true,
        message: `Adjustment exceeds manager limit (${ctx.rules.manager_adjustment_limit} pts) and has been queued for Owner approval.`,
        adjustmentRequest: reqRow,
      },
      { status: 202 }
    );
  }

  try {
    const result = await sql.begin(async (tx) => {
      const cards = await tx`
        SELECT * FROM public.loyalty_cards
        WHERE id = ${d.cardId} AND business_id = ${ctx.business.id}
        FOR UPDATE
      `;
      if (cards.length === 0) throw new Error("CARD_NOT_FOUND");
      const card = cards[0];

      const pDelta = d.walletType === "points" ? d.pointsDelta : 0;
      const aDelta = d.walletType === "credit" ? d.amountDelta : 0;

      const nextPoints = Number(card.points_balance) + pDelta;
      const nextCredit = Number(card.redeemable_amount) + aDelta;

      // BAL-10: Negative balances are not allowed unless explicitly configured
      if (!ctx.rules.allow_negative_balance && (nextPoints < 0 || nextCredit < 0)) {
        throw new Error("NEGATIVE_BALANCE_NOT_ALLOWED");
      }

      const [updatedCard] = await tx`
        UPDATE public.loyalty_cards
        SET
          points_balance = ${nextPoints},
          redeemable_amount = ${nextCredit},
          lifetime_points_earned = lifetime_points_earned + ${Math.max(0, pDelta)},
          updated_at = NOW()
        WHERE id = ${card.id}
        RETURNING *
      `;

      const [transaction] = await tx`
        INSERT INTO public.transactions (
          business_id,
          card_id,
          type,
          points_change,
          amount_change,
          points_balance_after,
          redeemable_amount_after,
          description,
          created_by_user_id
        ) VALUES (
          ${ctx.business.id},
          ${card.id},
          'adjustment',
          ${pDelta},
          ${aDelta},
          ${updatedCard.points_balance},
          ${updatedCard.redeemable_amount},
          ${`Manual adjustment: ${d.reason.trim()}`},
          ${ctx.user.id}
        )
        RETURNING *
      `;

      return { card, updatedCard, transaction };
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "balance.manual_adjustment",
      entityType: "loyalty_card",
      entityId: d.cardId,
      beforeState: {
        pointsBalance: result.card.points_balance,
        redeemableAmount: result.card.redeemable_amount,
      },
      afterState: {
        pointsBalance: result.updatedCard.points_balance,
        redeemableAmount: result.updatedCard.redeemable_amount,
        reason: d.reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      card: result.updatedCard,
      transaction: result.transaction,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NEGATIVE_BALANCE_NOT_ALLOWED") {
      return NextResponse.json(
        { error: "Adjustment would result in a negative balance, which is disallowed." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to apply manual adjustment." },
      { status: 500 }
    );
  }
}

// Owner approves or rejects a pending Manager adjustment request (BAL-09)
export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRolePermission(ctx.role, ["owner"])) {
    return NextResponse.json(
      { error: "Only the Business Owner can review manager adjustment requests." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { requestId, decision, reviewNote } = body;

  if (!requestId || !["approved", "rejected"].includes(decision)) {
    return NextResponse.json(
      { error: "Valid requestId and decision (approved/rejected) required." },
      { status: 400 }
    );
  }

  try {
    const result = await sql.begin(async (tx) => {
      const reqs = await tx`
        SELECT * FROM public.adjustment_requests
        WHERE id = ${requestId} AND business_id = ${ctx.business.id}
        FOR UPDATE
      `;
      if (reqs.length === 0) throw new Error("NOT_FOUND");
      const req = reqs[0];
      if (req.status !== "pending") throw new Error("ALREADY_REVIEWED");

      if (decision === "rejected") {
        const [updatedReq] = await tx`
          UPDATE public.adjustment_requests
          SET status = 'rejected',
              reviewed_by_user_id = ${ctx.user.id},
              review_note = ${reviewNote || "Rejected by owner"},
              reviewed_at = NOW()
          WHERE id = ${req.id}
          RETURNING *
        `;
        return { updatedReq, updatedCard: null };
      }

      const cards = await tx`
        SELECT * FROM public.loyalty_cards
        WHERE id = ${req.card_id}
        FOR UPDATE
      `;
      const card = cards[0];
      const nextPoints = Number(card.points_balance) + Number(req.points_delta);
      const nextCredit =
        Number(card.redeemable_amount) + Number(req.amount_delta);

      if (!ctx.rules.allow_negative_balance && (nextPoints < 0 || nextCredit < 0)) {
        throw new Error("NEGATIVE_BALANCE");
      }

      const [updatedCard] = await tx`
        UPDATE public.loyalty_cards
        SET
          points_balance = ${nextPoints},
          redeemable_amount = ${nextCredit},
          lifetime_points_earned = lifetime_points_earned + ${Math.max(
            0,
            Number(req.points_delta)
          )},
          updated_at = NOW()
        WHERE id = ${card.id}
        RETURNING *
      `;

      await tx`
        INSERT INTO public.transactions (
          business_id,
          card_id,
          type,
          points_change,
          amount_change,
          points_balance_after,
          redeemable_amount_after,
          description,
          created_by_user_id
        ) VALUES (
          ${ctx.business.id},
          ${card.id},
          'adjustment',
          ${req.points_delta},
          ${req.amount_delta},
          ${updatedCard.points_balance},
          ${updatedCard.redeemable_amount},
          ${`Owner-approved manager adjustment: ${req.reason}`},
          ${ctx.user.id}
        )
      `;

      const [updatedReq] = await tx`
        UPDATE public.adjustment_requests
        SET status = 'approved',
            reviewed_by_user_id = ${ctx.user.id},
            review_note = ${reviewNote || "Approved by owner"},
            reviewed_at = NOW()
        WHERE id = ${req.id}
        RETURNING *
      `;

      return { updatedReq, updatedCard };
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: `adjustment_request.${decision}`,
      entityType: "adjustment_request",
      entityId: requestId,
      afterState: { decision, reviewNote },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: msg || "Failed to review adjustment request." },
      { status: 400 }
    );
  }
}

