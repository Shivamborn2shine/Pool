import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkRateLimit, getClientContext } from "@/lib/auth";

const BONUS_TASKS: Record<
  string,
  {
    id: string;
    title: string;
    description: string;
    points: number;
    actionLabel: string;
    category: "social" | "review" | "referral";
  }
> = {
  instagram_follow: {
    id: "instagram_follow",
    title: "Follow on Instagram",
    description:
      "Follow our official Instagram page for exclusive discounts, sweet vibes, and menu updates.",
    points: 25,
    actionLabel: "Follow on Instagram",
    category: "social",
  },
  google_review: {
    id: "google_review",
    title: "5-Star Review on Google Maps",
    description:
      "Rate us 5 stars on Google Maps and share your honest experience with other foodies.",
    points: 30,
    actionLabel: "Write Google Review",
    category: "review",
  },
  instagram_story: {
    id: "instagram_story",
    title: "Tag Us in your Instagram Story",
    description:
      "Post a photo of your food, shake or coffee and tag our official Instagram handle.",
    points: 20,
    actionLabel: "Tag on Instagram",
    category: "social",
  },
  refer_friend: {
    id: "refer_friend",
    title: "Invite Friends & Family",
    description:
      "Share your loyalty card link or digital menu with friends so they can earn points too.",
    points: 50,
    actionLabel: "Share Loyalty Link",
    category: "referral",
  },
};

export async function POST(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { ipAddress } = getClientContext();
    const rl = await checkRateLimit(
      `bonus_claim:${params.publicId}:${ipAddress}`,
      20,
      60
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute and retry." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { taskId, phoneLast4 } = body;

    if (!taskId || !BONUS_TASKS[taskId]) {
      return NextResponse.json(
        { error: "Invalid or unrecognized bonus task." },
        { status: 400 }
      );
    }

    // 1. Resolve loyalty card and customer
    const rows = await sql`
      SELECT
        lc.id,
        lc.points_balance,
        lc.lifetime_points_earned,
        lc.redeemable_amount,
        c.phone AS customer_phone,
        b.id AS business_id,
        b.name AS business_name,
        b.currency AS business_currency
      FROM public.loyalty_cards lc
      JOIN public.customers c ON c.id = lc.customer_id
      JOIN public.businesses b ON b.id = lc.business_id
      WHERE lc.public_id = ${params.publicId} AND lc.status = 'active'
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Active loyalty card not found." },
        { status: 404 }
      );
    }

    const card = rows[0];

    // 2. Validate Security PIN (Last 4 digits of registered phone)
    const digitsOnly = (card.customer_phone || "").replace(/\D/g, "");
    const cleanLast4 = String(phoneLast4 || "").trim();
    if (!cleanLast4 || digitsOnly.slice(-4) !== cleanLast4) {
      return NextResponse.json(
        {
          error:
            "Incorrect Security PIN. Please enter the last 4 digits of your registered phone number.",
        },
        { status: 403 }
      );
    }

    // 3. Verify task has not already been claimed
    const existing = await sql`
      SELECT id FROM public.customer_bonus_claims
      WHERE card_id = ${card.id} AND task_id = ${taskId}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You have already claimed bonus points for this task." },
        { status: 400 }
      );
    }

    const task = BONUS_TASKS[taskId];
    const pointsToAdd = task.points;

    // 4. Atomic transaction: record claim, add points, record ledger transaction
    const result = await sql.begin(async (tx) => {
      // Record bonus claim
      await tx`
        INSERT INTO public.customer_bonus_claims (
          business_id, card_id, task_id, points_awarded
        ) VALUES (
          ${card.business_id}, ${card.id}, ${taskId}, ${pointsToAdd}
        )
      `;

      // Update loyalty card points balance
      const [updatedCard] = await tx`
        UPDATE public.loyalty_cards
        SET
          points_balance = points_balance + ${pointsToAdd},
          lifetime_points_earned = lifetime_points_earned + ${pointsToAdd},
          updated_at = NOW()
        WHERE id = ${card.id}
        RETURNING points_balance, redeemable_amount
      `;

      // Log to immutable ledger
      await tx`
        INSERT INTO public.transactions (
          business_id,
          card_id,
          type,
          points_change,
          amount_change,
          points_balance_after,
          redeemable_amount_after,
          description,
          metadata
        ) VALUES (
          ${card.business_id},
          ${card.id},
          'points_earned',
          ${pointsToAdd},
          0.00,
          ${updatedCard.points_balance},
          ${updatedCard.redeemable_amount},
          ${`Bonus Reward: ${task.title} (+${pointsToAdd} pts)`},
          ${JSON.stringify({
            taskId,
            taskTitle: task.title,
            source: "social_bonus_task",
          })}
        )
      `;

      return updatedCard;
    });

    return NextResponse.json({
      success: true,
      taskId,
      pointsAwarded: pointsToAdd,
      newPointsBalance: Number(result.points_balance),
      message: `Awesome! +${pointsToAdd} bonus points have been credited to your card for completing "${task.title}".`,
    });
  } catch (err) {
    console.error("POST /api/card/[publicId]/bonus-rewards error:", err);
    return NextResponse.json(
      { error: "Failed to claim bonus points. Please try again." },
      { status: 500 }
    );
  }
}
