import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { claimRejectSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only Owners and Managers can reject purchase claims." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = claimRejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Rejection reason required." },
        { status: 400 }
      );
    }

    const result = await sql.begin(async (tx) => {
      const claims = await tx`
        SELECT * FROM public.purchases
        WHERE id = ${params.id}
          AND business_id = ${ctx.business.id}
          AND source = 'customer_claim'
        FOR UPDATE
      `;

      if (claims.length === 0) {
        throw new Error("CLAIM_NOT_FOUND");
      }

      const claim = claims[0];
      if (claim.status !== "pending") {
        throw new Error("CLAIM_ALREADY_PROCESSED");
      }

      const originalPendingPoints = Number(claim.points_awarded || 0);

      const [updatedClaim] = await tx`
        UPDATE public.purchases
        SET
          status = 'rejected',
          reviewed_by_user_id = ${ctx.user.id},
          reviewed_at = NOW(),
          review_note = ${parsed.data.reviewNote.trim()},
          updated_at = NOW()
        WHERE id = ${claim.id}
        RETURNING *
      `;

      await tx`
        UPDATE public.loyalty_cards
        SET
          pending_points = GREATEST(0, pending_points - ${originalPendingPoints}),
          updated_at = NOW()
        WHERE id = ${claim.card_id}
      `;

      return { claim, updatedClaim };
    });

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "claim.rejected",
      entityType: "purchase",
      entityId: params.id,
      beforeState: { status: result.claim.status },
      afterState: {
        status: "rejected",
        reviewNote: parsed.data.reviewNote.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      claim: result.updatedClaim,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "CLAIM_NOT_FOUND") {
      return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    }
    if (msg === "CLAIM_ALREADY_PROCESSED") {
      return NextResponse.json(
        { error: "This claim has already been reviewed." },
        { status: 409 }
      );
    }
    console.error("PATCH /api/claims/[id]/reject error:", err);
    return NextResponse.json(
      { error: "Failed to reject claim." },
      { status: 500 }
    );
  }
}

