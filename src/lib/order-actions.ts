import { sql } from "@/lib/db";
import type { AuthenticatedContext } from "@/lib/auth";
import {
  calculateOrderPointsEarned,
  canTransitionOrderStatus,
  computeExpiryDate,
} from "@/lib/loyalty";
import { writeAuditLog } from "@/lib/audit";
import type { OrderStatus } from "@/types";

export interface StaffOrderTransitionInput {
  orderId: string;
  action:
    | "confirm"
    | "reject"
    | "mark_paid"
    | "preparing"
    | "ready"
    | "served"
    | "cancel"
    | "refund";
  paymentMethod?: "cash" | "online";
  paymentReference?: string | null;
  reason?: string | null;
}

export async function executeStaffOrderTransition(
  ctx: AuthenticatedContext,
  input: StaffOrderTransitionInput
) {
  const { orderId, action, paymentMethod, paymentReference, reason } = input;

  return sql.begin(async (tx) => {
    const orderRows = await tx`
      SELECT * FROM public.orders
      WHERE id = ${orderId} AND business_id = ${ctx.business.id}
      FOR UPDATE
    `;

    if (orderRows.length === 0) {
      throw new Error("Order not found for this business.");
    }

    const order = orderRows[0];
    const currentStatus = order.status as OrderStatus;

    // 1. CONFIRM ORDER
    if (action === "confirm") {
      if (
        !canTransitionOrderStatus(currentStatus, "confirmed") &&
        currentStatus !== "created"
      ) {
        throw new Error(
          `Cannot confirm order in '${currentStatus}' status.`
        );
      }

      const [updated] = await tx`
        UPDATE public.orders
        SET
          status = 'confirmed',
          confirmed_by_user_id = ${ctx.user.id},
          confirmed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${order.id}
        RETURNING *
      `;

      await tx`
        INSERT INTO public.order_events (
          order_id, event, actor_type, actor_id, note
        ) VALUES (
          ${order.id},
          'confirmed',
          'staff',
          ${ctx.user.id},
          ${`Confirmed at counter by ${ctx.user.full_name}`}
        )
      `;

      await writeAuditLog({
        businessId: ctx.business.id,
        actorUserId: ctx.user.id,
        actorRole: ctx.role,
        action: "order.confirmed",
        entityType: "order",
        entityId: order.id,
        beforeState: { status: currentStatus },
        afterState: { status: "confirmed", order_number: order.order_number },
      });

      return updated;
    }

    // 2. REJECT ORDER (Requires reason)
    if (action === "reject") {
      const cleanReason = (reason || "").trim();
      if (cleanReason.length < 3) {
        throw new Error("A rejection reason is required.");
      }
      if (!canTransitionOrderStatus(currentStatus, "rejected")) {
        throw new Error(
          `Order in '${currentStatus}' status cannot be rejected.`
        );
      }

      const [updated] = await tx`
        UPDATE public.orders
        SET
          status = 'rejected',
          cancelled_at = NOW(),
          cancelled_by_user_id = ${ctx.user.id},
          cancellation_reason = ${cleanReason},
          updated_at = NOW()
        WHERE id = ${order.id}
        RETURNING *
      `;

      // Restore any checkout points used
      const redeemedPts = Number(order.reward_points_used ?? 0);
      if (redeemedPts > 0) {
        const [card] = await tx`
          SELECT * FROM public.loyalty_cards WHERE id = ${order.card_id} FOR UPDATE
        `;
        if (card) {
          const nextPts = Number(card.points_balance) + redeemedPts;
          await tx`
            UPDATE public.loyalty_cards
            SET
              points_balance = ${nextPts},
              lifetime_points_redeemed = GREATEST(0, lifetime_points_redeemed - ${redeemedPts}),
              updated_at = NOW()
            WHERE id = ${card.id}
          `;
          await tx`
            INSERT INTO public.transactions (
              business_id, card_id, order_id, type, points_change, amount_change,
              points_balance_after, redeemable_amount_after, description, created_by_user_id
            ) VALUES (
              ${ctx.business.id}, ${card.id}, ${order.id}, 'reward_points_restored',
              ${redeemedPts}, 0, ${nextPts}, ${Number(card.redeemable_amount)},
              ${`Restored ${redeemedPts} points from rejected Order ${order.order_number}`},
              ${ctx.user.id}
            )
          `;
        }
      }

      await tx`
        INSERT INTO public.order_events (
          order_id, event, actor_type, actor_id, note
        ) VALUES (
          ${order.id}, 'rejected', 'staff', ${ctx.user.id}, ${cleanReason}
        )
      `;

      await writeAuditLog({
        businessId: ctx.business.id,
        actorUserId: ctx.user.id,
        actorRole: ctx.role,
        action: "order.rejected",
        entityType: "order",
        entityId: order.id,
        beforeState: { status: currentStatus },
        afterState: { status: "rejected", reason: cleanReason },
      });

      return updated;
    }

    // 3. MARK PAID + AUTOMATICALLY CREDIT LOYALTY POINTS
    if (action === "mark_paid") {
      if (order.payment_status === "paid" || order.points_credited_at) {
        throw new Error("Order is already marked as paid and points credited.");
      }

      if (
        currentStatus !== "confirmed" &&
        currentStatus !== "awaiting_payment"
      ) {
        throw new Error(
          "Staff must confirm the customer order before marking payment received."
        );
      }

      const method = paymentMethod || "cash";
      const ref = (paymentReference || "").trim() || null;
      if (method === "online" && !ref) {
        throw new Error(
          "Please enter a UPI / online transaction reference to confirm online payment."
        );
      }

      const [card] = await tx`
        SELECT * FROM public.loyalty_cards
        WHERE id = ${order.card_id} AND business_id = ${ctx.business.id}
        FOR UPDATE
      `;
      if (!card) {
        throw new Error("Customer loyalty card not found.");
      }

      const orderItems = await tx`
        SELECT total_price, loyalty_multiplier
        FROM public.order_items
        WHERE order_id = ${order.id}
      `;

      const pointsCalc =
        ctx.rules.status === "active" && card.status === "active"
          ? calculateOrderPointsEarned({
              purchaseAmount: Number(order.total),
              pointsPerCurrencyUnit: ctx.rules.points_per_currency_unit,
              currencyUnit: ctx.rules.currency_unit,
              minimumPurchaseAmount: ctx.rules.minimum_purchase_amount,
              maximumPointsPerTransaction:
                ctx.rules.maximum_points_per_transaction,
              campaignMultiplier: ctx.rules.campaign_multiplier,
              campaignEndsAt: ctx.rules.campaign_ends_at,
              items: orderItems.map((i) => ({
                totalPrice: Number(i.total_price),
                loyaltyMultiplier: Number(i.loyalty_multiplier ?? 1),
              })),
            })
          : { totalPoints: 0, basePoints: 0, itemBonusPoints: 0, campaignBonusPoints: 0 };

      const pointsEarned = pointsCalc.totalPoints;
      const newPointsBalance = Number(card.points_balance) + pointsEarned;

      await tx`
        UPDATE public.loyalty_cards
        SET
          points_balance = ${newPointsBalance},
          lifetime_points_earned = lifetime_points_earned + ${pointsEarned},
          lifetime_purchase_amount = lifetime_purchase_amount + ${Number(order.total)},
          updated_at = NOW()
        WHERE id = ${card.id}
      `;

      if (pointsEarned > 0) {
        const expiresAt = computeExpiryDate(ctx.rules);
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
            metadata,
            expires_at,
            created_by_user_id
          ) VALUES (
            ${ctx.business.id},
            ${card.id},
            ${order.id},
            'order_points_earned',
            ${pointsEarned},
            0,
            ${newPointsBalance},
            ${Number(card.redeemable_amount)},
            ${`Points earned on Order ${order.order_number} (₹${Number(order.total).toFixed(0)} via ${method.toUpperCase()})`},
            ${tx.json({
              order_number: order.order_number,
              payment_method: method,
              payment_reference: ref,
              base_points: pointsCalc.basePoints,
              item_bonus_points: pointsCalc.itemBonusPoints,
            })},
            ${expiresAt},
            ${ctx.user.id}
          )
        `;
      }

      const [updated] = await tx`
        UPDATE public.orders
        SET
          status = 'points_credited',
          payment_method = ${method},
          payment_status = 'paid',
          payment_reference = ${ref},
          points_earned = ${pointsEarned},
          paid_at = NOW(),
          points_credited_at = NOW(),
          updated_at = NOW()
        WHERE id = ${order.id}
        RETURNING *
      `;

      // Update customer last_visited_at
      await tx`
        UPDATE public.customers
        SET last_visited_at = NOW(), updated_at = NOW()
        WHERE id = ${order.customer_id}
      `;

      // Two-sided viral referral bonus: +50 pts to friend and +50 pts to referrer
      if (
        order.referred_by_card_id &&
        !order.referral_reward_credited &&
        Number(order.total) >= 50
      ) {
        const [refCard] = await tx`
          SELECT * FROM public.loyalty_cards
          WHERE id = ${order.referred_by_card_id} AND business_id = ${ctx.business.id}
          FOR UPDATE
        `;

        if (refCard) {
          const REFERRAL_BONUS_PTS = 50;

          // 1. Credit +50 pts to referring card
          const refNewBal = Number(refCard.points_balance) + REFERRAL_BONUS_PTS;
          await tx`
            UPDATE public.loyalty_cards
            SET
              points_balance = ${refNewBal},
              lifetime_points_earned = lifetime_points_earned + ${REFERRAL_BONUS_PTS},
              updated_at = NOW()
            WHERE id = ${refCard.id}
          `;

          await tx`
            INSERT INTO public.transactions (
              business_id, card_id, type, points_change, amount_change,
              points_balance_after, redeemable_amount_after, description, metadata
            ) VALUES (
              ${ctx.business.id}, ${refCard.id}, 'points_earned',
              ${REFERRAL_BONUS_PTS}, 0, ${refNewBal}, ${Number(refCard.redeemable_amount)},
              ${`Referral Reward: Friend ordered (${order.order_number}) (+${REFERRAL_BONUS_PTS} pts)`},
              ${JSON.stringify({ order_id: order.id, order_number: order.order_number, type: "referral_bonus" })}
            )
          `;

          // 2. Credit +50 pts to current card as welcome referral bonus
          const customerBonusBal = newPointsBalance + REFERRAL_BONUS_PTS;
          await tx`
            UPDATE public.loyalty_cards
            SET
              points_balance = ${customerBonusBal},
              lifetime_points_earned = lifetime_points_earned + ${REFERRAL_BONUS_PTS},
              updated_at = NOW()
            WHERE id = ${card.id}
          `;

          await tx`
            INSERT INTO public.transactions (
              business_id, card_id, type, points_change, amount_change,
              points_balance_after, redeemable_amount_after, description, metadata
            ) VALUES (
              ${ctx.business.id}, ${card.id}, 'points_earned',
              ${REFERRAL_BONUS_PTS}, 0, ${customerBonusBal}, ${Number(card.redeemable_amount)},
              ${`Welcome Referral Bonus: Used friend's referral link (+${REFERRAL_BONUS_PTS} pts)`},
              ${JSON.stringify({ referrer_card_id: refCard.id, type: "referral_welcome" })}
            )
          `;

          await tx`
            UPDATE public.orders
            SET referral_reward_credited = TRUE
            WHERE id = ${order.id}
          `;
        }
      }

      await tx`
        INSERT INTO public.order_events (
          order_id, event, actor_type, actor_id, note, metadata
        ) VALUES
          (
            ${order.id},
            'paid',
            'staff',
            ${ctx.user.id},
            ${`Payment received (${method.toUpperCase()}${ref ? ` • Ref: ${ref}` : ""})`},
            ${tx.json({ payment_method: method, payment_reference: ref })}
          ),
          (
            ${order.id},
            'points_credited',
            'system',
            ${ctx.user.id},
            ${`${pointsEarned} loyalty points credited to customer card`},
            ${tx.json({ points_earned: pointsEarned, balance_after: newPointsBalance })}
          )
      `;

      await writeAuditLog({
        businessId: ctx.business.id,
        actorUserId: ctx.user.id,
        actorRole: ctx.role,
        action: "order.paid_and_points_credited",
        entityType: "order",
        entityId: order.id,
        beforeState: { status: currentStatus, payment_status: order.payment_status },
        afterState: {
          status: "points_credited",
          payment_method: method,
          payment_reference: ref,
          points_earned: pointsEarned,
        },
      });

      return updated;
    }

    // 4. PREPARING
    if (action === "preparing") {
      if (!canTransitionOrderStatus(currentStatus, "preparing")) {
        throw new Error(
          `Order must be paid before moving to preparing (current: ${currentStatus}).`
        );
      }

      const [updated] = await tx`
        UPDATE public.orders
        SET status = 'preparing', prepared_at = NOW(), updated_at = NOW()
        WHERE id = ${order.id}
        RETURNING *
      `;

      await tx`
        INSERT INTO public.order_events (order_id, event, actor_type, actor_id, note)
        VALUES (${order.id}, 'preparing', 'staff', ${ctx.user.id}, 'Kitchen / counter started preparing order')
      `;

      await writeAuditLog({
        businessId: ctx.business.id,
        actorUserId: ctx.user.id,
        actorRole: ctx.role,
        action: "order.preparing",
        entityType: "order",
        entityId: order.id,
        beforeState: { status: currentStatus },
        afterState: { status: "preparing" },
      });

      return updated;
    }

    // 5. READY
    if (action === "ready") {
      if (!canTransitionOrderStatus(currentStatus, "ready")) {
        throw new Error(
          `Cannot mark order ready from '${currentStatus}' status.`
        );
      }

      const [updated] = await tx`
        UPDATE public.orders
        SET status = 'ready', ready_at = NOW(), updated_at = NOW()
        WHERE id = ${order.id}
        RETURNING *
      `;

      await tx`
        INSERT INTO public.order_events (order_id, event, actor_type, actor_id, note)
        VALUES (${order.id}, 'ready', 'staff', ${ctx.user.id}, 'Order is ready for pickup / serving')
      `;

      await writeAuditLog({
        businessId: ctx.business.id,
        actorUserId: ctx.user.id,
        actorRole: ctx.role,
        action: "order.ready",
        entityType: "order",
        entityId: order.id,
        beforeState: { status: currentStatus },
        afterState: { status: "ready" },
      });

      return updated;
    }

    // 6. SERVED
    if (action === "served") {
      if (!canTransitionOrderStatus(currentStatus, "served")) {
        throw new Error(
          `Order must be in 'ready' status before marking served (current: ${currentStatus}).`
        );
      }

      const [updated] = await tx`
        UPDATE public.orders
        SET status = 'served', served_at = NOW(), updated_at = NOW()
        WHERE id = ${order.id}
        RETURNING *
      `;

      await tx`
        INSERT INTO public.order_events (order_id, event, actor_type, actor_id, note)
        VALUES (${order.id}, 'served', 'staff', ${ctx.user.id}, 'Order handed to customer')
      `;

      await writeAuditLog({
        businessId: ctx.business.id,
        actorUserId: ctx.user.id,
        actorRole: ctx.role,
        action: "order.served",
        entityType: "order",
        entityId: order.id,
        beforeState: { status: currentStatus },
        afterState: { status: "served" },
      });

      return updated;
    }

    // 7. CANCEL OR REFUND (with automatic points reversal PAY-08 / LOY-10)
    if (action === "cancel" || action === "refund") {
      const cleanReason = (reason || "").trim();
      if (cleanReason.length < 3) {
        throw new Error("A reason is required to cancel or refund an order.");
      }

      const wasPaid =
        order.payment_status === "paid" || Number(order.points_earned) > 0;
      const targetStatus: OrderStatus = wasPaid ? "refunded" : "cancelled";

      if (
        currentStatus === "cancelled" ||
        currentStatus === "rejected" ||
        currentStatus === "refunded" ||
        currentStatus === "expired"
      ) {
        throw new Error(`Order is already in terminal state (${currentStatus}).`);
      }

      const [card] = await tx`
        SELECT * FROM public.loyalty_cards
        WHERE id = ${order.card_id}
        FOR UPDATE
      `;

      let currentCardPoints = card ? Number(card.points_balance) : 0;

      // Reverse earned points if points were credited
      const earnedPts = Number(order.points_earned ?? 0);
      if (card && earnedPts > 0) {
        currentCardPoints = ctx.rules.allow_negative_balance
          ? currentCardPoints - earnedPts
          : Math.max(0, currentCardPoints - earnedPts);

        await tx`
          UPDATE public.loyalty_cards
          SET
            points_balance = ${currentCardPoints},
            lifetime_points_earned = GREATEST(0, lifetime_points_earned - ${earnedPts}),
            lifetime_purchase_amount = GREATEST(0, lifetime_purchase_amount - ${Number(order.total)}),
            updated_at = NOW()
          WHERE id = ${card.id}
        `;

        await tx`
          INSERT INTO public.transactions (
            business_id, card_id, order_id, type, points_change, amount_change,
            points_balance_after, redeemable_amount_after, description, created_by_user_id
          ) VALUES (
            ${ctx.business.id}, ${card.id}, ${order.id}, 'order_points_reversed',
            ${-earnedPts}, 0, ${currentCardPoints}, ${Number(card.redeemable_amount)},
            ${`Reversed ${earnedPts} points from refunded Order ${order.order_number} (${cleanReason})`},
            ${ctx.user.id}
          )
        `;
      }

      // Restore any checkout redeemed points
      const redeemedPts = Number(order.reward_points_used ?? 0);
      if (card && redeemedPts > 0) {
        currentCardPoints += redeemedPts;
        await tx`
          UPDATE public.loyalty_cards
          SET
            points_balance = ${currentCardPoints},
            lifetime_points_redeemed = GREATEST(0, lifetime_points_redeemed - ${redeemedPts}),
            updated_at = NOW()
          WHERE id = ${card.id}
        `;

        await tx`
          INSERT INTO public.transactions (
            business_id, card_id, order_id, type, points_change, amount_change,
            points_balance_after, redeemable_amount_after, description, created_by_user_id
          ) VALUES (
            ${ctx.business.id}, ${card.id}, ${order.id}, 'reward_points_restored',
            ${redeemedPts}, 0, ${currentCardPoints}, ${Number(card.redeemable_amount)},
            ${`Restored ${redeemedPts} checkout points from ${targetStatus} Order ${order.order_number}`},
            ${ctx.user.id}
          )
        `;
      }

      const [updated] = await tx`
        UPDATE public.orders
        SET
          status = ${targetStatus},
          payment_status = ${wasPaid ? "refunded" : order.payment_status},
          cancelled_at = NOW(),
          cancelled_by_user_id = ${ctx.user.id},
          cancellation_reason = ${cleanReason},
          updated_at = NOW()
        WHERE id = ${order.id}
        RETURNING *
      `;

      await tx`
        INSERT INTO public.order_events (
          order_id, event, actor_type, actor_id, note
        ) VALUES (
          ${order.id}, ${targetStatus}, 'staff', ${ctx.user.id}, ${cleanReason}
        )
      `;

      await writeAuditLog({
        businessId: ctx.business.id,
        actorUserId: ctx.user.id,
        actorRole: ctx.role,
        action: `order.${targetStatus}`,
        entityType: "order",
        entityId: order.id,
        beforeState: { status: currentStatus, points_earned: earnedPts },
        afterState: { status: targetStatus, reason: cleanReason },
      });

      return updated;
    }

    throw new Error(`Unsupported order action: ${action}`);
  });
}

