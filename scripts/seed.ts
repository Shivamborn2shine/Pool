import postgres from "postgres";
import crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

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

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres.axkhqktmixesmrafcrju:Shivam%40161189@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function seed() {
  console.log("Seeding Loopa demo data into Supabase PostgreSQL...");
  const sql = postgres(connectionString, { prepare: false, max: 1 });

  try {
    const passwordHash = hashPassword("Loopa@2026");

    // 1. Create Users (Platform Admin, Owner, Manager, Cashier)
    const [ownerUser] = await sql`
      INSERT INTO public.users (email, password_hash, full_name, phone, is_platform_admin, email_verified_at)
      VALUES ('owner@arakucoffee.in', ${passwordHash}, 'Vikramaditya Rao', '+919845011223', TRUE, NOW())
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, is_platform_admin = TRUE
      RETURNING *
    `;

    const [managerUser] = await sql`
      INSERT INTO public.users (email, password_hash, full_name, phone, is_platform_admin, email_verified_at)
      VALUES ('manager@arakucoffee.in', ${passwordHash}, 'Meera Nair', '+919845022334', FALSE, NOW())
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING *
    `;

    const [cashierUser] = await sql`
      INSERT INTO public.users (email, password_hash, full_name, phone, is_platform_admin, email_verified_at)
      VALUES ('cashier@arakucoffee.in', ${passwordHash}, 'Rohan Kulkarni', '+919845033445', FALSE, NOW())
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING *
    `;

    // 2. Create Demo Business
    const [business] = await sql`
      INSERT INTO public.businesses (
        name, slug, primary_color, currency, timezone, address, phone, email, status, subscription_plan
      ) VALUES (
        'Araku Filter Coffee & Bakehouse',
        'araku-filter-coffee',
        '#18181B',
        'INR',
        'Asia/Kolkata',
        '12th Main, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
        '+91 80 4123 8890',
        'hello@arakucoffee.in',
        'active',
        'growth'
      )
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `;

    // Second business for Platform Owner view
    await sql`
      INSERT INTO public.businesses (
        name, slug, primary_color, currency, timezone, address, phone, email, status, subscription_plan
      ) VALUES (
        'Banyan Tree Salon & Spa',
        'banyan-tree-salon',
        '#C2410C',
        'INR',
        'Asia/Kolkata',
        'Bandra West, Mumbai 400050',
        '+91 22 2640 9911',
        'care@banyantreesalon.in',
        'active',
        'scale'
      )
      ON CONFLICT (slug) DO NOTHING
    `;

    // 3. Locations
    const existingLocs = await sql`
      SELECT * FROM public.business_locations WHERE business_id = ${business.id}
    `;
    let mainLocationId: string;
    if (existingLocs.length === 0) {
      const [loc1] = await sql`
        INSERT INTO public.business_locations (business_id, name, address, phone)
        VALUES (${business.id}, 'Indiranagar 12th Main Flagship', '12th Main, Indiranagar, Bengaluru', '+91 80 4123 8890')
        RETURNING *
      `;
      await sql`
        INSERT INTO public.business_locations (business_id, name, address, phone)
        VALUES (${business.id}, 'Koramangala 4th Block Roastery', '80 Feet Road, Koramangala, Bengaluru', '+91 80 4123 8895')
      `;
      mainLocationId = loc1.id;
    } else {
      mainLocationId = existingLocs[0].id;
    }

    // 4. Business Memberships
    for (const [u, role] of [
      [ownerUser, "owner"],
      [managerUser, "manager"],
      [cashierUser, "cashier"],
    ] as const) {
      const existingMember = await sql`
        SELECT id FROM public.business_users
        WHERE business_id = ${business.id} AND user_id = ${u.id}
      `;
      if (existingMember.length === 0) {
        await sql`
          INSERT INTO public.business_users (
            business_id, user_id, invited_email, role, status, location_id, joined_at
          ) VALUES (
            ${business.id}, ${u.id}, ${u.email}, ${role}, 'active', ${mainLocationId}, NOW()
          )
        `;
      }
    }

    // 5. Loyalty Rules
    await sql`
      INSERT INTO public.loyalty_rules (
        business_id,
        points_per_currency_unit,
        currency_unit,
        minimum_purchase_amount,
        maximum_points_per_transaction,
        points_value_per_100,
        minimum_redemption_points,
        claim_enabled,
        claim_window_days,
        daily_claim_limit,
        receipt_required_above_amount,
        signup_bonus_points,
        points_expiry_months,
        campaign_name,
        campaign_multiplier,
        manager_adjustment_limit
      ) VALUES (
        ${business.id}, 1, 10, 50, 500, 100, 100, TRUE, 7, 3, 500, 25, 12, 'Monsoon Pour-Over Bonus', 1.25, 500
      )
      ON CONFLICT (business_id) DO NOTHING
    `;

    // 6. Rewards Catalog
    const existingRewards = await sql`
      SELECT * FROM public.rewards WHERE business_id = ${business.id}
    `;
    let freeCoffeeRewardId: string;
    if (existingRewards.length === 0) {
      const [r1] = await sql`
        INSERT INTO public.rewards (business_id, name, description, points_required, monetary_value, stock_limit, redeemed_count, status)
        VALUES
          (${business.id}, 'Handcrafted Filter Coffee or Cold Brew', 'Any regular hot brass-davara filter coffee or 18-hour steeped cold brew.', 120, 180, NULL, 14, 'active'),
          (${business.id}, 'Sourdough Almond Croissant', 'Freshly baked laminated croissant with roasted almond frangipane.', 160, 240, 50, 9, 'active'),
          (${business.id}, '250g Single-Estate Araku Whole Beans', 'Medium-dark roast specialty Arabica coffee pack (whole bean or ground).', 350, 550, 25, 4, 'active'),
          (${business.id}, 'Weekend Tasting Flight for Two', 'Guided pour-over flight + 2 artisanal pastries at our Indiranagar bar.', 500, 850, 10, 2, 'active')
        RETURNING *
      `;
      freeCoffeeRewardId = r1.id;
    } else {
      freeCoffeeRewardId = existingRewards[0].id;
    }

    // 7. Customers & Loyalty Cards
    const demoCustomers = [
      {
        fullName: "Ananya Deshmukh",
        phone: "+919845098765",
        email: "ananya.d@example.com",
        cardNumber: "ARK-4821-9012",
        publicId: "cd_araku_ananya_01",
        pointsBalance: 340,
        redeemableAmount: 150,
        pendingPoints: 65,
        lifetimeEarned: 560,
        lifetimeRedeemed: 220,
        lifetimePurchase: 4850,
        tags: ["vip", "morning-regular"],
      },
      {
        fullName: "Karthik Subramanian",
        phone: "+919845012340",
        email: "karthik.s@example.com",
        cardNumber: "ARK-7731-2049",
        publicId: "cd_araku_karthik_02",
        pointsBalance: 185,
        redeemableAmount: 0,
        pendingPoints: 0,
        lifetimeEarned: 305,
        lifetimeRedeemed: 120,
        lifetimePurchase: 2680,
        tags: ["whole-bean-buyer"],
      },
      {
        fullName: "Priya Menon",
        phone: "+919845055667",
        email: "priya.menon@example.com",
        cardNumber: "ARK-3390-1184",
        publicId: "cd_araku_priya_03",
        pointsBalance: 90,
        redeemableAmount: 50,
        pendingPoints: 48,
        lifetimeEarned: 140,
        lifetimeRedeemed: 50,
        lifetimePurchase: 1120,
        tags: ["weekend"],
      },
      {
        fullName: "Siddharth Verma",
        phone: "+919845077889",
        email: "siddharth.v@example.com",
        cardNumber: "ARK-6102-8831",
        publicId: "cd_araku_siddharth_04",
        pointsBalance: 520,
        redeemableAmount: 200,
        pendingPoints: 0,
        lifetimeEarned: 870,
        lifetimeRedeemed: 350,
        lifetimePurchase: 7490,
        tags: ["vip", "roastery-club"],
      },
    ];

    for (const c of demoCustomers) {
      const [cust] = await sql`
        INSERT INTO public.customers (
          business_id, full_name, phone, email, tags, marketing_consent, loyalty_consent, created_by_user_id
        ) VALUES (
          ${business.id},
          ${c.fullName},
          ${c.phone},
          ${c.email},
          ${sql.json(c.tags as never)},
          TRUE,
          TRUE,
          ${ownerUser.id}
        )
        ON CONFLICT (business_id, phone) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING *
      `;

      const [card] = await sql`
        INSERT INTO public.loyalty_cards (
          business_id,
          customer_id,
          card_number,
          public_id,
          status,
          points_balance,
          redeemable_amount,
          pending_points,
          lifetime_points_earned,
          lifetime_points_redeemed,
          lifetime_purchase_amount
        ) VALUES (
          ${business.id},
          ${cust.id},
          ${c.cardNumber},
          ${c.publicId},
          'active',
          ${c.pointsBalance},
          ${c.redeemableAmount},
          ${c.pendingPoints},
          ${c.lifetimeEarned},
          ${c.lifetimeRedeemed},
          ${c.lifetimePurchase}
        )
        ON CONFLICT (public_id) DO NOTHING
        RETURNING *
      `;

      if (card) {
        // Seed initial purchase & transactions for this card
        const [p1] = await sql`
          INSERT INTO public.purchases (
            business_id, location_id, customer_id, card_id, amount, currency, purchase_date,
            receipt_number, category, notes, points_awarded, source, status, created_by_user_id
          ) VALUES (
            ${business.id}, ${mainLocationId}, ${cust.id}, ${card.id}, 680, 'INR', NOW() - INTERVAL '3 days',
            ${`INV-${c.cardNumber.slice(-4)}-01`}, 'Dine-in & Beans', '2x Pour-over + Sourdough Toast', 85, 'admin_entered', 'approved', ${cashierUser.id}
          )
          RETURNING *
        `;

        await sql`
          INSERT INTO public.transactions (
            business_id, card_id, purchase_id, type, points_change, amount_change,
            points_balance_after, redeemable_amount_after, description, created_by_user_id
          ) VALUES (
            ${business.id}, ${card.id}, ${p1.id}, 'points_earned', 85, 0,
            ${c.pointsBalance}, ${c.redeemableAmount},
            ${`Points earned on purchase ₹680 (${p1.receipt_number})`},
            ${cashierUser.id}
          )
        `;

        if (c.pendingPoints > 0) {
          await sql`
            INSERT INTO public.purchases (
              business_id, location_id, customer_id, card_id, amount, currency, purchase_date,
              receipt_number, category, notes, points_awarded, source, status, claimed_by_customer_id
            ) VALUES (
              ${business.id}, ${mainLocationId}, ${cust.id}, ${card.id}, ${c.pendingPoints * 8}, 'INR', NOW() - INTERVAL '1 day',
              ${`POS-${c.cardNumber.slice(-4)}-99`}, 'Counter Order', 'Submitted from customer QR card page', ${c.pendingPoints}, 'customer_claim', 'pending', ${cust.id}
            )
          `;
        }

        if (c.publicId === "cd_araku_ananya_01") {
          await sql`
            INSERT INTO public.reward_redemptions (
              business_id, card_id, reward_id, redemption_type, points_used, monetary_value,
              status, requested_by_customer_id, requested_at, notes
            ) VALUES (
              ${business.id}, ${card.id}, ${freeCoffeeRewardId}, 'reward', 120, 180,
              'requested', ${cust.id}, NOW() - INTERVAL '2 hours', 'I am at Table 4, iced filter coffee please'
            )
          `;
        }
      }
    }

    console.log("Seed completed! Demo login: owner@arakucoffee.in / Loopa@2026");
    console.log("Demo public card: /card/cd_araku_ananya_01 (Phone last 4 digits: 8765)");
  } finally {
    await sql.end();
  }
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

