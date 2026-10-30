import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import {
  checkRateLimit,
  createSession,
  getClientContext,
  hashPassword,
} from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { ipAddress } = getClientContext();
    const rate = await checkRateLimit(`register:${ipAddress}`, 10, 900);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid input fields.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      password,
      businessName,
      phone,
      currency,
      timezone,
      utmSource,
      utmMedium,
      utmCampaign,
    } = parsed.data;

    const cleanEmail = email.toLowerCase().trim();
    const existingUsers = await sql`
      SELECT id FROM public.users WHERE email = ${cleanEmail} LIMIT 1
    `;
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const baseSlug = slugify(businessName) || "business";
    const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = hashPassword(password);

    const result = await sql.begin(async (tx) => {
      const [user] = await tx`
        INSERT INTO public.users (email, password_hash, full_name, phone, email_verified_at, last_login_at)
        VALUES (${cleanEmail}, ${passwordHash}, ${fullName.trim()}, ${phone || null}, NOW(), NOW())
        RETURNING *
      `;

      const [business] = await tx`
        INSERT INTO public.businesses (
          name, slug, primary_color, currency, timezone, phone, email, status, subscription_plan,
          utm_source, utm_medium, utm_campaign
        ) VALUES (
          ${businessName.trim()},
          ${uniqueSlug},
          '#18181B',
          ${currency || "INR"},
          ${timezone || "Asia/Kolkata"},
          ${phone || null},
          ${cleanEmail},
          'active',
          'growth',
          ${utmSource || null},
          ${utmMedium || null},
          ${utmCampaign || null}
        )
        RETURNING *
      `;

      const [location] = await tx`
        INSERT INTO public.business_locations (business_id, name, phone)
        VALUES (${business.id}, 'Main Counter', ${phone || null})
        RETURNING *
      `;

      await tx`
        INSERT INTO public.business_users (
          business_id, user_id, invited_email, role, status, location_id, joined_at
        ) VALUES (
          ${business.id}, ${user.id}, ${cleanEmail}, 'owner', 'active', ${location.id}, NOW()
        )
      `;

      await tx`
        INSERT INTO public.loyalty_rules (business_id)
        VALUES (${business.id})
      `;

      return { user, business };
    });

    await createSession(result.user.id, result.business.id);

    await writeAuditLog({
      businessId: result.business.id,
      actorUserId: result.user.id,
      actorRole: "owner",
      action: "business.registered",
      entityType: "business",
      entityId: result.business.id,
      afterState: {
        businessName: result.business.name,
        slug: result.business.slug,
        ownerEmail: cleanEmail,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.full_name,
        },
        business: result.business,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again." },
      { status: 500 }
    );
  }
}

