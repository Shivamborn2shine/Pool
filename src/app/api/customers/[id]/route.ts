import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { customerUpdateSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/utils";
import { generateCardQrDataUrl, getPublicCardUrl } from "@/lib/qr";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await sql`
    SELECT * FROM public.customers
    WHERE id = ${params.id} AND business_id = ${ctx.business.id}
    LIMIT 1
  `;

  if (customers.length === 0) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  const customer = customers[0];
  const cards = await sql`
    SELECT * FROM public.loyalty_cards
    WHERE customer_id = ${customer.id} AND business_id = ${ctx.business.id}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const card = cards[0] || null;

  let transactions: readonly unknown[] = [];
  let purchases: readonly unknown[] = [];
  let redemptions: readonly unknown[] = [];
  let qrDataUrl: string | null = null;
  let publicCardUrl: string | null = null;

  if (card) {
    publicCardUrl = getPublicCardUrl(card.public_id);
    qrDataUrl = await generateCardQrDataUrl(
      card.public_id,
      ctx.business.primary_color
    );

    transactions = await sql`
      SELECT
        t.*,
        u.full_name AS actor_name
      FROM public.transactions t
      LEFT JOIN public.users u ON u.id = t.created_by_user_id
      WHERE t.card_id = ${card.id}
      ORDER BY t.created_at DESC
      LIMIT 50
    `;

    purchases = await sql`
      SELECT *
      FROM public.purchases
      WHERE card_id = ${card.id}
      ORDER BY purchase_date DESC
      LIMIT 30
    `;

    redemptions = await sql`
      SELECT
        rr.*,
        r.name AS reward_name
      FROM public.reward_redemptions rr
      LEFT JOIN public.rewards r ON r.id = rr.reward_id
      WHERE rr.card_id = ${card.id}
      ORDER BY rr.requested_at DESC
      LIMIT 30
    `;
  }

  const rewards = await sql`
    SELECT * FROM public.rewards
    WHERE business_id = ${ctx.business.id} AND status = 'active'
    ORDER BY points_required ASC
  `;

  return NextResponse.json({
    customer,
    card,
    qrDataUrl,
    publicCardUrl,
    transactions,
    purchases,
    redemptions,
    rewards,
    business: ctx.business,
    rules: ctx.rules,
    role: ctx.role,
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
    const existingRows = await sql`
      SELECT * FROM public.customers
      WHERE id = ${params.id} AND business_id = ${ctx.business.id}
      LIMIT 1
    `;

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    const beforeCustomer = existingRows[0];
    const body = await request.json();
    const parsed = customerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update fields." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const nextPhone = d.phone
      ? normalizePhone(d.phone)
      : beforeCustomer.phone;
    const nextEmail =
      d.email !== undefined
        ? d.email
          ? d.email.toLowerCase().trim()
          : null
        : beforeCustomer.email;

    if (nextPhone !== beforeCustomer.phone) {
      const dup = await sql`
        SELECT id FROM public.customers
        WHERE business_id = ${ctx.business.id}
          AND phone = ${nextPhone}
          AND id <> ${params.id}
        LIMIT 1
      `;
      if (dup.length > 0) {
        return NextResponse.json(
          { error: `Phone number ${nextPhone} is already used by another customer.` },
          { status: 409 }
        );
      }
    }

    const [updatedCustomer] = await sql`
      UPDATE public.customers
      SET
        full_name = ${d.fullName ? d.fullName.trim() : beforeCustomer.full_name},
        phone = ${nextPhone},
        email = ${nextEmail},
        date_of_birth = ${
          d.dateOfBirth !== undefined
            ? d.dateOfBirth || null
            : beforeCustomer.date_of_birth
        },
        notes = ${d.notes !== undefined ? d.notes || null : beforeCustomer.notes},
        tags = ${
          d.tags !== undefined
            ? sql.json(d.tags as never)
            : sql.json((beforeCustomer.tags || []) as never)
        },
        marketing_consent = ${
          d.marketingConsent !== undefined
            ? d.marketingConsent
            : beforeCustomer.marketing_consent
        },
        updated_at = NOW()
      WHERE id = ${params.id} AND business_id = ${ctx.business.id}
      RETURNING *
    `;

    let updatedCard = null;
    if (d.cardStatus) {
      const [beforeCard] = await sql`
        SELECT * FROM public.loyalty_cards
        WHERE customer_id = ${params.id} AND business_id = ${ctx.business.id}
        LIMIT 1
      `;
      if (beforeCard) {
        const [cardRow] = await sql`
          UPDATE public.loyalty_cards
          SET status = ${d.cardStatus}, updated_at = NOW()
          WHERE id = ${beforeCard.id}
          RETURNING *
        `;
        updatedCard = cardRow;

        await writeAuditLog({
          businessId: ctx.business.id,
          actorUserId: ctx.user.id,
          actorRole: ctx.role,
          action: `card.status_${d.cardStatus}`,
          entityType: "loyalty_card",
          entityId: beforeCard.id,
          beforeState: { status: beforeCard.status },
          afterState: { status: d.cardStatus },
        });
      }
    }

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "customer.updated",
      entityType: "customer",
      entityId: params.id,
      beforeState: beforeCustomer as Record<string, unknown>,
      afterState: updatedCustomer as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      card: updatedCard,
    });
  } catch (err) {
    console.error("PATCH /api/customers/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update customer." },
      { status: 500 }
    );
  }
}

