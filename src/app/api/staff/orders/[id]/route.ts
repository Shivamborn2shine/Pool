import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { staffOrderActionSchema } from "@/lib/validation";
import { executeStaffOrderTransition } from "@/lib/order-actions";
import { maskPhone } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT
      o.*,
      c.full_name AS customer_full_name,
      c.phone AS customer_phone,
      lc.card_number,
      lc.public_id AS card_public_id,
      lc.points_balance AS customer_points_balance,
      lc.redeemable_amount AS customer_redeemable_amount
    FROM public.orders o
    JOIN public.customers c ON c.id = o.customer_id
    JOIN public.loyalty_cards lc ON lc.id = o.card_id
    WHERE o.id = ${params.id} AND o.business_id = ${ctx.business.id}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = rows[0];
  const items = await sql`
    SELECT * FROM public.order_items WHERE order_id = ${order.id} ORDER BY created_at ASC
  `;
  const events = await sql`
    SELECT * FROM public.order_events WHERE order_id = ${order.id} ORDER BY created_at ASC
  `;

  return NextResponse.json({
    order: {
      ...order,
      subtotal: Number(order.subtotal),
      tax_total: Number(order.tax_total),
      discount_total: Number(order.discount_total),
      total: Number(order.total),
      points_earned: Number(order.points_earned),
      customer_phone_display:
        ctx.role === "owner" || ctx.role === "manager"
          ? order.customer_phone
          : maskPhone(order.customer_phone),
      items,
      events,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = staffOrderActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid order action." },
        { status: 400 }
      );
    }

    const updatedOrder = await executeStaffOrderTransition(ctx, {
      orderId: params.id,
      action: parsed.data.action,
      paymentMethod: parsed.data.paymentMethod,
      paymentReference: parsed.data.paymentReference,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

