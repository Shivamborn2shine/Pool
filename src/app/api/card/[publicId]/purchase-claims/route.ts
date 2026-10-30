import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { customerClaimSchema } from "@/lib/validation";
import { checkRateLimit, getClientContext } from "@/lib/auth";
import { verifyPhoneLast4 } from "@/lib/utils";
import { calculatePointsEarned, isClaimWithinWindow } from "@/lib/loyalty";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { ipAddress } = getClientContext();
    const rate = await checkRateLimit(
      `claim:${params.publicId}:${ipAddress}`,
      10,
      600
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many claim submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = customerClaimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid claim input." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const rows = await sql`
      SELECT
        lc.*,
        c.phone AS customer_phone,
        b.currency AS business_currency,
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
    if (card.status !== "active" || card.business_status !== "active") {
      return NextResponse.json(
        { error: "This card or loyalty program is not currently active." },
        { status: 400 }
      );
    }

    // Verify phone last 4 digits (Public card protection A4)
    if (!verifyPhoneLast4(card.customer_phone, d.phoneLast4)) {
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

    if (!rules || !rules.claim_enabled) {
      return NextResponse.json(
        { error: "Customer purchase claims are disabled for this business." },
        { status: 400 }
      );
    }

    // RULE-07: Check daily claim limit per card
    const [todayClaims] = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.purchases
      WHERE card_id = ${card.id}
        AND source = 'customer_claim'
        AND created_at >= CURRENT_DATE
    `;
    if (todayClaims.count >= Number(rules.daily_claim_limit)) {
      return NextResponse.json(
        {
          error: `Daily claim limit (${rules.daily_claim_limit} per day) reached. Please try again tomorrow.`,
        },
        { status: 429 }
      );
    }

    // CLAIM-10: Receipt photo required above configured amount
    if (
      d.amount >= Number(rules.receipt_required_above_amount) &&
      !d.receiptFileUrl
    ) {
      return NextResponse.json(
        {
          error: `A receipt photo or PDF is required for claims of ₹${rules.receipt_required_above_amount} or above.`,
        },
        { status: 400 }
      );
    }

    const calc = calculatePointsEarned({
      purchaseAmount: d.amount,
      pointsPerCurrencyUnit: Number(rules.points_per_currency_unit),
      currencyUnit: Number(rules.currency_unit),
      minimumPurchaseAmount: Number(rules.minimum_purchase_amount),
      maximumPointsPerTransaction: Number(rules.maximum_points_per_transaction),
      campaignMultiplier: Number(rules.campaign_multiplier || 1),
      campaignEndsAt: rules.campaign_ends_at,
    });

    // CLAIM-09: Claims outside allowed window are rejected automatically as 'expired'
    const windowCheck = isClaimWithinWindow(
      d.purchaseDate,
      Number(rules.claim_window_days)
    );

    if (!windowCheck.valid) {
      const [expiredClaim] = await sql`
        INSERT INTO public.purchases (
          business_id,
          customer_id,
          card_id,
          amount,
          currency,
          purchase_date,
          receipt_number,
          receipt_file_url,
          notes,
          points_awarded,
          source,
          status,
          claimed_by_customer_id,
          review_note
        ) VALUES (
          ${card.business_id},
          ${card.customer_id},
          ${card.id},
          ${d.amount},
          ${card.business_currency},
          ${new Date(d.purchaseDate).toISOString()},
          ${d.receiptNumber || null},
          ${d.receiptFileUrl || null},
          ${d.notes || null},
          0,
          'customer_claim',
          'expired',
          ${card.customer_id},
          ${windowCheck.reason || "Outside claim window"}
        )
        RETURNING *
      `;

      return NextResponse.json(
        {
          error: windowCheck.reason,
          claim: expiredClaim,
        },
        { status: 400 }
      );
    }

    // CLAIM-08: Detect duplicate amount/date/receipt submissions
    const dupRows = await sql`
      SELECT id FROM public.purchases
      WHERE card_id = ${card.id}
        AND status IN ('pending', 'approved')
        AND (
          (
            receipt_number IS NOT NULL
            AND receipt_number <> ''
            AND LOWER(receipt_number) = LOWER(${d.receiptNumber || ""})
          )
          OR (
            amount = ${d.amount}
            AND DATE(purchase_date) = DATE(${new Date(d.purchaseDate).toISOString()})
          )
        )
      LIMIT 1
    `;

    if (dupRows.length > 0) {
      const [dupClaim] = await sql`
        INSERT INTO public.purchases (
          business_id,
          customer_id,
          card_id,
          amount,
          currency,
          purchase_date,
          receipt_number,
          receipt_file_url,
          notes,
          points_awarded,
          source,
          status,
          claimed_by_customer_id,
          review_note
        ) VALUES (
          ${card.business_id},
          ${card.customer_id},
          ${card.id},
          ${d.amount},
          ${card.business_currency},
          ${new Date(d.purchaseDate).toISOString()},
          ${d.receiptNumber || null},
          ${d.receiptFileUrl || null},
          ${d.notes || null},
          0,
          'customer_claim',
          'duplicate',
          ${card.customer_id},
          'Automatically flagged as duplicate of an existing purchase or claim'
        )
        RETURNING *
      `;

      return NextResponse.json(
        {
          error:
            "A purchase or claim with this receipt number or same amount and date already exists.",
          claim: dupClaim,
        },
        { status: 409 }
      );
    }

    const created = await sql.begin(async (tx) => {
      const [claim] = await tx`
        INSERT INTO public.purchases (
          business_id,
          customer_id,
          card_id,
          amount,
          currency,
          purchase_date,
          receipt_number,
          receipt_file_url,
          notes,
          points_awarded,
          source,
          status,
          claimed_by_customer_id
        ) VALUES (
          ${card.business_id},
          ${card.customer_id},
          ${card.id},
          ${d.amount},
          ${card.business_currency},
          ${new Date(d.purchaseDate).toISOString()},
          ${d.receiptNumber || null},
          ${d.receiptFileUrl || null},
          ${d.notes || null},
          ${calc.totalPoints},
          'customer_claim',
          'pending',
          ${card.customer_id}
        )
        RETURNING *
      `;

      await tx`
        UPDATE public.loyalty_cards
        SET pending_points = pending_points + ${calc.totalPoints},
            updated_at = NOW()
        WHERE id = ${card.id}
      `;

      return claim;
    });

    await writeAuditLog({
      businessId: card.business_id,
      actorRole: "customer",
      action: "claim.submitted",
      entityType: "purchase",
      entityId: created.id,
      afterState: {
        amount: d.amount,
        estimatedPoints: calc.totalPoints,
        receiptNumber: d.receiptNumber,
      },
    });

    return NextResponse.json(
      {
        success: true,
        claim: created,
        estimatedPoints: calc.totalPoints,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/card/[publicId]/purchase-claims error:", err);
    return NextResponse.json(
      { error: "Failed to submit purchase claim." },
      { status: 500 }
    );
  }
}

