import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPhoneLast4 } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const body = await request.json();
    const {
      phoneLast4,
      marketingConsent,
      privacyRequestType,
      details,
      birthdayDay,
      birthdayMonth,
    } = body;

    const rows = await sql`
      SELECT
        lc.id AS card_id,
        lc.business_id,
        c.id AS customer_id,
        c.phone,
        c.marketing_consent
      FROM public.loyalty_cards lc
      JOIN public.customers c ON c.id = lc.customer_id
      WHERE lc.public_id = ${params.publicId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const row = rows[0];
    if (!verifyPhoneLast4(row.phone, String(phoneLast4 || ""))) {
      return NextResponse.json(
        {
          error:
            "Phone verification failed. Enter the last 4 digits of your registered phone number.",
        },
        { status: 403 }
      );
    }

    // DPDP Act 2023 Data Deletion / Export / Correction request (CUST-11)
    if (
      privacyRequestType &&
      ["deletion", "export", "correction"].includes(privacyRequestType)
    ) {
      const [reqRow] = await sql`
        INSERT INTO public.privacy_requests (
          business_id,
          customer_id,
          card_id,
          request_type,
          details,
          status
        ) VALUES (
          ${row.business_id},
          ${row.customer_id},
          ${row.card_id},
          ${privacyRequestType},
          ${details || null},
          'pending'
        )
        RETURNING *
      `;

      if (privacyRequestType === "deletion") {
        await sql`
          UPDATE public.customers
          SET status = 'deletion_requested', updated_at = NOW()
          WHERE id = ${row.customer_id}
        `;
      }

      await writeAuditLog({
        businessId: row.business_id,
        actorRole: "customer",
        action: `privacy.${privacyRequestType}_requested`,
        entityType: "customer",
        entityId: row.customer_id,
        afterState: { details },
      });

      return NextResponse.json({
        success: true,
        privacyRequest: reqRow,
        message: `Your data ${privacyRequestType} request has been logged under DPDP Act 2023 compliance.`,
      });
    }

    // Update birthday if provided
    if (birthdayDay && birthdayMonth) {
      const bDay = Math.min(Math.max(Number(birthdayDay), 1), 31);
      const bMonth = Math.min(Math.max(Number(birthdayMonth), 1), 12);
      await sql`
        UPDATE public.customers
        SET
          birthday_day = ${bDay},
          birthday_month = ${bMonth},
          updated_at = NOW()
        WHERE id = ${row.customer_id}
      `;
    }

    // Update marketing consent preference (CUST-10)
    if (typeof marketingConsent === "boolean") {
      await sql`
        UPDATE public.customers
        SET marketing_consent = ${marketingConsent}, updated_at = NOW()
        WHERE id = ${row.customer_id}
      `;

      await writeAuditLog({
        businessId: row.business_id,
        actorRole: "customer",
        action: "customer.preferences_updated",
        entityType: "customer",
        entityId: row.customer_id,
        beforeState: { marketingConsent: row.marketing_consent },
        afterState: { marketingConsent },
      });
    }

    return NextResponse.json({
      success: true,
      marketingConsent: Boolean(marketingConsent),
    });
  } catch (err) {
    console.error("PATCH /api/card/[publicId]/preferences error:", err);
    return NextResponse.json(
      { error: "Failed to update preferences." },
      { status: 500 }
    );
  }
}

