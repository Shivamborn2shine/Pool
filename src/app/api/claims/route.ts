import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "";

  const claims = await sql`
    SELECT
      p.*,
      c.full_name AS customer_name,
      c.phone AS customer_phone,
      lc.card_number,
      lc.public_id AS card_public_id,
      lc.points_balance,
      u.full_name AS reviewer_name
    FROM public.purchases p
    JOIN public.customers c ON c.id = p.customer_id
    JOIN public.loyalty_cards lc ON lc.id = p.card_id
    LEFT JOIN public.users u ON u.id = p.reviewed_by_user_id
    WHERE p.business_id = ${ctx.business.id}
      AND p.source = 'customer_claim'
      ${statusFilter ? sql`AND p.status = ${statusFilter}` : sql``}
    ORDER BY
      CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END ASC,
      p.created_at DESC
    LIMIT 100
  `;

  const adjustmentRequests = await sql`
    SELECT
      ar.*,
      lc.card_number,
      c.full_name AS customer_name,
      u.full_name AS requested_by_name
    FROM public.adjustment_requests ar
    JOIN public.loyalty_cards lc ON lc.id = ar.card_id
    JOIN public.customers c ON c.id = lc.customer_id
    JOIN public.users u ON u.id = ar.requested_by_user_id
    WHERE ar.business_id = ${ctx.business.id}
    ORDER BY
      CASE WHEN ar.status = 'pending' THEN 0 ELSE 1 END ASC,
      ar.created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({
    claims,
    adjustmentRequests,
    role: ctx.role,
  });
}

