import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { maskPhone } from "@/lib/utils";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const query = (searchParams.get("q") || "").trim();

    // Auto-expire unconfirmed orders past expires_at for this business
    await sql`
      UPDATE public.orders
      SET
        status = 'expired',
        cancellation_reason = 'Order expired automatically before counter confirmation',
        updated_at = NOW()
      WHERE business_id = ${ctx.business.id}
        AND status IN ('created', 'awaiting_confirmation')
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
    `;

    let statusList: string[] = [];
    if (statusFilter === "new") {
      statusList = ["created", "awaiting_confirmation"];
    } else if (statusFilter === "awaiting_payment") {
      statusList = ["confirmed", "awaiting_payment"];
    } else if (statusFilter === "preparing") {
      statusList = ["paid", "points_credited", "preparing"];
    } else if (statusFilter === "ready") {
      statusList = ["ready"];
    } else if (statusFilter === "active") {
      statusList = [
        "created",
        "awaiting_confirmation",
        "confirmed",
        "awaiting_payment",
        "paid",
        "points_credited",
        "preparing",
        "ready",
      ];
    } else if (statusFilter === "completed") {
      statusList = ["served"];
    } else if (statusFilter === "cancelled") {
      statusList = ["cancelled", "rejected", "expired", "refunded"];
    }

    const orders = await sql`
      SELECT
        o.*,
        c.full_name AS customer_full_name,
        c.phone AS customer_phone,
        lc.card_number,
        lc.public_id AS card_public_id,
        lc.points_balance AS customer_points_balance,
        lc.redeemable_amount AS customer_redeemable_amount,
        u.full_name AS confirmed_by_name
      FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      JOIN public.loyalty_cards lc ON lc.id = o.card_id
      LEFT JOIN public.users u ON u.id = o.confirmed_by_user_id
      WHERE o.business_id = ${ctx.business.id}
        ${statusList.length > 0 ? sql`AND o.status IN ${sql(statusList)}` : sql``}
        ${
          query
            ? sql`AND (
                o.order_number ILIKE ${"%" + query + "%"}
                OR o.customer_display_name ILIKE ${"%" + query + "%"}
                OR c.full_name ILIKE ${"%" + query + "%"}
                OR c.phone ILIKE ${"%" + query + "%"}
              )`
            : sql``
        }
      ORDER BY
        CASE
          WHEN o.status IN ('created', 'awaiting_confirmation') THEN 1
          WHEN o.status IN ('confirmed', 'awaiting_payment') THEN 2
          WHEN o.status IN ('paid', 'points_credited', 'preparing') THEN 3
          WHEN o.status = 'ready' THEN 4
          ELSE 5
        END ASC,
        o.created_at DESC
      LIMIT 100
    `;

    const orderIds = orders.map((o) => o.id);
    const items =
      orderIds.length > 0
        ? await sql`
            SELECT * FROM public.order_items
            WHERE order_id IN ${sql(orderIds)}
            ORDER BY created_at ASC
          `
        : [];

    const enrichedOrders = orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      tax_total: Number(o.tax_total),
      discount_total: Number(o.discount_total),
      total: Number(o.total),
      points_earned: Number(o.points_earned),
      reward_points_used: Number(o.reward_points_used),
      customer_points_balance: Number(o.customer_points_balance),
      customer_redeemable_amount: Number(o.customer_redeemable_amount),
      customer_phone_display:
        ctx.role === "owner" || ctx.role === "manager"
          ? o.customer_phone
          : maskPhone(o.customer_phone),
      items: items
        .filter((i) => i.order_id === o.id)
        .map((i) => ({
          ...i,
          unit_price: Number(i.unit_price),
          total_price: Number(i.total_price),
        })),
    }));

    // Queue counts for live badge tabs
    const countsRows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('created', 'awaiting_confirmation')) AS new_count,
        COUNT(*) FILTER (WHERE status IN ('confirmed', 'awaiting_payment')) AS awaiting_payment_count,
        COUNT(*) FILTER (WHERE status IN ('paid', 'points_credited', 'preparing')) AS preparing_count,
        COUNT(*) FILTER (WHERE status = 'ready') AS ready_count,
        COUNT(*) FILTER (WHERE status = 'served') AS completed_count,
        COUNT(*) FILTER (WHERE status IN ('cancelled', 'rejected', 'expired', 'refunded')) AS cancelled_count
      FROM public.orders
      WHERE business_id = ${ctx.business.id}
    `;

    const cRow = countsRows[0] || {};

    return NextResponse.json({
      orders: enrichedOrders,
      counts: {
        new: Number(cRow.new_count ?? 0),
        awaiting_payment: Number(cRow.awaiting_payment_count ?? 0),
        preparing: Number(cRow.preparing_count ?? 0),
        ready: Number(cRow.ready_count ?? 0),
        completed: Number(cRow.completed_count ?? 0),
        cancelled: Number(cRow.cancelled_count ?? 0),
      },
      business: ctx.business,
      role: ctx.role,
    });
  } catch (err) {
    console.error("GET /api/staff/orders error:", err);
    return NextResponse.json(
      { error: "Failed to load orders queue." },
      { status: 500 }
    );
  }
}

