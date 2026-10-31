import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { maskPhone } from "@/lib/utils";
import { generateCardQrDataUrl, getPublicCardUrl } from "@/lib/qr";

export async function GET(
  _request: Request,
  { params }: { params: { publicId: string } }
) {
  const rows = await sql`
    SELECT
      lc.*,
      c.full_name AS customer_name,
      c.phone AS customer_phone,
      c.email AS customer_email,
      c.marketing_consent,
      c.loyalty_consent,
      c.status AS customer_status,
      b.name AS business_name,
      b.slug AS business_slug,
      b.logo_url AS business_logo_url,
      b.primary_color AS business_primary_color,
      b.currency AS business_currency,
      b.timezone AS business_timezone,
      b.address AS business_address,
      b.phone AS business_phone,
      b.email AS business_email,
      b.status AS business_status,
      b.instagram_url AS business_instagram_url,
      b.google_review_url AS business_google_review_url
    FROM public.loyalty_cards lc
    JOIN public.customers c ON c.id = lc.customer_id
    JOIN public.businesses b ON b.id = lc.business_id
    WHERE lc.public_id = ${params.publicId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Loyalty card not found." },
      { status: 404 }
    );
  }

  const row = rows[0];
  const [rules] = await sql`
    SELECT * FROM public.loyalty_rules
    WHERE business_id = ${row.business_id}
    LIMIT 1
  `;

  const rewards = await sql`
    SELECT
      id, name, description, image_url, points_required, monetary_value, stock_limit, redeemed_count, status
    FROM public.rewards
    WHERE business_id = ${row.business_id} AND status = 'active'
    ORDER BY points_required ASC
  `;

  const transactions = await sql`
    SELECT
      id, type, points_change, amount_change, points_balance_after, redeemable_amount_after, description, expires_at, created_at
    FROM public.transactions
    WHERE card_id = ${row.id}
    ORDER BY created_at DESC
    LIMIT 30
  `;

  const claims = await sql`
    SELECT
      id, amount, currency, purchase_date, receipt_number, points_awarded, status, review_note, created_at, reviewed_at
    FROM public.purchases
    WHERE card_id = ${row.id} AND source = 'customer_claim'
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const redemptions = await sql`
    SELECT
      rr.id, rr.redemption_type, rr.points_used, rr.monetary_value, rr.status, rr.requested_at, rr.processed_at, rr.notes,
      r.name AS reward_name
    FROM public.reward_redemptions rr
    LEFT JOIN public.rewards r ON r.id = rr.reward_id
    WHERE rr.card_id = ${row.id}
    ORDER BY rr.requested_at DESC
    LIMIT 20
  `;

  const orders = await sql`
    SELECT
      id,
      public_token,
      order_number,
      customer_display_name,
      order_type,
      table_number,
      status,
      total,
      points_earned,
      payment_method,
      payment_status,
      created_at
    FROM public.orders
    WHERE card_id = ${row.id}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const bonusClaims = await sql`
    SELECT task_id, points_awarded, claimed_at
    FROM public.customer_bonus_claims
    WHERE card_id = ${row.id}
  `;

  const qrDataUrl = await generateCardQrDataUrl(
    row.public_id,
    row.business_primary_color
  );

  return NextResponse.json({
    card: {
      id: row.id,
      cardNumber: row.card_number,
      publicId: row.public_id,
      publicUrl: getPublicCardUrl(row.public_id),
      status: row.status,
      pointsBalance: Number(row.points_balance),
      redeemableAmount: Number(row.redeemable_amount),
      pendingPoints: Number(row.pending_points),
      lifetimePointsEarned: Number(row.lifetime_points_earned),
      lifetimePointsRedeemed: Number(row.lifetime_points_redeemed),
      lifetimePurchaseAmount: Number(row.lifetime_purchase_amount),
      qrDataUrl,
    },
    customer: {
      fullName: row.customer_name,
      maskedPhone: maskPhone(row.customer_phone),
      marketingConsent: Boolean(row.marketing_consent),
      loyaltyConsent: Boolean(row.loyalty_consent),
      status: row.customer_status,
    },
    business: {
      name: row.business_name,
      slug: row.business_slug,
      logoUrl: row.business_logo_url,
      primaryColor: row.business_primary_color,
      currency: row.business_currency,
      address: row.business_address,
      phone: row.business_phone,
      email: row.business_email,
      status: row.business_status,
      instagramUrl: row.business_instagram_url || null,
      googleReviewUrl: row.business_google_review_url || null,
    },
    rules: rules
      ? {
          pointsPerCurrencyUnit: Number(rules.points_per_currency_unit),
          currencyUnit: Number(rules.currency_unit),
          minimumPurchaseAmount: Number(rules.minimum_purchase_amount),
          maximumPointsPerTransaction: Number(rules.maximum_points_per_transaction),
          pointsValuePer100: Number(rules.points_value_per_100),
          minimumRedemptionPoints: Number(rules.minimum_redemption_points),
          claimEnabled: Boolean(rules.claim_enabled),
          claimWindowDays: Number(rules.claim_window_days),
          dailyClaimLimit: Number(rules.daily_claim_limit),
          receiptRequiredAboveAmount: Number(rules.receipt_required_above_amount),
          campaignName: rules.campaign_name,
          campaignMultiplier: Number(rules.campaign_multiplier || 1),
        }
      : null,
    rewards,
    transactions,
    claims,
    redemptions,
    orders,
    claimedBonusTasks: bonusClaims.map((bc) => bc.task_id as string),
  });
}

