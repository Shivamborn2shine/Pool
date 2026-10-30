import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { menuItemSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await sql`
    SELECT * FROM public.menu_categories
    WHERE business_id = ${ctx.business.id}
    ORDER BY sort_order ASC, created_at ASC
  `;

  const items = await sql`
    SELECT
      mi.*,
      mc.name AS category_name
    FROM public.menu_items mi
    LEFT JOIN public.menu_categories mc ON mc.id = mi.category_id
    WHERE mi.business_id = ${ctx.business.id}
    ORDER BY mc.sort_order ASC, mi.sort_order ASC, mi.created_at ASC
  `;

  const itemIds = items.map((i) => i.id);
  const variants =
    itemIds.length > 0
      ? await sql`
          SELECT * FROM public.menu_item_variants
          WHERE menu_item_id IN ${sql(itemIds)}
          ORDER BY sort_order ASC
        `
      : [];
  const addons =
    itemIds.length > 0
      ? await sql`
          SELECT * FROM public.menu_item_addons
          WHERE menu_item_id IN ${sql(itemIds)}
          ORDER BY sort_order ASC
        `
      : [];

  return NextResponse.json({
    categories,
    items: items.map((item) => ({
      ...item,
      price: Number(item.price),
      loyalty_multiplier: Number(item.loyalty_multiplier ?? 1),
      variants: variants.filter((v) => v.menu_item_id === item.id),
      addons: addons.filter((a) => a.menu_item_id === item.id),
    })),
    business: ctx.business,
    role: ctx.role,
  });
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only owners and managers can add menu items." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid menu item data." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const catRows = await sql`
      SELECT * FROM public.menu_categories
      WHERE id = ${d.categoryId} AND business_id = ${ctx.business.id}
      LIMIT 1
    `;
    if (catRows.length === 0) {
      return NextResponse.json(
        { error: "Selected category does not belong to this business." },
        { status: 400 }
      );
    }

    const createdItem = await sql.begin(async (tx) => {
      const [item] = await tx`
        INSERT INTO public.menu_items (
          business_id,
          menu_id,
          category_id,
          name,
          description,
          price,
          currency,
          image_url,
          is_available,
          is_visible,
          sort_order,
          loyalty_multiplier
        ) VALUES (
          ${ctx.business.id},
          ${catRows[0].menu_id},
          ${d.categoryId},
          ${d.name.trim()},
          ${d.description?.trim() || null},
          ${d.price},
          ${ctx.business.currency || "INR"},
          ${d.imageUrl || null},
          ${d.isAvailable},
          ${d.isVisible},
          ${d.sortOrder},
          ${d.loyaltyMultiplier}
        )
        RETURNING *
      `;

      for (let i = 0; i < (d.variants || []).length; i++) {
        const v = d.variants[i];
        await tx`
          INSERT INTO public.menu_item_variants (menu_item_id, name, price_delta, is_available, sort_order)
          VALUES (${item.id}, ${v.name.trim()}, ${v.priceDelta}, TRUE, ${i + 1})
        `;
      }

      for (let i = 0; i < (d.addons || []).length; i++) {
        const a = d.addons[i];
        await tx`
          INSERT INTO public.menu_item_addons (menu_item_id, name, price, is_available, sort_order)
          VALUES (${item.id}, ${a.name.trim()}, ${a.price}, TRUE, ${i + 1})
        `;
      }

      return item;
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "menu.item_created",
      entityType: "menu_item",
      entityId: createdItem.id,
      afterState: createdItem as Record<string, unknown>,
    });

    return NextResponse.json({ item: createdItem }, { status: 201 });
  } catch (err) {
    console.error("POST /api/staff/menu/items error:", err);
    return NextResponse.json(
      { error: "Failed to create menu item." },
      { status: 500 }
    );
  }
}

