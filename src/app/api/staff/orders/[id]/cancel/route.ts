import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { executeStaffOrderTransition } from "@/lib/order-actions";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const order = await executeStaffOrderTransition(ctx, {
      orderId: params.id,
      action: body.refund ? "refund" : "cancel",
      reason: body.reason,
    });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cancel order." },
      { status: 400 }
    );
  }
}

