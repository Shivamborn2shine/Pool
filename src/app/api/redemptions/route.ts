import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { adminRedemptionSchema } from "@/lib/validation";
import { validateRedemption } from "@/lib/loyalty";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";

  const redemptions = await sql`
    SELECT
      rr.*,
      r.name AS reward_name,
      c.full_name AS customer_name,
      c.phone AS customer_phone,
      lc.card_number,
      lc.public_id AS card_public_id,
      u.full_name AS processed_by_name
    FROM public.reward_redemptions rr
    JOIN public.loyalty_cards lc ON lc.id = rr.card_id
    JOIN public.customers c ON c.id = lc.customer_id
    LEFT JOIN public.rewards r ON r.id = rr.reward_id
    LEFT JOIN public.users u ON u.id = rr.processed_by_user_id
    WHERE rr.business_id = ${ctx.business.id}
      ${status ? sql`AND rr.status = ${status}` : sql``}
    ORDER BY
      CASE WHEN rr.status = 'requested' THEN 0 ELSE 1 END ASC,
      rr.requested_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ redemptions });
}

// Staff direct redemption at counter (RWD-06, RWD-07, RWD-08)
export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = adminRedemptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid redemption request." },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const result = await sql.begin(async (tx) => {
      const cards = await tx`
        SELECT * FROM public.loyalty_cards
        WHERE id = ${d.cardId} AND business_id = ${ctx.business.id}
        FOR UPDATE
      `;
      if (cards.length === 0) throw new Error("Loyalty card not found.");
      const card = cards[0];

      let rewardRow = null;
      let pointsUsed = 0;
      let monetaryValue = 0;
      let txDescription = "";
      let txType: "points_redeemed" | "credit_redeemed" = "points_redeemed";

      if (d.redemptionType === "reward") {
        if (!d.rewardId) {
          throw new Error("Select a catalog reward to redeem.");
        }
        const rewards = await tx`
          SELECT * FROM public.rewards
          WHERE id = ${d.rewardId} AND business_id = ${ctx.business.id}
          FOR UPDATE
        `;
        if (rewards.length === 0) throw new Error("Reward not found.");
        rewardRow = rewards[0];
        pointsUsed = Number(rewardRow.points_required);
        monetaryValue = Number(rewardRow.monetary_value);
        txDescription = `Redeemed reward: ${rewardRow.name} (${pointsUsed} pts)`;
        txType = "points_redeemed";
      } else {
        monetaryValue = Number(d.creditAmount || 0);
        txDescription = `Redeemed store credit: ₹${monetaryValue.toFixed(2)}`;
        txType = "credit_redeemed";
      }

      const check = validateRedemption({
        cardStatus: card.status,
        businessStatus: ctx.business.status,
        rulesStatus: ctx.rules.status,
        redemptionType: d.redemptionType,
        pointsBalance: Number(card.points_balance),
        redeemableAmount: Number(card.redeemable_amount),
        pointsRequired: pointsUsed,
        creditAmountRequired: monetaryValue,
        minimumRedemptionPoints: ctx.rules.minimum_redemption_points,
        rewardStatus: rewardRow?.status,
        stockLimit: rewardRow?.stock_limit,
        redeemedCount: rewardRow ? Number(rewardRow.redeemed_count) : 0,
      });

      if (!check.valid) {
        throw new Error(check.error || "Redemption validation failed.");
      }

      const [updatedCard] = await tx`
        UPDATE public.loyalty_cards
        SET
          points_balance = points_balance - ${pointsUsed},
          redeemable_amount = redeemable_amount - ${
            d.redemptionType === "store_credit" ? monetaryValue : 0
          },
          lifetime_points_redeemed = lifetime_points_redeemed + ${pointsUsed},
          updated_at = NOW()
        WHERE id = ${card.id}
        RETURNING *
      `;

      if (rewardRow) {
        await tx`
          UPDATE public.rewards
          SET redeemed_count = redeemed_count + 1, updated_at = NOW()
          WHERE id = ${rewardRow.id}
        `;
      }

      const [redemption] = await tx`
        INSERT INTO public.reward_redemptions (
          business_id,
          card_id,
          reward_id,
          redemption_type,
          points_used,
          monetary_value,
          status,
          processed_by_user_id,
          requested_at,
          processed_at,
          notes
        ) VALUES (
          ${ctx.business.id},
          ${card.id},
          ${rewardRow ? rewardRow.id : null},
          ${d.redemptionType},
          ${pointsUsed},
          ${monetaryValue},
          'fulfilled',
          ${ctx.user.id},
          NOW(),
          NOW(),
          ${d.notes || null}
        )
        RETURNING *
      `;

      const [transaction] = await tx`
        INSERT INTO public.transactions (
          business_id,
          card_id,
          reward_redemption_id,
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
          ${redemption.id},
          ${txType},
          ${-pointsUsed},
          ${d.redemptionType === "store_credit" ? -monetaryValue : 0},
          ${updatedCard.points_balance},
          ${updatedCard.redeemable_amount},
          ${txDescription},
          ${ctx.user.id}
        )
        RETURNING *
      `;

      return { updatedCard, redemption, transaction };
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "redemption.fulfilled",
      entityType: "reward_redemption",
      entityId: result.redemption.id,
      afterState: {
        cardId: d.cardId,
        redemptionType: d.redemptionType,
        pointsUsed: result.redemption.points_used,
        monetaryValue: result.redemption.monetary_value,
      },
    });

    return NextResponse.json(
      {
        success: true,
        redemption: result.redemption,
        card: result.updatedCard,
        transaction: result.transaction,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to redeem.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// Staff updates status of a customer-requested redemption (RWD-10)
// If rejected or cancelled, creates an immutable reversal transaction restoring balance!
export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { redemptionId, status, notes } = body;

    if (
      !redemptionId ||
      !["approved", "fulfilled", "cancelled", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Valid redemptionId and target status required." },
        { status: 400 }
      );
    }

    const result = await sql.begin(async (tx) => {
      const rows = await tx`
        SELECT * FROM public.reward_redemptions
        WHERE id = ${redemptionId} AND business_id = ${ctx.business.id}
        FOR UPDATE
      `;
      if (rows.length === 0) throw new Error("Redemption record not found.");
      const redemption = rows[0];

      if (["cancelled", "rejected", "fulfilled"].includes(redemption.status)) {
        throw new Error(`Redemption is already ${redemption.status}.`);
      }

      const [updatedRedemption] = await tx`
        UPDATE public.reward_redemptions
        SET
          status = ${status},
          processed_by_user_id = ${ctx.user.id},
          processed_at = NOW(),
          notes = ${notes || redemption.notes},
          updated_at = NOW()
        WHERE id = ${redemption.id}
        RETURNING *
      `;

      let updatedCard = null;
      if (status === "cancelled" || status === "rejected") {
        const pointsRestore = Number(redemption.points_used || 0);
        const creditRestore =
          redemption.redemption_type === "store_credit"
            ? Number(redemption.monetary_value || 0)
            : 0;

        const [cardRow] = await tx`
          UPDATE public.loyalty_cards
          SET
            points_balance = points_balance + ${pointsRestore},
            redeemable_amount = redeemable_amount + ${creditRestore},
            lifetime_points_redeemed = GREATEST(0, lifetime_points_redeemed - ${pointsRestore}),
            updated_at = NOW()
          WHERE id = ${redemption.card_id}
          RETURNING *
        `;
        updatedCard = cardRow;

        if (redemption.reward_id) {
          await tx`
            UPDATE public.rewards
            SET redeemed_count = GREATEST(0, redeemed_count - 1), updated_at = NOW()
            WHERE id = ${redemption.reward_id}
          `;
        }

        await tx`
          INSERT INTO public.transactions (
            business_id,
            card_id,
            reward_redemption_id,
            type,
            points_change,
            amount_change,
            points_balance_after,
            redeemable_amount_after,
            description,
            created_by_user_id
          ) VALUES (
            ${ctx.business.id},
            ${redemption.card_id},
            ${redemption.id},
            'reversal',
            ${pointsRestore},
            ${creditRestore},
            ${cardRow.points_balance},
            ${cardRow.redeemable_amount},
            ${`Reversal for ${status} redemption request${
              notes ? `: ${notes}` : ""
            }`},
            ${ctx.user.id}
          )
        `;
      }

      return { redemption, updatedRedemption, updatedCard };
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: `redemption.${status}`,
      entityType: "reward_redemption",
      entityId: redemptionId,
      beforeState: { status: result.redemption.status },
      afterState: { status, notes },
    });

    return NextResponse.json({
      success: true,
      redemption: result.updatedRedemption,
      card: result.updatedCard,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update redemption.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

