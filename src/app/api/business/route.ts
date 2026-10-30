import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
import {
  getSessionContext,
  hasRolePermission,
  triggerSupabaseTransactionalEmail,
} from "@/lib/auth";
import {
  businessUpdateSchema,
  locationCreateSchema,
  staffInviteSchema,
} from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locations = await sql`
    SELECT * FROM public.business_locations
    WHERE business_id = ${ctx.business.id}
    ORDER BY created_at ASC
  `;

  const staff = await sql`
    SELECT
      bu.id,
      bu.role,
      bu.status,
      bu.invited_email,
      bu.invite_token,
      bu.invite_expires_at,
      bu.location_id,
      bu.joined_at,
      bu.created_at,
      u.full_name,
      u.email,
      u.last_login_at
    FROM public.business_users bu
    LEFT JOIN public.users u ON u.id = bu.user_id
    WHERE bu.business_id = ${ctx.business.id}
    ORDER BY bu.created_at ASC
  `;

  const auditLogs = await sql`
    SELECT
      al.*,
      u.full_name AS actor_name,
      u.email AS actor_email
    FROM public.audit_logs al
    LEFT JOIN public.users u ON u.id = al.actor_user_id
    WHERE al.business_id = ${ctx.business.id}
    ORDER BY al.created_at DESC
    LIMIT 40
  `;

  return NextResponse.json({
    business: ctx.business,
    role: ctx.role,
    user: ctx.user,
    isImpersonating: ctx.isImpersonating,
    locations,
    staff,
    auditLogs,
  });
}

// POST /api/business handles sub-actions: invite_staff, revoke_staff, add_location
export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRolePermission(ctx.role, ["owner"])) {
    return NextResponse.json(
      { error: "Only the Business Owner can manage staff or locations." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const action = body.action || "invite_staff";

  if (action === "add_location") {
    const parsed = locationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid location details." },
        { status: 400 }
      );
    }

    const [loc] = await sql`
      INSERT INTO public.business_locations (business_id, name, address, phone)
      VALUES (
        ${ctx.business.id},
        ${parsed.data.name.trim()},
        ${parsed.data.address || null},
        ${parsed.data.phone || null}
      )
      RETURNING *
    `;

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "location.created",
      entityType: "business_location",
      entityId: loc.id,
      afterState: loc as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, location: loc }, { status: 201 });
  }

  if (action === "revoke_staff") {
    const memberId = body.memberId;
    if (!memberId) {
      return NextResponse.json(
        { error: "Staff member ID is required." },
        { status: 400 }
      );
    }

    const [existing] = await sql`
      SELECT * FROM public.business_users
      WHERE id = ${memberId} AND business_id = ${ctx.business.id}
      LIMIT 1
    `;

    if (!existing) {
      return NextResponse.json(
        { error: "Staff member not found." },
        { status: 404 }
      );
    }

    if (existing.role === "owner") {
      return NextResponse.json(
        { error: "Cannot revoke the primary Business Owner." },
        { status: 400 }
      );
    }

    const [updated] = await sql`
      UPDATE public.business_users
      SET status = 'revoked', invite_token = NULL, updated_at = NOW()
      WHERE id = ${memberId} AND business_id = ${ctx.business.id}
      RETURNING *
    `;

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "staff.revoked",
      entityType: "business_user",
      entityId: memberId,
      beforeState: existing as Record<string, unknown>,
      afterState: updated as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, member: updated });
  }

  // Default: invite_staff (AUTH-06, AUTH-07)
  const parsed = staffInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid invitation fields." },
      { status: 400 }
    );
  }

  const cleanEmail = parsed.data.email.toLowerCase().trim();
  const inviteToken = `inv_${crypto.randomBytes(18).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [invite] = await sql`
    INSERT INTO public.business_users (
      business_id,
      invited_email,
      role,
      status,
      location_id,
      invited_by_user_id,
      invite_token,
      invite_expires_at
    ) VALUES (
      ${ctx.business.id},
      ${cleanEmail},
      ${parsed.data.role},
      'invited',
      ${parsed.data.locationId || null},
      ${ctx.user.id},
      ${inviteToken},
      ${expiresAt.toISOString()}
    )
    RETURNING *
  `;

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://loopacards.netlify.app"
  ).replace(/\/$/, "");
  const inviteUrl = `${appUrl}/accept-invite?token=${encodeURIComponent(
    inviteToken
  )}`;

  await triggerSupabaseTransactionalEmail("invite", cleanEmail, inviteUrl);
  console.info(`[Loopa Staff Invite] ${cleanEmail} (${parsed.data.role}): ${inviteUrl}`);

  await writeAuditLog({
    businessId: ctx.business.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.role,
    action: "staff.invited",
    entityType: "business_user",
    entityId: invite.id,
    afterState: { email: cleanEmail, role: parsed.data.role, inviteUrl },
  });

  return NextResponse.json(
    {
      success: true,
      invite,
      inviteUrl,
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRolePermission(ctx.role, ["owner"])) {
    return NextResponse.json(
      { error: "Only the Business Owner can update business settings." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = businessUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid business settings." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const [updated] = await sql`
    UPDATE public.businesses
    SET
      name = ${d.name.trim()},
      logo_url = ${d.logoUrl || null},
      primary_color = ${d.primaryColor},
      currency = ${d.currency},
      timezone = ${d.timezone},
      address = ${d.address || null},
      phone = ${d.phone || null},
      email = ${d.email || null},
      status = ${d.status || ctx.business.status},
      updated_at = NOW()
    WHERE id = ${ctx.business.id}
    RETURNING *
  `;

  await writeAuditLog({
    businessId: ctx.business.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.role,
    action: "business.settings_updated",
    entityType: "business",
    entityId: ctx.business.id,
    beforeState: ctx.business as unknown as Record<string, unknown>,
    afterState: updated as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, business: updated });
}

