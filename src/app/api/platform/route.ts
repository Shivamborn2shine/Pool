import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.user.is_platform_admin) {
    return NextResponse.json(
      { error: "Platform Administrator access required." },
      { status: 403 }
    );
  }

  const businesses = await sql`
    SELECT
      b.*,
      COUNT(DISTINCT c.id)::int AS customer_count,
      COUNT(DISTINCT lc.id)::int AS card_count,
      COUNT(DISTINCT p.id)::int AS purchase_count,
      COALESCE(SUM(lc.points_balance), 0)::int AS total_points_outstanding
    FROM public.businesses b
    LEFT JOIN public.customers c ON c.business_id = b.id
    LEFT JOIN public.loyalty_cards lc ON lc.business_id = b.id
    LEFT JOIN public.purchases p ON p.business_id = b.id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `;

  // PLAT-04: Abuse / Fraud alerts (rejected/duplicate claims & large manual adjustments)
  const fraudAlerts = await sql`
    SELECT
      p.id,
      p.amount,
      p.status,
      p.receipt_number,
      p.review_note,
      p.created_at,
      b.name AS business_name,
      c.full_name AS customer_name,
      lc.card_number
    FROM public.purchases p
    JOIN public.businesses b ON b.id = p.business_id
    JOIN public.customers c ON c.id = p.customer_id
    JOIN public.loyalty_cards lc ON lc.id = p.card_id
    WHERE p.source = 'customer_claim'
      AND p.status IN ('duplicate', 'rejected', 'expired')
    ORDER BY p.created_at DESC
    LIMIT 25
  `;

  const platformLogs = await sql`
    SELECT
      al.*,
      u.email AS actor_email,
      b.name AS business_name
    FROM public.audit_logs al
    LEFT JOIN public.users u ON u.id = al.actor_user_id
    LEFT JOIN public.businesses b ON b.id = al.business_id
    ORDER BY al.created_at DESC
    LIMIT 40
  `;

  return NextResponse.json({
    businesses,
    fraudAlerts,
    platformLogs,
    currentSession: {
      isImpersonating: ctx.isImpersonating,
      activeBusiness: ctx.business,
      impersonationReason: ctx.impersonationReason,
    },
  });
}

export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.user.is_platform_admin) {
    return NextResponse.json(
      { error: "Platform Administrator access required." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { action, businessId, status, subscriptionPlan, reason } = body;

  // PLAT-02: Suspend or restore a business
  if (action === "update_status") {
    if (!businessId || !["active", "suspended", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Valid businessId and status required." },
        { status: 400 }
      );
    }

    const [updated] = await sql`
      UPDATE public.businesses
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${businessId}
      RETURNING *
    `;

    await writeAuditLog({
      businessId,
      actorUserId: ctx.user.id,
      actorRole: "platform_admin",
      action: `platform.business_${status}`,
      entityType: "business",
      entityId: businessId,
      afterState: { status, reason },
    });

    return NextResponse.json({ success: true, business: updated });
  }

  // PLAT-05: Manage subscription plans
  if (action === "update_plan") {
    if (
      !businessId ||
      !["starter", "growth", "scale"].includes(subscriptionPlan)
    ) {
      return NextResponse.json(
        { error: "Valid businessId and subscriptionPlan required." },
        { status: 400 }
      );
    }

    const [updated] = await sql`
      UPDATE public.businesses
      SET subscription_plan = ${subscriptionPlan}, updated_at = NOW()
      WHERE id = ${businessId}
      RETURNING *
    `;

    await writeAuditLog({
      businessId,
      actorUserId: ctx.user.id,
      actorRole: "platform_admin",
      action: "platform.subscription_plan_changed",
      entityType: "business",
      entityId: businessId,
      afterState: { subscriptionPlan },
    });

    return NextResponse.json({ success: true, business: updated });
  }

  // PLAT-03: Impersonate a business with mandatory explicit reason & audit log
  if (action === "impersonate") {
    if (!businessId || !reason || String(reason).trim().length < 5) {
      return NextResponse.json(
        {
          error:
            "An explicit audit reason (at least 5 characters) is required to impersonate a business.",
        },
        { status: 400 }
      );
    }

    await sql`
      UPDATE public.user_sessions
      SET impersonated_business_id = ${businessId},
          impersonation_reason = ${String(reason).trim()}
      WHERE id = ${ctx.sessionId}
    `;

    await writeAuditLog({
      businessId,
      actorUserId: ctx.user.id,
      actorRole: "platform_admin",
      action: "platform.impersonation_started",
      entityType: "business",
      entityId: businessId,
      afterState: { reason: String(reason).trim() },
    });

    return NextResponse.json({ success: true });
  }

  if (action === "stop_impersonation") {
    await sql`
      UPDATE public.user_sessions
      SET impersonated_business_id = NULL,
          impersonation_reason = NULL
      WHERE id = ${ctx.sessionId}
    `;

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: "platform_admin",
      action: "platform.impersonation_ended",
      entityType: "business",
      entityId: ctx.business.id,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown platform action." }, { status: 400 });
}

