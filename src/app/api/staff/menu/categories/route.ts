import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { menuCategorySchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let menus = await sql`
    SELECT * FROM public.menus WHERE business_id = ${ctx.business.id} ORDER BY created_at ASC LIMIT 1
  `;
  if (menus.length === 0) {
    menus = await sql`
      INSERT INTO public.menus (business_id, name, description, status)
      VALUES (${ctx.business.id}, ${`${ctx.business.name} Menu`}, 'Digital Store QR Menu', 'active')
      RETURNING *
    `;
  }

  const categories = await sql`
    SELECT * FROM public.menu_categories
    WHERE business_id = ${ctx.business.id}
    ORDER BY sort_order ASC, created_at ASC
  `;

  return NextResponse.json({ menu: menus[0], categories });
}

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only owners and managers can manage menu categories." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = menuCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid category data." },
        { status: 400 }
      );
    }

    let menus = await sql`
      SELECT * FROM public.menus WHERE business_id = ${ctx.business.id} ORDER BY created_at ASC LIMIT 1
    `;
    if (menus.length === 0) {
      menus = await sql`
        INSERT INTO public.menus (business_id, name, description, status)
        VALUES (${ctx.business.id}, ${`${ctx.business.name} Menu`}, 'Digital Store QR Menu', 'active')
        RETURNING *
      `;
    }

    const [category] = await sql`
      INSERT INTO public.menu_categories (
        business_id, menu_id, name, description, sort_order, status
      ) VALUES (
        ${ctx.business.id},
        ${menus[0].id},
        ${parsed.data.name.trim()},
        ${parsed.data.description?.trim() || null},
        ${parsed.data.sortOrder},
        ${parsed.data.status}
      )
      RETURNING *
    `;

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "menu.category_created",
      entityType: "menu_category",
      entityId: category.id,
      afterState: category as Record<string, unknown>,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error("POST /api/staff/menu/categories error:", err);
    return NextResponse.json(
      { error: "Failed to create category." },
      { status: 500 }
    );
  }
}

