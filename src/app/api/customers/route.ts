import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { customerCreateSchema } from "@/lib/validation";
import {
  generateCardNumber,
  generatePublicId,
  normalizePhone,
} from "@/lib/utils";
import { computeExpiryDate } from "@/lib/loyalty";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const statusFilter = searchParams.get("status") || "";

  let rows;
  if (q) {
    const pattern = `%${q}%`;
    rows = await sql`
      SELECT
        c.*,
        lc.id AS card_id,
        lc.card_number,
        lc.public_id,
        lc.status AS card_status,
        lc.points_balance,
        lc.redeemable_amount,
        lc.pending_points,
        lc.lifetime_points_earned,
        lc.lifetime_points_redeemed,
        lc.lifetime_purchase_amount
      FROM public.customers c
      LEFT JOIN public.loyalty_cards lc ON lc.customer_id = c.id
      WHERE c.business_id = ${ctx.business.id}
        AND (
          c.full_name ILIKE ${pattern}
          OR c.phone ILIKE ${pattern}
          OR COALESCE(c.email, '') ILIKE ${pattern}
          OR COALESCE(lc.card_number, '') ILIKE ${pattern}
          OR COALESCE(lc.public_id, '') ILIKE ${pattern}
        )
      ORDER BY c.created_at DESC
      LIMIT 100
    `;
  } else if (statusFilter && ["active", "frozen", "closed"].includes(statusFilter)) {
    rows = await sql`
      SELECT
        c.*,
        lc.id AS card_id,
        lc.card_number,
        lc.public_id,
        lc.status AS card_status,
        lc.points_balance,
        lc.redeemable_amount,
        lc.pending_points,
        lc.lifetime_points_earned,
        lc.lifetime_points_redeemed,
        lc.lifetime_purchase_amount
      FROM public.customers c
      LEFT JOIN public.loyalty_cards lc ON lc.customer_id = c.id
      WHERE c.business_id = ${ctx.business.id}
        AND lc.status = ${statusFilter}
      ORDER BY c.created_at DESC
      LIMIT 100
    `;
  } else {
    rows = await sql`
      SELECT
        c.*,
        lc.id AS card_id,
        lc.card_number,
        lc.public_id,
        lc.status AS card_status,
        lc.points_balance,
        lc.redeemable_amount,
        lc.pending_points,
        lc.lifetime_points_earned,
        lc.lifetime_points_redeemed,
        lc.lifetime_purchase_amount
      FROM public.customers c
      LEFT JOIN public.loyalty_cards lc ON lc.customer_id = c.id
      WHERE c.business_id = ${ctx.business.id}
      ORDER BY c.created_at DESC
      LIMIT 100
    `;
  }

  return NextResponse.json({
    customers: rows,
    business: {
      name: ctx.business.name,
      slug: ctx.business.slug,
    },
  });
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = customerCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid customer details." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const normalizedPhone = normalizePhone(d.phone);
    const cleanEmail = d.email ? d.email.toLowerCase().trim() : null;

    // CUST-03: Check duplicate phone per business
    const dupPhone = await sql`
      SELECT id FROM public.customers
      WHERE business_id = ${ctx.business.id} AND phone = ${normalizedPhone}
      LIMIT 1
    `;
    if (dupPhone.length > 0) {
      return NextResponse.json(
        {
          error: `A customer with phone number ${normalizedPhone} already exists in your business.`,
        },
        { status: 409 }
      );
    }

    // CUST-04: Check duplicate email per business if provided
    if (cleanEmail) {
      const dupEmail = await sql`
        SELECT id FROM public.customers
        WHERE business_id = ${ctx.business.id}
          AND LOWER(email) = ${cleanEmail}
        LIMIT 1
      `;
      if (dupEmail.length > 0) {
        return NextResponse.json(
          {
            error: `A customer with email ${cleanEmail} already exists in your business.`,
          },
          { status: 409 }
        );
      }
    }

    const cardNumber = generateCardNumber(ctx.business.slug);
    const publicId = generatePublicId();
    const signupBonus =
      ctx.rules.status === "active" && ctx.rules.signup_bonus_points > 0
        ? ctx.rules.signup_bonus_points
        : 0;
    const expiresAt = computeExpiryDate(ctx.rules);

    const created = await sql.begin(async (tx) => {
      const [customer] = await tx`
        INSERT INTO public.customers (
          business_id,
          full_name,
          phone,
          email,
          date_of_birth,
          notes,
          tags,
          marketing_consent,
          loyalty_consent,
          created_by_user_id
        ) VALUES (
          ${ctx.business.id},
          ${d.fullName.trim()},
          ${normalizedPhone},
          ${cleanEmail},
          ${d.dateOfBirth || null},
          ${d.notes || null},
          ${tx.json((d.tags || []) as never)},
          ${d.marketingConsent},
          ${d.loyaltyConsent},
          ${ctx.user.id}
        )
        RETURNING *
      `;

      const [card] = await tx`
        INSERT INTO public.loyalty_cards (
          business_id,
          customer_id,
          card_number,
          public_id,
          status,
          points_balance,
          redeemable_amount,
          lifetime_points_earned
        ) VALUES (
          ${ctx.business.id},
          ${customer.id},
          ${cardNumber},
          ${publicId},
          'active',
          ${signupBonus},
          0,
          ${signupBonus}
        )
        RETURNING *
      `;

      if (signupBonus > 0) {
        await tx`
          INSERT INTO public.transactions (
            business_id,
            card_id,
            type,
            points_change,
            amount_change,
            points_balance_after,
            redeemable_amount_after,
            description,
            expires_at,
            created_by_user_id
          ) VALUES (
            ${ctx.business.id},
            ${card.id},
            'points_earned',
            ${signupBonus},
            0,
            ${signupBonus},
            0,
            'Welcome signup bonus points',
            ${expiresAt},
            ${ctx.user.id}
          )
        `;
      }

      return { customer, card };
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "customer.created",
      entityType: "customer",
      entityId: created.customer.id,
      afterState: {
        fullName: created.customer.full_name,
        phone: created.customer.phone,
        cardNumber: created.card.card_number,
        publicId: created.card.public_id,
        signupBonus,
      },
    });

    return NextResponse.json(
      {
        success: true,
        customer: created.customer,
        card: created.card,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/customers error:", err);
    return NextResponse.json(
      { error: "Failed to create customer and loyalty card." },
      { status: 500 }
    );
  }
}

