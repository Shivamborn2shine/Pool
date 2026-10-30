import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token as string | undefined;
    const cardPublicId = body.cardPublicId as string | undefined;
    const reason = (body.reason as string | undefined)?.trim() || "Cancelled by customer before confirmation";

    if (!token && !cardPublicId) {
      return NextResponse.json(
        { error: "Order authorization token is required." },
        { status: 401 }
      );
    }

    const updatedOrder = await sql.begin(async (tx) => {
      const rows = await tx`
        SELECT
          o.*,
          lc.public_id AS card_public_id
        FROM public.orders o
        JOIN public.loyalty_cards lc ON lc.id = o.card_id
        WHERE o.id = ${params.orderId}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new Error("Order not found.");
      }

      const order = rows[0];
      const tokenMatches = token && order.public_token === token;
      const cardMatches = cardPublicId && order.card_public_id === cardPublicId;

      if (!tokenMatches && !cardMatches) {
        throw new Error("Unauthorized to cancel this order.");
      }

      // ORD-10: Customer can cancel ONLY while the order is not confirmed
      if (
        order.status !== "created" &&
        order.status !== "awaiting_confirmation"
      ) {
        throw new Error(
          "This order has already been confirmed by staff. Please speak with staff at the counter to cancel."
        );
      }

      const [cancelled] = await tx`
        UPDATE public.orders
        SET
          status = 'cancelled',
          cancelled_at = NOW(),
          cancellation_reason = ${reason},
          updated_at = NOW()
        WHERE id = ${order.id}
        RETURNING *
      `;

      // Restore any points redeemed at checkout
      const redeemedPts = Number(order.reward_points_used ?? 0);
      if (redeemedPts > 0) {
        const [lockedCard] = await tx`
          SELECT * FROM public.loyalty_cards WHERE id = ${order.card_id} FOR UPDATE
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
              ${order.business_id},
              ${lockedCard.id},
              ${order.id},
              'reward_points_restored',
              ${redeemedPts},
              0,
              ${restoredBalance},
              ${Number(lockedCard.redeemable_amount)},
              ${`Restored ${redeemedPts} points from cancelled Order ${order.order_number}`}
            )
          `;
        }
      }

      await tx`
        INSERT INTO public.order_events (
          order_id, event, actor_type, actor_id, note
        ) VALUES (
          ${order.id}, 'cancelled', 'customer', ${order.customer_id}, ${reason}
        )
      `;

      return cancelled;
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to cancel order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

