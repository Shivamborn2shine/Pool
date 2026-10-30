import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const startDate = fromParam
    ? new Date(fromParam)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = toParam ? new Date(toParam) : new Date();

  const [cardStats] = await sql`
    SELECT
      COUNT(*)::int AS total_cards,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active_cards,
      COALESCE(SUM(points_balance), 0)::int AS total_points_outstanding,
      COALESCE(SUM(redeemable_amount), 0)::numeric(14,2) AS total_credit_outstanding,
      COALESCE(SUM(pending_points), 0)::int AS total_pending_points,
      COALESCE(SUM(lifetime_points_earned), 0)::int AS total_points_issued,
      COALESCE(SUM(lifetime_points_redeemed), 0)::int AS total_points_redeemed
    FROM public.loyalty_cards
    WHERE business_id = ${ctx.business.id}
  `;

  const [customerCount] = await sql`
    SELECT COUNT(*)::int AS total_customers
    FROM public.customers
    WHERE business_id = ${ctx.business.id}
  `;

  const [periodPurchases] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'approved')::int AS purchases_count,
      COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0)::numeric(14,2) AS purchase_value,
      COUNT(*) FILTER (WHERE source = 'customer_claim' AND status = 'pending')::int AS pending_claims_count
    FROM public.purchases
    WHERE business_id = ${ctx.business.id}
      AND purchase_date >= ${startDate.toISOString()}
      AND purchase_date <= ${endDate.toISOString()}
  `;

  const [allPendingClaims] = await sql`
    SELECT COUNT(*)::int AS count
    FROM public.purchases
    WHERE business_id = ${ctx.business.id}
      AND source = 'customer_claim'
      AND status = 'pending'
  `;

  const [pendingRedemptions] = await sql`
    SELECT COUNT(*)::int AS count
    FROM public.reward_redemptions
    WHERE business_id = ${ctx.business.id}
      AND status = 'requested'
  `;

  // Points liability in INR: outstanding points converted at points_value_per_100 + store credit outstanding
  const pointsLiabilityInr =
    (Number(cardStats.total_points_outstanding) / 100) *
      ctx.rules.points_value_per_100 +
    Number(cardStats.total_credit_outstanding);

  // Top customers by lifetime spend & visits (RPT-06)
  const topCustomers = await sql`
    SELECT
      c.id,
      c.full_name,
      c.phone,
      lc.card_number,
      lc.points_balance,
      lc.redeemable_amount,
      lc.lifetime_purchase_amount,
      lc.lifetime_points_earned,
      COUNT(p.id) FILTER (WHERE p.status = 'approved')::int AS visit_count
    FROM public.customers c
    JOIN public.loyalty_cards lc ON lc.customer_id = c.id
    LEFT JOIN public.purchases p ON p.customer_id = c.id
    WHERE c.business_id = ${ctx.business.id}
    GROUP BY c.id, lc.id
    ORDER BY lc.lifetime_purchase_amount DESC
    LIMIT 10
  `;

  // Repeat-visit & retention metrics (RPT-07)
  const [retentionStats] = await sql`
    WITH customer_visits AS (
      SELECT
        c.id,
        COUNT(p.id) FILTER (WHERE p.status = 'approved') AS visits
      FROM public.customers c
      LEFT JOIN public.purchases p ON p.customer_id = c.id
      WHERE c.business_id = ${ctx.business.id}
      GROUP BY c.id
    )
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE visits >= 1)::int AS active_visitors,
      COUNT(*) FILTER (WHERE visits >= 2)::int AS repeat_customers
    FROM customer_visits
  `;

  // Staff activity report (RPT-08)
  const staffActivity = await sql`
    SELECT
      u.id,
      u.full_name,
      u.email,
      bu.role,
      COUNT(DISTINCT p.id) FILTER (WHERE p.created_by_user_id = u.id)::int AS purchases_recorded,
      COUNT(DISTINCT rr.id) FILTER (WHERE rr.processed_by_user_id = u.id)::int AS redemptions_processed
    FROM public.business_users bu
    JOIN public.users u ON u.id = bu.user_id
    LEFT JOIN public.purchases p ON p.business_id = bu.business_id AND p.created_by_user_id = u.id
    LEFT JOIN public.reward_redemptions rr ON rr.business_id = bu.business_id AND rr.processed_by_user_id = u.id
    WHERE bu.business_id = ${ctx.business.id} AND bu.status = 'active'
    GROUP BY u.id, bu.role
    ORDER BY purchases_recorded DESC
  `;

  const recentTransactions = await sql`
    SELECT
      t.*,
      lc.card_number,
      c.full_name AS customer_name
    FROM public.transactions t
    JOIN public.loyalty_cards lc ON lc.id = t.card_id
    JOIN public.customers c ON c.id = lc.customer_id
    WHERE t.business_id = ${ctx.business.id}
    ORDER BY t.created_at DESC
    LIMIT 12
  `;

  return NextResponse.json({
    metrics: {
      totalCustomers: customerCount.total_customers,
      activeCards: cardStats.active_cards,
      totalCards: cardStats.total_cards,
      purchasesInPeriod: periodPurchases.purchases_count,
      purchaseValueInPeriod: Number(periodPurchases.purchase_value),
      pointsIssued: cardStats.total_points_issued,
      pointsRedeemed: cardStats.total_points_redeemed,
      pendingClaims: allPendingClaims.count,
      pendingRedemptions: pendingRedemptions.count,
      outstandingPoints: cardStats.total_points_outstanding,
      outstandingCredit: Number(cardStats.total_credit_outstanding),
      outstandingLiabilityInr: Math.round(pointsLiabilityInr * 100) / 100,
    },
    retention: {
      totalCustomers: retentionStats.total,
      activeVisitors: retentionStats.active_visitors,
      repeatCustomers: retentionStats.repeat_customers,
      repeatRatePercent:
        retentionStats.active_visitors > 0
          ? Math.round(
              (retentionStats.repeat_customers /
                retentionStats.active_visitors) *
                100
            )
          : 0,
    },
    topCustomers,
    staffActivity,
    recentTransactions,
    currency: ctx.business.currency,
  });
}

