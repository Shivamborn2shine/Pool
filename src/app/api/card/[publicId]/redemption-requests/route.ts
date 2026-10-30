import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  customerRedemptionRequestSchema,
  pointsToCreditConvertSchema,
} from "@/lib/validation";
import { checkRateLimit, getClientContext } from "@/lib/auth";
import { verifyPhoneLast4 } from "@/lib/utils";
import {
  calculateCreditFromPoints,
  validateRedemption,
} from "@/lib/loyalty";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { ipAddress } = getClientContext();
    const rate = await checkRateLimit(
      `redeem-req:${params.publicId}:${ipAddress}`,
      12,
      600
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many redemption requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();

    const rows = await sql`
      SELECT
        lc.*,
        c.phone AS customer_phone,
        b.status AS business_status
      FROM public.loyalty_cards lc
      JOIN public.customers c ON c.id = lc.customer_id
      JOIN public.businesses b ON b.id = lc.business_id
      WHERE lc.public_id = ${params.publicId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const card = rows[0];
    if (!verifyPhoneLast4(card.customer_phone, String(body.phoneLast4 || ""))) {
      return NextResponse.json(
        {
          error:
            "Phone verification failed. Enter the last 4 digits of your registered phone number.",
        },
        { status: 403 }
      );
    }

    const [rules] = await sql`
      SELECT * FROM public.loyalty_rules
      WHERE business_id = ${card.business_id}
      LIMIT 1
    `;

    // Action A: Customer converts points -> store credit (Separate Wallets A1)
    if (body.action === "convert_points_to_credit") {
      const parsed = pointsToCreditConvertSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Enter a valid number of points to convert." },
          { status: 400 }
        );
      }

      const conv = calculateCreditFromPoints(
        parsed.data.pointsToConvert,
        Number(rules.points_value_per_100),
        Number(rules.minimum_redemption_points)
      );

      if (!conv.allowed) {
        return NextResponse.json({ error: conv.reason }, { status: 400 });
      }

      const updated = await sql.begin(async (tx) => {
        const locked = await tx`
          SELECT * FROM public.loyalty_cards WHERE id = ${card.id} FOR UPDATE
        `;
        const c = locked[0];
        if (c.status !== "active") throw new Error("Card is not active.");
        if (Number(c.points_balance) < parsed.data.pointsToConvert) {
          throw new Error("Insufficient points balance.");
        }

        const [nextCard] = await tx`
          UPDATE public.loyalty_cards
          SET
            points_balance = points_balance - ${parsed.data.pointsToConvert},
            redeemable_amount = redeemable_amount + ${conv.creditAmount},
            lifetime_points_redeemed = lifetime_points_redeemed + ${parsed.data.pointsToConvert},
            updated_at = NOW()
          WHERE id = ${c.id}
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
            description
          ) VALUES (
            ${c.business_id},
            ${c.id},
            'credit_earned',
            ${-parsed.data.pointsToConvert},
            ${conv.creditAmount},
            ${nextCard.points_balance},
            ${nextCard.redeemable_amount},
            ${`Converted ${parsed.data.pointsToConvert} pts into ₹${conv.creditAmount} store credit`}
          )
        `;

        return nextCard;
      });

      return NextResponse.json({
        success: true,
        card: updated,
        creditAdded: conv.creditAmount,
      });
    }

    // Action B: Customer Redemption Request (Deducts immediately; reversed if cancelled/rejected)
    const parsed = customerRedemptionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid redemption request." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const result = await sql.begin(async (tx) => {
      const locked = await tx`
        SELECT * FROM public.loyalty_cards WHERE id = ${card.id} FOR UPDATE
      `;
      const lockedCard = locked[0];

      let rewardRow = null;
      let pointsUsed = 0;
      let monetaryValue = 0;
      let txDesc = "";
      let txType: "points_redeemed" | "credit_redeemed" = "points_redeemed";

      if (d.redemptionType === "reward") {
        if (!d.rewardId) throw new Error("Select a reward to request.");
        const rewards = await tx`
          SELECT * FROM public.rewards
          WHERE id = ${d.rewardId} AND business_id = ${card.business_id}
          FOR UPDATE
        `;
        if (rewards.length === 0) throw new Error("Reward not found.");
        rewardRow = rewards[0];
        pointsUsed = Number(rewardRow.points_required);
        monetaryValue = Number(rewardRow.monetary_value);
        txDesc = `Redemption requested: ${rewardRow.name} (${pointsUsed} pts)`;
        txType = "points_redeemed";
      } else {
        monetaryValue = Number(d.creditAmount || 0);
        txDesc = `Store credit redemption requested: ₹${monetaryValue.toFixed(2)}`;
        txType = "credit_redeemed";
      }

      const check = validateRedemption({
        cardStatus: lockedCard.status,
        businessStatus: card.business_status,
        rulesStatus: rules.status,
        redemptionType: d.redemptionType,
        pointsBalance: Number(lockedCard.points_balance),
        redeemableAmount: Number(lockedCard.redeemable_amount),
        pointsRequired: pointsUsed,
        creditAmountRequired: monetaryValue,
        minimumRedemptionPoints: Number(rules.minimum_redemption_points),
        rewardStatus: rewardRow?.status,
        stockLimit: rewardRow?.stock_limit,
        redeemedCount: rewardRow ? Number(rewardRow.redeemed_count) : 0,
      });

      if (!check.valid) {
        throw new Error(check.error || "Cannot process redemption request.");
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
        WHERE id = ${lockedCard.id}
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
          requested_by_customer_id,
          requested_at,
          notes
        ) VALUES (
          ${card.business_id},
          ${lockedCard.id},
          ${rewardRow ? rewardRow.id : null},
          ${d.redemptionType},
          ${pointsUsed},
          ${monetaryValue},
          'requested',
          ${card.customer_id},
          NOW(),
          ${d.notes || null}
        )
        RETURNING *
      `;

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
          description
        ) VALUES (
          ${card.business_id},
          ${lockedCard.id},
          ${redemption.id},
          ${txType},
          ${-pointsUsed},
          ${d.redemptionType === "store_credit" ? -monetaryValue : 0},
          ${updatedCard.points_balance},
          ${updatedCard.redeemable_amount},
          ${txDesc}
        )
      `;

      return { redemption, updatedCard };
    });

    await writeAuditLog({
      businessId: card.business_id,
      actorRole: "customer",
      action: "redemption.requested",
      entityType: "reward_redemption",
      entityId: result.redemption.id,
      afterState: {
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
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to submit redemption request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

