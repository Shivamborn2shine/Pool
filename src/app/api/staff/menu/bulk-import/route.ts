import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const bulkMenuVariantSchema = z.object({
  name: z.string().min(1).max(80),
  priceDelta: z.coerce.number().default(0),
});

const bulkMenuAddonSchema = z.object({
  name: z.string().min(1).max(80),
  price: z.coerce.number().min(0).default(0),
});

const bulkMenuItemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(400).optional().nullable(),
  price: z.coerce.number().min(0),
  loyaltyMultiplier: z.coerce.number().min(0).max(20).optional().default(1),
  isAvailable: z.boolean().optional().default(true),
  isVisible: z.boolean().optional().default(true),
  variants: z.array(bulkMenuVariantSchema).optional().default([]),
  addons: z.array(bulkMenuAddonSchema).optional().default([]),
});

const bulkMenuCategorySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(250).optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  items: z.array(bulkMenuItemSchema).default([]),
});

const bulkMenuImportSchema = z.object({
  mode: z.enum(["replace", "merge"]).optional().default("replace"),
  orderPrefix: z.string().min(2).max(6).optional(),
  categories: z
    .array(bulkMenuCategorySchema)
    .min(1, "At least one category is required."),
});

export async function POST(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only owners and managers can bulk import menus." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = bulkMenuImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Invalid menu JSON structure. Please verify categories and items.",
        },
        { status: 400 }
      );
    }

    const { mode, orderPrefix, categories } = parsed.data;

    let categoriesCreated = 0;
    let itemsCreated = 0;

    await sql.begin(async (tx) => {
      const q = tx as unknown as typeof sql;

      if (orderPrefix) {
        await q`
          UPDATE public.businesses
          SET order_prefix = ${orderPrefix.toUpperCase()},
              updated_at = NOW()
          WHERE id = ${ctx.business.id}
        `;
      }

      // Ensure active menu exists for this business
      const existingMenus = await q`
        SELECT id FROM public.menus
        WHERE business_id = ${ctx.business.id}
        ORDER BY created_at ASC
        LIMIT 1
      `;

      let menuId: string;
      if (existingMenus.length === 0) {
        const [createdMenu] = await q`
          INSERT INTO public.menus (business_id, name, description, status)
          VALUES (${ctx.business.id}, 'Main Store Menu', 'Default store ordering menu', 'active')
          RETURNING id
        `;
        menuId = createdMenu.id;
      } else {
        menuId = existingMenus[0].id;
      }

      if (mode === "replace") {
        await q`
          DELETE FROM public.menu_categories
          WHERE business_id = ${ctx.business.id}
        `;
      }

      for (let cIdx = 0; cIdx < categories.length; cIdx++) {
        const cat = categories[cIdx];
        let categoryId: string | null = null;

        if (mode === "merge") {
          const existingCat = await q`
            SELECT id FROM public.menu_categories
            WHERE business_id = ${ctx.business.id}
              AND LOWER(name) = LOWER(${cat.name.trim()})
            LIMIT 1
          `;
          if (existingCat.length > 0) {
            categoryId = existingCat[0].id;
          }
        }

        if (!categoryId) {
          const [catRow] = await q`
            INSERT INTO public.menu_categories (
              menu_id, business_id, name, description, sort_order, status
            )
            VALUES (
              ${menuId},
              ${ctx.business.id},
              ${cat.name.trim()},
              ${cat.description?.trim() || null},
              ${cat.sortOrder ?? cIdx + 1},
              'active'
            )
            RETURNING id
          `;
          categoryId = catRow.id;
          categoriesCreated++;
        }

        for (let iIdx = 0; iIdx < cat.items.length; iIdx++) {
          const item = cat.items[iIdx];
          const [itemRow] = await q`
            INSERT INTO public.menu_items (
              menu_id,
              category_id,
              business_id,
              name,
              description,
              price,
              currency,
              is_available,
              is_visible,
              sort_order,
              loyalty_multiplier
            )
            VALUES (
              ${menuId},
              ${categoryId},
              ${ctx.business.id},
              ${item.name.trim()},
              ${item.description?.trim() || null},
              ${item.price},
              ${ctx.business.currency || "INR"},
              ${item.isAvailable ?? true},
              ${item.isVisible ?? true},
              ${iIdx + 1},
              ${item.loyaltyMultiplier ?? 1}
            )
            RETURNING id
          `;
          itemsCreated++;

          for (let vIdx = 0; vIdx < (item.variants?.length || 0); vIdx++) {
            const v = item.variants[vIdx];
            await q`
              INSERT INTO public.menu_item_variants (
                menu_item_id, name, price_delta, is_available, sort_order
              )
              VALUES (
                ${itemRow.id},
                ${v.name.trim()},
                ${v.priceDelta || 0},
                true,
                ${vIdx + 1}
              )
            `;
          }

          for (let aIdx = 0; aIdx < (item.addons?.length || 0); aIdx++) {
            const a = item.addons[aIdx];
            await q`
              INSERT INTO public.menu_item_addons (
                menu_item_id, name, price, is_available, sort_order
              )
              VALUES (
                ${itemRow.id},
                ${a.name.trim()},
                ${a.price || 0},
                true,
                ${aIdx + 1}
              )
            `;
          }
        }
      }
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "menu.bulk_imported",
      entityType: "menu",
      afterState: {
        mode,
        categoriesCreated,
        itemsCreated,
      },
    });

    return NextResponse.json({
      success: true,
      mode,
      categoriesCreated,
      itemsCreated,
    });
  } catch (err) {
    console.error("POST /api/staff/menu/bulk-import error:", err);
    return NextResponse.json(
      { error: "Failed to bulk import menu." },
      { status: 500 }
    );
  }
}
