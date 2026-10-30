import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only owners and managers can edit menu categories." },
      { status: 403 }
    );
  }

  try {
    const existingRows = await sql`
      SELECT * FROM public.menu_categories
      WHERE id = ${params.id} AND business_id = ${ctx.business.id}
      LIMIT 1
    `;
    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    const beforeCat = existingRows[0];
    const body = await request.json();

    const nextName =
      body.name !== undefined ? String(body.name).trim() : beforeCat.name;
    if (nextName.length < 2) {
      return NextResponse.json(
        { error: "Category name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const nextDesc =
      body.description !== undefined
        ? body.description
          ? String(body.description).trim()
          : null
        : beforeCat.description;

    const nextSort =
      body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))
        ? Math.max(0, Math.min(999, Math.round(Number(body.sortOrder))))
        : Number(beforeCat.sort_order ?? 0);

    const nextStatus =
      body.status === "active" || body.status === "inactive"
        ? body.status
        : beforeCat.status;

    const [updated] = await sql`
      UPDATE public.menu_categories
      SET
        name = ${nextName},
        description = ${nextDesc},
        sort_order = ${nextSort},
        status = ${nextStatus},
        updated_at = NOW()
      WHERE id = ${params.id} AND business_id = ${ctx.business.id}
      RETURNING *
    `;

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "menu.category_updated",
      entityType: "menu_category",
      entityId: params.id,
      beforeState: beforeCat as Record<string, unknown>,
      afterState: updated as Record<string, unknown>,
    });

    return NextResponse.json({ category: updated });
  } catch (err) {
    console.error("PATCH /api/staff/menu/categories/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only owners and managers can delete menu categories." },
      { status: 403 }
    );
  }

  try {
    const existingRows = await sql`
      SELECT * FROM public.menu_categories
      WHERE id = ${params.id} AND business_id = ${ctx.business.id}
      LIMIT 1
    `;
    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    const beforeCat = existingRows[0];
    const { searchParams } = new URL(request.url);
    const moveItemsToCategoryId = searchParams.get("moveItemsToCategoryId");

    await sql.begin(async (tx) => {
      if (moveItemsToCategoryId) {
        const targetCat = await tx`
          SELECT id FROM public.menu_categories
          WHERE id = ${moveItemsToCategoryId}
            AND business_id = ${ctx.business.id}
            AND id <> ${params.id}
          LIMIT 1
        `;
        if (targetCat.length === 0) {
          throw new Error("Target category for moving items was not found.");
        }
        await tx`
          UPDATE public.menu_items
          SET category_id = ${moveItemsToCategoryId}, updated_at = NOW()
          WHERE category_id = ${params.id} AND business_id = ${ctx.business.id}
        `;
      }

      await tx`
        DELETE FROM public.menu_categories
        WHERE id = ${params.id} AND business_id = ${ctx.business.id}
      `;
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "menu.category_deleted",
      entityType: "menu_category",
      entityId: params.id,
      beforeState: beforeCat as Record<string, unknown>,
      afterState: { moved_items_to: moveItemsToCategoryId || null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/staff/menu/categories/[id] error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to delete category.",
      },
      { status: 400 }
    );
  }
}

