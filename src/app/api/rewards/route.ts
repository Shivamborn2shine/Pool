import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { rewardCreateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rewards = await sql`
    SELECT * FROM public.rewards
    WHERE business_id = ${ctx.business.id}
    ORDER BY status ASC, points_required ASC, created_at DESC
  `;

  return NextResponse.json({ rewards, role: ctx.role });
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Section 9: Owner and Manager can create/edit rewards
  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only Owners and Managers can create rewards." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = rewardCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid reward fields." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const [reward] = await sql`
    INSERT INTO public.rewards (
      business_id,
      name,
      description,
      image_url,
      points_required,
      monetary_value,
      stock_limit,
      status
    ) VALUES (
      ${ctx.business.id},
      ${d.name.trim()},
      ${d.description || null},
      ${d.imageUrl || null},
      ${d.pointsRequired},
      ${d.monetaryValue},
      ${d.stockLimit ?? null},
      ${d.status}
    )
    RETURNING *
  `;

  await writeAuditLog({
    businessId: ctx.business.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.role,
    action: "reward.created",
    entityType: "reward",
    entityId: reward.id,
    afterState: reward as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, reward }, { status: 201 });
}

