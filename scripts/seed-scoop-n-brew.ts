import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";
import { SCOOP_N_BREW_MENU_PRESET } from "../src/lib/menu-presets";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function seedScoopNBrew() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing in .env");
  }

  const sql = postgres(databaseUrl, { ssl: "require" });

  try {
    const businesses = await sql`
      SELECT id, name, slug, currency, order_prefix
      FROM public.businesses
      ORDER BY created_at DESC
    `;

    console.log("Found businesses in DB:", businesses);

    const scoopMatches = businesses.filter(
      (b) =>
        String(b.slug).toLowerCase().includes("scoop") ||
        String(b.name).toLowerCase().includes("scoop")
    );

    if (scoopMatches.length === 0) {
      console.log(
        "No business matching 'Scoop n Brew' found in DB yet. Creating or skipping..."
      );
      return;
    }

    for (const biz of scoopMatches) {
      console.log(
        `\nPopulating Scoop n Brew menu for business: ${biz.name} (${biz.slug}, id=${biz.id})...`
      );

      await sql.begin(async (tx) => {
        const q = tx as unknown as typeof sql;

        if (SCOOP_N_BREW_MENU_PRESET.orderPrefix) {
          await q`
            UPDATE public.businesses
            SET order_prefix = ${SCOOP_N_BREW_MENU_PRESET.orderPrefix},
                updated_at = NOW()
            WHERE id = ${biz.id}
          `;
        }

        // Ensure store_qr_codes row exists
        const destUrl = `https://loopacards.netlify.app/s/${biz.slug}`;
        await q`
          INSERT INTO public.store_qr_codes (business_id, slug, destination_url, label, status)
          VALUES (${biz.id}, ${biz.slug}, ${destUrl}, ${biz.name + " Store QR"}, 'active')
          ON CONFLICT (slug) DO UPDATE SET
            destination_url = EXCLUDED.destination_url,
            updated_at = NOW()
        `;

        // Ensure active menu exists
        const existingMenus = await q`
          SELECT id FROM public.menus
          WHERE business_id = ${biz.id}
          ORDER BY created_at ASC
          LIMIT 1
        `;

        let menuId: string;
        if (existingMenus.length === 0) {
          const [createdMenu] = await q`
            INSERT INTO public.menus (business_id, name, description, status)
            VALUES (
              ${biz.id},
              'Main Store Menu',
              'Good Food • Great Vibes',
              'active'
            )
            RETURNING id
          `;
          menuId = createdMenu.id;
        } else {
          menuId = existingMenus[0].id;
        }

        // Clear existing categories & items for this business so the menu is clean and exact
        await q`
          DELETE FROM public.menu_categories
          WHERE business_id = ${biz.id}
        `;

        let totalCategories = 0;
        let totalItems = 0;

        for (let cIdx = 0; cIdx < SCOOP_N_BREW_MENU_PRESET.categories.length; cIdx++) {
          const cat = SCOOP_N_BREW_MENU_PRESET.categories[cIdx];
          const [catRow] = await q`
            INSERT INTO public.menu_categories (
              menu_id, business_id, name, description, sort_order, status
            )
            VALUES (
              ${menuId},
              ${biz.id},
              ${cat.name},
              ${cat.description || null},
              ${cat.sortOrder ?? cIdx + 1},
              'active'
            )
            RETURNING id
          `;
          totalCategories++;

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
                ${catRow.id},
                ${biz.id},
                ${item.name},
                ${item.description || null},
                ${item.price},
                ${biz.currency || "INR"},
                ${item.isAvailable ?? true},
                ${item.isVisible ?? true},
                ${iIdx + 1},
                ${item.loyaltyMultiplier ?? 1}
              )
              RETURNING id
            `;
            totalItems++;

            if (item.variants && item.variants.length > 0) {
              for (let vIdx = 0; vIdx < item.variants.length; vIdx++) {
                const v = item.variants[vIdx];
                await q`
                  INSERT INTO public.menu_item_variants (
                    menu_item_id, name, price_delta, is_available, sort_order
                  )
                  VALUES (
                    ${itemRow.id},
                    ${v.name},
                    ${v.priceDelta || 0},
                    true,
                    ${vIdx + 1}
                  )
                `;
              }
            }

            if (item.addons && item.addons.length > 0) {
              for (let aIdx = 0; aIdx < item.addons.length; aIdx++) {
                const a = item.addons[aIdx];
                await q`
                  INSERT INTO public.menu_item_addons (
                    menu_item_id, name, price, is_available, sort_order
                  )
                  VALUES (
                    ${itemRow.id},
                    ${a.name},
                    ${a.price || 0},
                    true,
                    ${aIdx + 1}
                  )
                `;
              }
            }
          }
        }

        console.log(
          `Successfully seeded ${totalCategories} categories and ${totalItems} menu items for ${biz.name} (${biz.slug})!`
        );
      });
    }
  } finally {
    await sql.end();
  }
}

seedScoopNBrew().catch((err) => {
  console.error("Error seeding Scoop n Brew menu:", err);
  process.exit(1);
});
