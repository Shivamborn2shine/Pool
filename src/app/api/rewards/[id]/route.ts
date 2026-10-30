import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only Owners and Managers can update rewards." },
      { status: 403 }
    );
  }

  const existingRows = await sql`
    SELECT * FROM public.rewards
    WHERE id = ${params.id} AND business_id = ${ctx.business.id}
    LIMIT 1
  `;

  if (existingRows.length === 0) {
    return NextResponse.json({ error: "Reward not found." }, { status: 404 });
  }

  const before = existingRows[0];
  const body = await request.json();

  const [updated] = await sql`
    UPDATE public.rewards
    SET
      name = ${body.name ? String(body.name).trim() : before.name},
      description = ${
        body.description !== undefined ? body.description || null : before.description
      },
      image_url = ${
        body.imageUrl !== undefined ? body.imageUrl || null : before.image_url
      },
      points_required = ${
        body.pointsRequired !== undefined
          ? Number(body.pointsRequired)
          : before.points_required
      },
      monetary_value = ${
        body.monetaryValue !== undefined
          ? Number(body.monetaryValue)
          : before.monetary_value
      },
      stock_limit = ${
        body.stockLimit !== undefined
          ? body.stockLimit === null || body.stockLimit === ""
            ? null
            : Number(body.stockLimit)
          : before.stock_limit
      },
      status = ${
        body.status && ["active", "inactive"].includes(body.status)
          ? body.status
          : before.status
      },
      updated_at = NOW()
    WHERE id = ${params.id} AND business_id = ${ctx.business.id}
    RETURNING *
  `;

  await writeAuditLog({
    businessId: ctx.business.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.role,
    action: "reward.updated",
    entityType: "reward",
    entityId: params.id,
    beforeState: before as Record<string, unknown>,
    afterState: updated as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, reward: updated });
}

