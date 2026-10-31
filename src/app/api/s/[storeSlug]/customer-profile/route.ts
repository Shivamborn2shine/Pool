import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { maskPhone } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { storeSlug: string } }
) {
  try {
    const body = await request.json();
    const {
      cardPublicId,
      fullName,
      email,
      birthdayDay,
      birthdayMonth,
      marketingConsent,
    } = body;

    if (!cardPublicId) {
      return NextResponse.json(
        { error: "Card session required to update profile." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT
        lc.id AS card_id,
        lc.public_id AS card_public_id,
        lc.card_number,
        lc.points_balance,
        lc.redeemable_amount,
        c.id AS customer_id,
        c.full_name,
        c.phone,
        c.email,
        c.birthday_day,
        c.birthday_month,
        c.marketing_consent,
        b.id AS business_id
      FROM public.loyalty_cards lc
      JOIN public.customers c ON c.id = lc.customer_id
      JOIN public.businesses b ON b.id = lc.business_id
      WHERE lc.public_id = ${cardPublicId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Customer loyalty card not found." },
        { status: 404 }
      );
    }

    const row = rows[0];
    const cleanName =
      typeof fullName === "string" && fullName.trim().length >= 2
        ? fullName.trim()
        : null;
    const cleanEmail =
      typeof email === "string" && email.trim()
        ? email.trim().toLowerCase()
        : email === null
        ? null
        : undefined;
    const cleanBday =
      birthdayDay !== undefined && birthdayDay !== null && Number(birthdayDay) > 0
        ? Math.min(Math.max(Number(birthdayDay), 1), 31)
        : birthdayDay === null
        ? null
        : undefined;
    const cleanBmonth =
      birthdayMonth !== undefined && birthdayMonth !== null && Number(birthdayMonth) > 0
        ? Math.min(Math.max(Number(birthdayMonth), 1), 12)
        : birthdayMonth === null
        ? null
        : undefined;

    const [updatedCust] = await sql`
      UPDATE public.customers
      SET
        full_name = ${cleanName !== null ? cleanName : sql`full_name`},
        email = ${cleanEmail !== undefined ? cleanEmail : sql`email`},
        birthday_day = ${cleanBday !== undefined ? cleanBday : sql`birthday_day`},
        birthday_month = ${cleanBmonth !== undefined ? cleanBmonth : sql`birthday_month`},
        marketing_consent = ${
          typeof marketingConsent === "boolean"
            ? marketingConsent
            : sql`marketing_consent`
        },
        updated_at = NOW()
      WHERE id = ${row.customer_id}
      RETURNING *
    `;

    await writeAuditLog({
      businessId: row.business_id,
      actorRole: "customer",
      action: "customer.profile_updated",
      entityType: "customer",
      entityId: row.customer_id,
      beforeState: {
        fullName: row.full_name,
        email: row.email,
        birthdayDay: row.birthday_day,
        birthdayMonth: row.birthday_month,
      },
      afterState: {
        fullName: updatedCust.full_name,
        email: updatedCust.email,
        birthdayDay: updatedCust.birthday_day,
        birthdayMonth: updatedCust.birthday_month,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: updatedCust.id,
        fullName: updatedCust.full_name,
        displayName: updatedCust.full_name,
        email: updatedCust.email || null,
        maskedPhone: maskPhone(updatedCust.phone),
        birthdayDay: updatedCust.birthday_day || null,
        birthdayMonth: updatedCust.birthday_month || null,
        marketingConsent: Boolean(updatedCust.marketing_consent),
      },
      card: {
        pointsBalance: Number(row.points_balance),
        redeemableAmount: Number(row.redeemable_amount),
        cardNumber: row.card_number,
      },
    });
  } catch (err) {
    console.error("PATCH /api/s/[storeSlug]/customer-profile error:", err);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
