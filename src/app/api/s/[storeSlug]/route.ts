import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { storeSlug: string } }
) {
  try {
    // 1. Resolve store via store_qr_codes slug OR businesses slug
    const qrMatches = await sql`
      SELECT b.*
      FROM public.store_qr_codes q
      JOIN public.businesses b ON b.id = q.business_id
      WHERE q.slug = ${params.storeSlug} AND q.status = 'active'
      LIMIT 1
    `;

    const businesses =
      qrMatches.length > 0
        ? qrMatches
        : await sql`
            SELECT * FROM public.businesses
            WHERE slug = ${params.storeSlug}
            LIMIT 1
          `;

    if (businesses.length === 0) {
      return NextResponse.json(
        { error: "Store not found or QR code is inactive." },
        { status: 404 }
      );
    }

    const business = businesses[0];
    if (business.status !== "active") {
      return NextResponse.json(
        { error: "This store is currently not accepting QR orders." },
        { status: 403 }
      );
    }

    const [rules] = await sql`
      SELECT * FROM public.loyalty_rules
      WHERE business_id = ${business.id}
      LIMIT 1
    `;

    const categories = await sql`
      SELECT id, menu_id, name, description, sort_order
      FROM public.menu_categories
      WHERE business_id = ${business.id} AND status = 'active'
      ORDER BY sort_order ASC, created_at ASC
    `;

    const items = await sql`
      SELECT
        id,
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
      FROM public.menu_items
      WHERE business_id = ${business.id} AND is_visible = TRUE
      ORDER BY sort_order ASC, created_at ASC
    `;

    const itemIds = items.map((i) => i.id);
    const variants =
      itemIds.length > 0
        ? await sql`
            SELECT id, menu_item_id, name, price_delta, is_available, sort_order
            FROM public.menu_item_variants
            WHERE menu_item_id IN ${sql(itemIds)} AND is_available = TRUE
            ORDER BY sort_order ASC
          `
        : [];

    const addons =
      itemIds.length > 0
        ? await sql`
            SELECT id, menu_item_id, name, price, is_available, sort_order
            FROM public.menu_item_addons
            WHERE menu_item_id IN ${sql(itemIds)} AND is_available = TRUE
            ORDER BY sort_order ASC
          `
        : [];

    const enrichedItems = items.map((item) => ({
      ...item,
      price: Number(item.price),
      loyalty_multiplier: Number(item.loyalty_multiplier ?? 1),
      variants: variants
        .filter((v) => v.menu_item_id === item.id)
        .map((v) => ({ ...v, price_delta: Number(v.price_delta) })),
      addons: addons
        .filter((a) => a.menu_item_id === item.id)
        .map((a) => ({ ...a, price: Number(a.price) })),
    }));

    const rewards = await sql`
      SELECT id, name, description, points_required, monetary_value, stock_limit, redeemed_count
      FROM public.rewards
      WHERE business_id = ${business.id} AND status = 'active'
      ORDER BY points_required ASC
    `;

    return NextResponse.json({
      store: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logo_url: business.logo_url,
        primary_color: business.primary_color,
        currency: business.currency,
        address: business.address,
        phone: business.phone,
        tax_percentage: Number(business.tax_percentage ?? 5),
        order_prefix: business.order_prefix || "SC",
        order_expiry_minutes: Number(business.order_expiry_minutes ?? 20),
      },
      loyaltyOffer: rules
        ? {
            points_per_currency_unit: Number(rules.points_per_currency_unit),
            currency_unit: Number(rules.currency_unit),
            minimum_purchase_amount: Number(rules.minimum_purchase_amount),
            maximum_points_per_transaction: Number(
              rules.maximum_points_per_transaction
            ),
            points_value_per_100: Number(rules.points_value_per_100),
            minimum_redemption_points: Number(rules.minimum_redemption_points),
            signup_bonus_points: Number(rules.signup_bonus_points),
            campaign_name: rules.campaign_name,
            campaign_multiplier: Number(rules.campaign_multiplier ?? 1),
          }
        : null,
      categories,
      items: enrichedItems,
      rewards,
    });
  } catch (err) {
    console.error("GET /api/s/[storeSlug] error:", err);
    return NextResponse.json(
      { error: "Failed to load store menu." },
      { status: 500 }
    );
  }
}

