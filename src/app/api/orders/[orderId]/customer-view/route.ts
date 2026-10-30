import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const cardPublicId = searchParams.get("cardPublicId");

    if (!token && !cardPublicId) {
      return NextResponse.json(
        { error: "Order authorization token is required." },
        { status: 401 }
      );
    }

    const orderRows = await sql`
      SELECT
        o.*,
        lc.public_id AS card_public_id,
        lc.points_balance,
        lc.redeemable_amount,
        b.name AS store_name,
        b.slug AS store_slug,
        b.primary_color AS store_primary_color,
        b.currency AS store_currency
      FROM public.orders o
      JOIN public.loyalty_cards lc ON lc.id = o.card_id
      JOIN public.businesses b ON b.id = o.business_id
      WHERE o.id = ${params.orderId}
      LIMIT 1
    `;

    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    let order = orderRows[0];

    // Security check: Customer may access only their own order
    const tokenMatches = token && order.public_token === token;
    const cardMatches = cardPublicId && order.card_public_id === cardPublicId;
    if (!tokenMatches && !cardMatches) {
      return NextResponse.json(
        { error: "You do not have permission to view this order." },
        { status: 403 }
      );
    }

    // ORD-11: Auto-expire unconfirmed orders past expires_at
    if (
      (order.status === "created" || order.status === "awaiting_confirmation") &&
      order.expires_at &&
      new Date(order.expires_at) < new Date()
    ) {
      await sql.begin(async (tx) => {
        const [lockedOrder] = await tx`
          SELECT * FROM public.orders WHERE id = ${order.id} FOR UPDATE
        `;
        if (
          lockedOrder &&
          (lockedOrder.status === "created" ||
            lockedOrder.status === "awaiting_confirmation")
        ) {
          const [updated] = await tx`
            UPDATE public.orders
            SET
              status = 'expired',
              cancellation_reason = 'Order expired automatically before counter confirmation',
              updated_at = NOW()
            WHERE id = ${order.id}
            RETURNING *
          `;
          order = { ...order, ...updated };

          // Restore any points redeemed at checkout
          const redeemedPts = Number(lockedOrder.reward_points_used ?? 0);
          if (redeemedPts > 0) {
            const [lockedCard] = await tx`
              SELECT * FROM public.loyalty_cards WHERE id = ${lockedOrder.card_id} FOR UPDATE
            `;
            if (lockedCard) {
              const restoredBalance =
                Number(lockedCard.points_balance) + redeemedPts;
              await tx`
                UPDATE public.loyalty_cards
                SET
                  points_balance = ${restoredBalance},
                  lifetime_points_redeemed = GREATEST(0, lifetime_points_redeemed - ${redeemedPts}),
                  updated_at = NOW()
                WHERE id = ${lockedCard.id}
              `;
              await tx`
                INSERT INTO public.transactions (
                  business_id,
                  card_id,
                  order_id,
                  type,
                  points_change,
                  amount_change,
                  points_balance_after,
                  redeemable_amount_after,
                  description
                ) VALUES (
                  ${lockedOrder.business_id},
                  ${lockedCard.id},
                  ${lockedOrder.id},
                  'reward_points_restored',
                  ${redeemedPts},
                  0,
                  ${restoredBalance},
                  ${Number(lockedCard.redeemable_amount)},
                  ${`Restored ${redeemedPts} points from expired Order ${lockedOrder.order_number}`}
                )
              `;
              order.points_balance = restoredBalance;
            }
          }

          await tx`
            INSERT INTO public.order_events (
              order_id, event, actor_type, actor_id, note
            ) VALUES (
              ${order.id}, 'expired', 'system', 'system', 'Unconfirmed order expired after timeout window'
            )
          `;
        }
      });
    }

    const items = await sql`
      SELECT * FROM public.order_items
      WHERE order_id = ${order.id}
      ORDER BY created_at ASC
    `;

    const events = await sql`
      SELECT id, event, actor_type, note, created_at
      FROM public.order_events
      WHERE order_id = ${order.id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({
      order: {
        id: order.id,
        public_token: order.public_token,
        order_number: order.order_number,
        customer_display_name: order.customer_display_name,
        order_type: order.order_type,
        table_number: order.table_number,
        status: order.status,
        subtotal: Number(order.subtotal),
        tax_total: Number(order.tax_total),
        discount_total: Number(order.discount_total),
        reward_points_used: Number(order.reward_points_used),
        reward_value_used: Number(order.reward_value_used),
        points_earned: Number(order.points_earned),
        total: Number(order.total),
        currency: order.currency,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        notes: order.notes,
        confirmed_at: order.confirmed_at,
        paid_at: order.paid_at,
        points_credited_at: order.points_credited_at,
        prepared_at: order.prepared_at,
        ready_at: order.ready_at,
        served_at: order.served_at,
        cancelled_at: order.cancelled_at,
        cancellation_reason: order.cancellation_reason,
        expires_at: order.expires_at,
        created_at: order.created_at,
        items: items.map((i) => ({
          ...i,
          unit_price: Number(i.unit_price),
          total_price: Number(i.total_price),
        })),
        events,
      },
      card: {
        public_id: order.card_public_id,
        points_balance: Number(order.points_balance),
        redeemable_amount: Number(order.redeemable_amount),
      },
      store: {
        name: order.store_name,
        slug: order.store_slug,
        primary_color: order.store_primary_color,
        currency: order.store_currency,
      },
    });
  } catch (err) {
    console.error("GET /api/orders/[orderId]/customer-view error:", err);
    return NextResponse.json(
      { error: "Failed to load order status." },
      { status: 500 }
    );
  }
}

