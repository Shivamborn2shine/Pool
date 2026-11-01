import { sql } from "../src/lib/db";

async function main() {
  const businessId = "e4386b0d-8540-460f-9dbd-cc0cdd2063dd"; // Scoop N Brew

  // 1. Update loyalty_rules to welcome_points = 40, points_value_per_100 = 50
  await sql`
    UPDATE loyalty_rules
    SET 
      signup_bonus_points = 40,
      points_value_per_100 = 50.00,
      minimum_redemption_points = 1,
      updated_at = NOW()
    WHERE business_id = ${businessId}
  `;
  console.log("Updated loyalty_rules: signup_bonus_points = 40");

  // 2. Ensure "Combos & Deals" category exists at sort_order 0
  const existingComboCat = await sql`
    SELECT id FROM menu_categories
    WHERE business_id = ${businessId} AND name ILIKE '%combo%'
    LIMIT 1
  `;

  let comboCatId: string;
  if (existingComboCat.length > 0) {
    comboCatId = existingComboCat[0].id;
    await sql`
      UPDATE menu_categories
      SET name = 'Combos & Deals', sort_order = 0, status = 'active'
      WHERE id = ${comboCatId}
    `;
    console.log("Updated existing combo category:", comboCatId);
  } else {
    // Get menu_id
    const menus = await sql`SELECT id FROM menus WHERE business_id = ${businessId} LIMIT 1`;
    const menuId = menus[0]?.id || null;
    const [newCat] = await sql`
      INSERT INTO menu_categories (business_id, menu_id, name, description, sort_order, status)
      VALUES (${businessId}, ${menuId}, 'Combos & Deals', 'Specially curated value bundles with guaranteed savings', 0, 'active')
      RETURNING id
    `;
    comboCatId = newCat.id;
    console.log("Created new Combos & Deals category:", comboCatId);
  }

  // 3. Define the 7 Core Combos from Section 13 of specification
  const combos = [
    {
      sku: "SNB-C01",
      name: "The Study Break",
      description: "Veg Sandwich (₹99) + Regular Chai (₹25)",
      originalTotal: 124,
      price: 109,
      savings: 15,
      points: 5,
      sort_order: 1,
      image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80", // sandwich & chai
      is_combo: true,
      combo_items: ["Veg Sandwich", "Regular Chai"]
    },
    {
      sku: "SNB-C02",
      name: "Fries Before Guys",
      description: "Peri Peri Fries (₹89) + Oreo Shake (₹99)",
      originalTotal: 188,
      price: 169,
      savings: 19,
      points: 8,
      sort_order: 2,
      image_url: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80", // fries & shake
      is_combo: true,
      combo_items: ["Peri Peri Fries", "Oreo Shake"]
    },
    {
      sku: "SNB-C03",
      name: "Sweet Tooth Therapy",
      description: "Chocolate Waffle (₹129) + Oreo Shake (₹99)",
      originalTotal: 228,
      price: 199,
      savings: 29,
      points: 9,
      sort_order: 3,
      image_url: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80", // waffle & shake
      is_combo: true,
      combo_items: ["Chocolate Waffle", "Oreo Shake"]
    },
    {
      sku: "SNB-C04",
      name: "Campus Cravings",
      description: "Veg Burger (₹99) + Peri Peri Fries (₹89) + Watermelon Mojito (₹99)",
      originalTotal: 287,
      price: 249,
      savings: 38,
      points: 12,
      sort_order: 4,
      image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80", // burger meal
      is_combo: true,
      combo_items: ["Veg Burger", "Peri Peri Fries", "Watermelon Mojito"]
    },
    {
      sku: "SNB-C05",
      name: "Sip & Gossip (For 2)",
      description: "Loaded Peri Peri Fries (₹99) + 2 × Coolers / Mojitos (₹198)",
      originalTotal: 297,
      price: 259,
      savings: 38,
      points: 12,
      sort_order: 5,
      image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80", // drinks & fries
      is_combo: true,
      combo_items: ["Loaded Fries", "2x Mojitos"]
    },
    {
      sku: "SNB-C06",
      name: "Better Together (For 2)",
      description: "2 × Veg Burgers (₹198) + Peri Peri Fries (₹89) + 2 × Mojitos (₹198)",
      originalTotal: 485,
      price: 419,
      savings: 66,
      points: 20,
      sort_order: 6,
      image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80", // duo meal
      is_combo: true,
      combo_items: ["2x Veg Burgers", "Peri Peri Fries", "2x Mojitos"]
    },
    {
      sku: "SNB-C07",
      name: "The Whole Gang (Group Deal)",
      description: "4 × Veg Burgers (₹396) + 2 × Peri Peri Fries (₹178) + 2 × Mojitos (₹198)",
      originalTotal: 772,
      price: 699,
      savings: 73,
      points: 34,
      sort_order: 7,
      image_url: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=80", // feast
      is_combo: true,
      combo_items: ["4x Veg Burgers", "2x Peri Peri Fries", "2x Mojitos"]
    }
  ];

  const menus = await sql`SELECT id FROM menus WHERE business_id = ${businessId} LIMIT 1`;
  const menuId = menus[0]?.id || null;

  for (const c of combos) {
    const existing = await sql`
      SELECT id FROM menu_items
      WHERE business_id = ${businessId} AND name = ${c.name}
    `;

    const descriptionWithMeta = `${c.description} • Save ₹${c.savings} (Menu Total ₹${c.originalTotal})`;

    if (existing.length > 0) {
      await sql`
        UPDATE menu_items
        SET 
          price = ${c.price},
          category_id = ${comboCatId},
          description = ${descriptionWithMeta},
          image_url = ${c.image_url},
          sort_order = ${c.sort_order},
          is_available = true,
          is_visible = true,
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
      console.log(`Updated combo: ${c.name}`);
    } else {
      await sql`
        INSERT INTO menu_items (
          business_id, menu_id, category_id, name, description, price, currency, image_url, is_available, is_visible, sort_order
        ) VALUES (
          ${businessId}, ${menuId}, ${comboCatId}, ${c.name}, ${descriptionWithMeta}, ${c.price}, 'INR', ${c.image_url}, true, true, ${c.sort_order}
        )
      `;
      console.log(`Inserted combo: ${c.name}`);
    }
  }

  // 4. Update the Reward Catalog according to Section 4 of the specification:
  // 50 pts: Regular Chai (₹25 value)
  // 80 pts: Plain Coffee (₹39 value)
  // 100 pts: ₹50 Store Discount (₹50 value)
  // 180 pts: Peri Peri Fries (₹89 value)
  // 200 pts: Any ₹99 Mojito (₹99 value)
  // 260 pts: Chocolate Waffle (₹129 value)
  // 300 pts: Biscoff Waffle (₹149 value)
  const targetRewards = [
    {
      name: "Regular Chai",
      description: "Aromatic classic hot chai brewed with fresh whole spices. (Qualifying order ₹149+)",
      points_required: 50,
      monetary_value: 25.00
    },
    {
      name: "Plain Coffee",
      description: "Freshly brewed hot aromatic filter coffee. (Qualifying order ₹149+)",
      points_required: 80,
      monetary_value: 39.00
    },
    {
      name: "₹50 Off Bill",
      description: "Flat ₹50 discount on your total dine-in or takeaway order of ₹299+.",
      points_required: 100,
      monetary_value: 50.00
    },
    {
      name: "Peri Peri Fries",
      description: "Crispy seasoned golden potato fries with spicy peri-peri dust. (Qualifying order ₹149+)",
      points_required: 180,
      monetary_value: 89.00
    },
    {
      name: "Handcrafted Mojito",
      description: "Any refreshing iced cooler or fizzy fruit mojito. (Qualifying order ₹149+)",
      points_required: 200,
      monetary_value: 99.00
    },
    {
      name: "Chocolate Waffle",
      description: "Fresh baked Belgian waffle loaded with warm chocolate drizzle. (Qualifying order ₹149+)",
      points_required: 260,
      monetary_value: 129.00
    },
    {
      name: "Biscoff Waffle",
      description: "Crispy waffle topped with rich Lotus Biscoff spread and crumbs. (Qualifying order ₹149+)",
      points_required: 300,
      monetary_value: 149.00
    }
  ];

  for (const r of targetRewards) {
    const existing = await sql`
      SELECT id FROM rewards
      WHERE business_id = ${businessId} AND name = ${r.name}
    `;
    if (existing.length > 0) {
      await sql`
        UPDATE rewards
        SET 
          description = ${r.description},
          points_required = ${r.points_required},
          monetary_value = ${r.monetary_value},
          status = 'active',
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
      console.log(`Updated reward: ${r.name}`);
    } else {
      await sql`
        INSERT INTO rewards (
          business_id, name, description, points_required, monetary_value, status
        ) VALUES (
          ${businessId}, ${r.name}, ${r.description}, ${r.points_required}, ${r.monetary_value}, 'active'
        )
      `;
      console.log(`Inserted reward: ${r.name}`);
    }
  }

  console.log("All combos and rewards seeded successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

