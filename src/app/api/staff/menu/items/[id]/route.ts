import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { menuItemUpdateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Cashiers can toggle item availability (sold out), managers/owners can edit everything
  try {
    const existingRows = await sql`
      SELECT * FROM public.menu_items
      WHERE id = ${params.id} AND business_id = ${ctx.business.id}
      LIMIT 1
    `;
    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: "Menu item not found." },
        { status: 404 }
      );
    }

    const beforeItem = existingRows[0];
    const body = await request.json();
    const parsed = menuItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid item update." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    if (
      ctx.role === "cashier" &&
      (d.price !== undefined || d.name !== undefined || d.categoryId !== undefined)
    ) {
      return NextResponse.json(
        { error: "Cashiers can only toggle item availability (sold out status)." },
        { status: 403 }
      );
    }

    const [updated] = await sql`
      UPDATE public.menu_items
      SET
        category_id = ${d.categoryId ?? beforeItem.category_id},
        name = ${d.name ? d.name.trim() : beforeItem.name},
        description = ${
          d.description !== undefined
            ? d.description?.trim() || null
            : beforeItem.description
        },
        price = ${d.price !== undefined ? d.price : beforeItem.price},
        image_url = ${
          d.imageUrl !== undefined ? d.imageUrl || null : beforeItem.image_url
        },
        is_available = ${
          d.isAvailable !== undefined ? d.isAvailable : beforeItem.is_available
        },
        is_visible = ${
          d.isVisible !== undefined ? d.isVisible : beforeItem.is_visible
        },
        sort_order = ${
          d.sortOrder !== undefined ? d.sortOrder : beforeItem.sort_order
        },
        loyalty_multiplier = ${
          d.loyaltyMultiplier !== undefined
            ? d.loyaltyMultiplier
            : beforeItem.loyalty_multiplier
        },
        updated_at = NOW()
      WHERE id = ${params.id} AND business_id = ${ctx.business.id}
      RETURNING *
    `;

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "menu.item_updated",
      entityType: "menu_item",
      entityId: params.id,
      beforeState: beforeItem as Record<string, unknown>,
      afterState: updated as Record<string, unknown>,
    });

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error("PATCH /api/staff/menu/items/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update menu item." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only owners and managers can delete menu items." },
      { status: 403 }
    );
  }

  await sql`
    DELETE FROM public.menu_items
    WHERE id = ${params.id} AND business_id = ${ctx.business.id}
  `;

  return NextResponse.json({ success: true });
}

