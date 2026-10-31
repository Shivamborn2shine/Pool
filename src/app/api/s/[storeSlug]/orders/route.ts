import crypto from "crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkRateLimit, getClientContext } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validation";
import { resolveCustomerDisplayName } from "@/lib/loyalty";

export async function GET(
  request: Request,
  { params }: { params: { storeSlug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const cardPublicId = searchParams.get("cardPublicId");
    const orderIdsParam = searchParams.get("orderIds");

    if (!cardPublicId && !orderIdsParam) {
      return NextResponse.json({ orders: [] });
    }

    const qrMatches = await sql`
      SELECT b.id FROM public.store_qr_codes q
      JOIN public.businesses b ON b.id = q.business_id
      WHERE q.slug = ${params.storeSlug} AND q.status = 'active'
      LIMIT 1
    `;
    const biz =
      qrMatches.length > 0
        ? qrMatches[0]
        : (
            await sql`
              SELECT id FROM public.businesses
              WHERE slug = ${params.storeSlug}
              LIMIT 1
            `
          )[0];

    if (!biz) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    let orders: Record<string, unknown>[] = [];
    let cardInfo: {
      points_balance: number;
      redeemable_amount: number;
      card_number: string;
      status: string;
    } | null = null;

    if (cardPublicId) {
      const cardRows = await sql`
        SELECT points_balance, redeemable_amount, card_number, status
        FROM public.loyalty_cards
        WHERE public_id = ${cardPublicId}
        LIMIT 1
      `;
      if (cardRows.length > 0) {
        cardInfo = {
          points_balance: Number(cardRows[0].points_balance || 0),
          redeemable_amount: Number(cardRows[0].redeemable_amount || 0),
          card_number: cardRows[0].card_number as string,
          status: cardRows[0].status as string,
        };
      }

      orders = await sql`
        SELECT o.*
        FROM public.orders o
        JOIN public.loyalty_cards lc ON lc.id = o.card_id
        WHERE o.business_id = ${biz.id}
          AND lc.public_id = ${cardPublicId}
        ORDER BY o.created_at DESC
        LIMIT 25
      `;
    } else if (orderIdsParam) {
      const ids = orderIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        orders = await sql`
          SELECT * FROM public.orders
          WHERE business_id = ${biz.id} AND id IN ${sql(ids)}
          ORDER BY created_at DESC
          LIMIT 25
        `;
      }
    }

    if (orders.length === 0) {
      return NextResponse.json({ orders: [], card: cardInfo });
    }

    const orderIds = orders.map((o) => o.id as string);
    const items = await sql`
      SELECT * FROM public.order_items
      WHERE order_id IN ${sql(orderIds)}
      ORDER BY created_at ASC
    `;

    const enriched = orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      tax_total: Number(o.tax_total),
      discount_total: Number(o.discount_total),
      total: Number(o.total),
      points_earned: Number(o.points_earned || 0),
      reward_points_used: Number(o.reward_points_used || 0),
      reward_value_used: Number(o.reward_value_used || 0),
      items: items
        .filter((it) => it.order_id === o.id)
        .map((it) => ({
          ...it,
          unit_price: Number(it.unit_price),
          total_price: Number(it.total_price),
        })),
    }));

    return NextResponse.json({ orders: enriched, card: cardInfo });
  } catch (err) {
    console.error("GET /api/s/[storeSlug]/orders error:", err);
    return NextResponse.json(
      { error: "Failed to load customer orders." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { storeSlug: string } }
) {
  try {
    const { ipAddress } = getClientContext();
    const rl = await checkRateLimit(
      `store_order:${params.storeSlug}:${ipAddress}`,
      12,
      60
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many orders placed from this device. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid order details." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Resolve business
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
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }
    const business = businesses[0];
    if (business.status !== "active") {
      return NextResponse.json(
        { error: "This store is currently not accepting orders." },
        { status: 403 }
      );
    }

    // CART-09: Check idempotency key to prevent duplicate order submission
    if (data.idempotencyKey) {
      const existingOrder = await sql`
        SELECT * FROM public.orders
        WHERE idempotency_key = ${data.idempotencyKey}
          AND business_id = ${business.id}
        LIMIT 1
      `;
      if (existingOrder.length > 0) {
        const ord = existingOrder[0];
        const ordItems = await sql`
          SELECT * FROM public.order_items WHERE order_id = ${ord.id}
        `;
        return NextResponse.json({
          order: { ...ord, items: ordItems },
          duplicatePrevented: true,
        });
      }
    }

    const [rules] = await sql`
      SELECT * FROM public.loyalty_rules
      WHERE business_id = ${business.id}
      LIMIT 1
    `;

    if (
      Boolean(business.require_table_number) &&
      data.orderType === "dine_in" &&
      !data.tableNumber?.trim()
    ) {
      return NextResponse.json(
        { error: "Table number is required for Dine-In orders at this store." },
        { status: 400 }
      );
    }

    // Atomic order creation, server-side price calculation, and optional points redemption
    const createdOrder = await sql.begin(async (tx) => {
      const cardRows = await tx`
        SELECT
          lc.*,
          c.full_name AS customer_full_name,
          c.phone AS customer_phone,
          c.status AS customer_status
        FROM public.loyalty_cards lc
        JOIN public.customers c ON c.id = lc.customer_id
        WHERE lc.public_id = ${data.cardPublicId}
          AND lc.business_id = ${business.id}
        FOR UPDATE
      `;

      if (cardRows.length === 0) {
        throw new Error("Customer loyalty account not found. Please register with your phone number first.");
      }

      const card = cardRows[0];
      if (card.status !== "active") {
        throw new Error(`Your loyalty card is currently ${card.status}.`);
      }

      const requestedItemIds = Array.from(
        new Set(data.items.map((i) => i.menuItemId))
      );
      const dbMenuItems = await tx`
        SELECT * FROM public.menu_items
        WHERE business_id = ${business.id}
          AND id IN ${tx(requestedItemIds)}
      `;

      if (dbMenuItems.length !== requestedItemIds.length) {
        throw new Error("One or more selected menu items do not belong to this store.");
      }

      const dbVariants = await tx`
        SELECT * FROM public.menu_item_variants
        WHERE menu_item_id IN ${tx(requestedItemIds)} AND is_available = TRUE
      `;
      const dbAddons = await tx`
        SELECT * FROM public.menu_item_addons
        WHERE menu_item_id IN ${tx(requestedItemIds)} AND is_available = TRUE
      `;

      let subtotal = 0;
      const computedLineItems: {
        menuItemId: string;
        itemName: string;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
        loyaltyMultiplier: number;
        variantDetails: { name: string; price_delta: number }[];
        addonDetails: { name: string; price: number }[];
        notes: string | null;
      }[] = [];

      for (const reqItem of data.items) {
        const menuItem = dbMenuItems.find((m) => m.id === reqItem.menuItemId);
        if (!menuItem || !menuItem.is_visible || !menuItem.is_available) {
          throw new Error(
            `${menuItem?.name || "Selected item"} is currently sold out or unavailable.`
          );
        }

        let unitPrice = Number(menuItem.price);
        const variantDetails: { name: string; price_delta: number }[] = [];
        const addonDetails: { name: string; price: number }[] = [];

        if (reqItem.variantId) {
          const v = dbVariants.find(
            (row) =>
              row.id === reqItem.variantId &&
              row.menu_item_id === menuItem.id
          );
          if (!v) {
            throw new Error(`Selected variant for ${menuItem.name} is unavailable.`);
          }
          const delta = Number(v.price_delta);
          unitPrice += delta;
          variantDetails.push({ name: v.name, price_delta: delta });
        }

        for (const addonId of reqItem.addonIds || []) {
          const a = dbAddons.find(
            (row) => row.id === addonId && row.menu_item_id === menuItem.id
          );
          if (!a) {
            throw new Error(`Selected add-on for ${menuItem.name} is unavailable.`);
          }
          const addonPrice = Number(a.price);
          unitPrice += addonPrice;
          addonDetails.push({ name: a.name, price: addonPrice });
        }

        const lineTotal = Math.round(unitPrice * reqItem.quantity * 100) / 100;
        subtotal += lineTotal;

        computedLineItems.push({
          menuItemId: menuItem.id,
          itemName: menuItem.name,
          unitPrice: Math.round(unitPrice * 100) / 100,
          quantity: reqItem.quantity,
          totalPrice: lineTotal,
          loyaltyMultiplier: Number(menuItem.loyalty_multiplier ?? 1),
          variantDetails,
          addonDetails,
          notes: reqItem.notes?.trim() || null,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const taxRate = Number(business.tax_percentage ?? 5);
      const taxTotal = Math.round(((subtotal * taxRate) / 100) * 100) / 100;

      // Optional CART-10 / LOY-09: Apply reward points as checkout discount
      let rewardPointsUsed = 0;
      let rewardValueUsed = 0;
      if (data.rewardPointsToRedeem && data.rewardPointsToRedeem > 0 && rules) {
        const minRedeem = Number(rules.minimum_redemption_points ?? 100);
        const valPer100 = Number(rules.points_value_per_100 ?? 100);
        if (data.rewardPointsToRedeem < minRedeem) {
          throw new Error(
            `Minimum ${minRedeem} points required to redeem at checkout.`
          );
        }
        if (Number(card.points_balance) < data.rewardPointsToRedeem) {
          throw new Error("Insufficient points balance for discount.");
        }
        rewardPointsUsed = data.rewardPointsToRedeem;
        const maxDiscount = subtotal + taxTotal;
        rewardValueUsed = Math.min(
          maxDiscount,
          Math.round(((rewardPointsUsed / 100) * valPer100) * 100) / 100
        );
      }

      const discountTotal = rewardValueUsed;
      const finalTotal = Math.max(
        0,
        Math.round((subtotal + taxTotal - discountTotal) * 100) / 100
      );

      // Atomically increment per-business order sequence (ORD-01, ORD-02)
      const [seqRow] = await tx`
        UPDATE public.businesses
        SET order_sequence = COALESCE(order_sequence, 1000) + 1
        WHERE id = ${business.id}
        RETURNING order_prefix, order_sequence, order_expiry_minutes
      `;

      const prefix = (seqRow.order_prefix || "SC").toUpperCase();
      const orderNumber = `${prefix}-${seqRow.order_sequence}`;
      const expiryMinutes = Number(seqRow.order_expiry_minutes ?? 20);
      const expiresAt = new Date(
        Date.now() + expiryMinutes * 60 * 1000
      ).toISOString();

      const phoneDigits = String(card.customer_phone || "").replace(/\D/g, "");
      const displayName = resolveCustomerDisplayName(
        data.customerDisplayName,
        card.customer_full_name,
        phoneDigits.slice(-3)
      );

      const publicToken = `ord_${crypto.randomBytes(16).toString("base64url")}`;

      let referredByCardId: string | null = null;
      if (
        data.referredByCardPublicId &&
        data.referredByCardPublicId !== data.cardPublicId
      ) {
        const refRows = await tx`
          SELECT id FROM public.loyalty_cards
          WHERE public_id = ${data.referredByCardPublicId} AND business_id = ${business.id}
          LIMIT 1
        `;
        if (refRows.length > 0) {
          referredByCardId = refRows[0].id;
        }
      }

      const [orderRow] = await tx`
        INSERT INTO public.orders (
          public_token,
          idempotency_key,
          business_id,
          customer_id,
          card_id,
          referred_by_card_id,
          order_number,
          customer_display_name,
          order_type,
          table_number,
          status,
          subtotal,
          tax_total,
          discount_total,
          reward_points_used,
          reward_value_used,
          points_earned,
          total,
          currency,
          payment_method,
          payment_status,
          notes,
          expires_at
        ) VALUES (
          ${publicToken},
          ${data.idempotencyKey || null},
          ${business.id},
          ${card.customer_id},
          ${card.id},
          ${referredByCardId},
          ${orderNumber},
          ${displayName},
          ${data.orderType},
          ${data.orderType === "dine_in" ? data.tableNumber?.trim() || null : null},
          'awaiting_confirmation',
          ${subtotal},
          ${taxTotal},
          ${discountTotal},
          ${rewardPointsUsed},
          ${rewardValueUsed},
          0,
          ${finalTotal},
          ${business.currency || "INR"},
          'pending',
          'pending',
          ${data.notes?.trim() || null},
          ${expiresAt}
        )
        RETURNING *
      `;

      // If points were redeemed at checkout, deduct atomically and create immutable transaction
      if (rewardPointsUsed > 0) {
        const nextPoints = Number(card.points_balance) - rewardPointsUsed;
        await tx`
          UPDATE public.loyalty_cards
          SET
            points_balance = ${nextPoints},
            lifetime_points_redeemed = lifetime_points_redeemed + ${rewardPointsUsed},
            updated_at = NOW()
          WHERE id = ${card.id}
        `;

        await tx`
          INSERT INTO public.transactions (
            business_id,
            card_id,
            order_id,
            type,
            points_change,
            amount_change,
            points_balance_after,
            redeemable_amount_after,
            description,
            metadata
          ) VALUES (
            ${business.id},
            ${card.id},
            ${orderRow.id},
            'reward_points_used',
            ${-rewardPointsUsed},
            0,
            ${nextPoints},
            ${Number(card.redeemable_amount)},
            ${`Redeemed ${rewardPointsUsed} points (₹${rewardValueUsed}) on Order ${orderNumber}`},
            ${tx.json({ order_number: orderNumber, discount_value: rewardValueUsed })}
          )
        `;
      }

      const insertedItems = [];
      for (const item of computedLineItems) {
        const [insItem] = await tx`
          INSERT INTO public.order_items (
            order_id,
            menu_item_id,
            item_name,
            unit_price,
            quantity,
            total_price,
            loyalty_multiplier,
            variant_details,
            addon_details,
            notes
          ) VALUES (
            ${orderRow.id},
            ${item.menuItemId},
            ${item.itemName},
            ${item.unitPrice},
            ${item.quantity},
            ${item.totalPrice},
            ${item.loyaltyMultiplier},
            ${tx.json(item.variantDetails as never)},
            ${tx.json(item.addonDetails as never)},
            ${item.notes}
          )
          RETURNING *
        `;
        insertedItems.push(insItem);
      }

      await tx`
        INSERT INTO public.order_events (
          order_id,
          event,
          actor_type,
          actor_id,
          note,
          metadata
        ) VALUES (
          ${orderRow.id},
          'created',
          'customer',
          ${card.customer_id},
          'Order placed via Store QR — awaiting counter confirmation',
          ${tx.json({ order_number: orderNumber, total: finalTotal })}
        )
      `;

      return {
        ...orderRow,
        items: insertedItems,
      };
    });

    return NextResponse.json({ order: createdOrder }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to place order.";
    console.error("POST /api/s/[storeSlug]/orders error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

