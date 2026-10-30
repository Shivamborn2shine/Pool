import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { purchaseRecordSchema } from "@/lib/validation";
import { calculatePointsEarned, computeExpiryDate } from "@/lib/loyalty";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status") || "";
  const source = searchParams.get("source") || "";

  const rows = await sql`
    SELECT
      p.*,
      c.full_name AS customer_name,
      c.phone AS customer_phone,
      lc.card_number,
      lc.public_id AS card_public_id,
      bl.name AS location_name,
      u.full_name AS recorded_by_name
    FROM public.purchases p
    JOIN public.customers c ON c.id = p.customer_id
    JOIN public.loyalty_cards lc ON lc.id = p.card_id
    LEFT JOIN public.business_locations bl ON bl.id = p.location_id
    LEFT JOIN public.users u ON u.id = p.created_by_user_id
    WHERE p.business_id = ${ctx.business.id}
      ${
        q
          ? sql`AND (
              c.full_name ILIKE ${"%" + q + "%"}
              OR c.phone ILIKE ${"%" + q + "%"}
              OR lc.card_number ILIKE ${"%" + q + "%"}
              OR COALESCE(p.receipt_number, '') ILIKE ${"%" + q + "%"}
            )`
          : sql``
      }
      ${status ? sql`AND p.status = ${status}` : sql``}
      ${source ? sql`AND p.source = ${source}` : sql``}
    ORDER BY p.purchase_date DESC, p.created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ purchases: rows });
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = purchaseRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid purchase fields." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const calc = calculatePointsEarned({
      purchaseAmount: d.amount,
      pointsPerCurrencyUnit: ctx.rules.points_per_currency_unit,
      currencyUnit: ctx.rules.currency_unit,
      minimumPurchaseAmount: ctx.rules.minimum_purchase_amount,
      maximumPointsPerTransaction: ctx.rules.maximum_points_per_transaction,
      campaignMultiplier: ctx.rules.campaign_multiplier,
      campaignEndsAt: ctx.rules.campaign_ends_at,
    });

    // PUR-05: Staff with permission (owner/manager) can adjust final granted points within limits
    let finalPoints = calc.totalPoints;
    if (
      d.overridePoints !== undefined &&
      d.overridePoints !== null &&
      (ctx.role === "owner" || ctx.role === "manager")
    ) {
      finalPoints = Math.min(
        Math.max(0, d.overridePoints),
        ctx.rules.maximum_points_per_transaction
      );
    }

    const expiresAt = computeExpiryDate(ctx.rules);
    const purchaseDateIso = d.purchaseDate
      ? new Date(d.purchaseDate).toISOString()
      : new Date().toISOString();

    const result = await sql.begin(async (tx) => {
      // Lock card row for atomic concurrency safety (Section 8.4)
      const cards = await tx`
        SELECT * FROM public.loyalty_cards
        WHERE id = ${d.cardId}
          AND customer_id = ${d.customerId}
          AND business_id = ${ctx.business.id}
        FOR UPDATE
      `;

      if (cards.length === 0) {
        throw new Error("CARD_NOT_FOUND");
      }

      const card = cards[0];
      if (card.status !== "active") {
        throw new Error(`CARD_${card.status.toUpperCase()}`);
      }

      const [purchase] = await tx`
        INSERT INTO public.purchases (
          business_id,
          location_id,
          customer_id,
          card_id,
          amount,
          currency,
          purchase_date,
          receipt_number,
          category,
          notes,
          points_awarded,
          source,
          status,
          created_by_user_id
        ) VALUES (
          ${ctx.business.id},
          ${d.locationId || null},
          ${d.customerId},
          ${d.cardId},
          ${d.amount},
          ${ctx.business.currency},
          ${purchaseDateIso},
          ${d.receiptNumber || null},
          ${d.category || null},
          ${d.notes || null},
          ${finalPoints},
          'admin_entered',
          'approved',
          ${ctx.user.id}
        )
        RETURNING *
      `;

      const [updatedCard] = await tx`
        UPDATE public.loyalty_cards
        SET
          points_balance = points_balance + ${finalPoints},
          lifetime_points_earned = lifetime_points_earned + ${finalPoints},
          lifetime_purchase_amount = lifetime_purchase_amount + ${d.amount},
          updated_at = NOW()
        WHERE id = ${card.id}
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
          metadata,
          expires_at,
          created_by_user_id
        ) VALUES (
          ${ctx.business.id},
          ${card.id},
          ${purchase.id},
          'points_earned',
          ${finalPoints},
          ${d.amount},
          ${updatedCard.points_balance},
          ${updatedCard.redeemable_amount},
          ${`Purchase recorded: ₹${d.amount}${
            d.receiptNumber ? ` (Receipt #${d.receiptNumber})` : ""
          }`},
          ${tx.json({
            basePoints: calc.basePoints,
            campaignBonusPoints: calc.campaignBonusPoints,
            multiplier: calc.effectiveMultiplier,
          } as never)},
          ${expiresAt},
          ${ctx.user.id}
        )
        RETURNING *
      `;

      return { purchase, updatedCard, transaction };
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "purchase.recorded",
      entityType: "purchase",
      entityId: result.purchase.id,
      afterState: {
        amount: d.amount,
        pointsAwarded: finalPoints,
        cardId: d.cardId,
        receiptNumber: d.receiptNumber,
      },
    });

    return NextResponse.json(
      {
        success: true,
        purchase: result.purchase,
        card: result.updatedCard,
        transaction: result.transaction,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "CARD_NOT_FOUND") {
      return NextResponse.json(
        { error: "Customer loyalty card not found." },
        { status: 404 }
      );
    }
    if (msg.startsWith("CARD_")) {
      return NextResponse.json(
        { error: "Cannot record purchase on a frozen or closed card." },
        { status: 400 }
      );
    }
    console.error("POST /api/purchases error:", err);
    return NextResponse.json(
      { error: "Failed to record purchase." },
      { status: 500 }
    );
  }
}

