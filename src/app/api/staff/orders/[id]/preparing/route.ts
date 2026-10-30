import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { executeStaffOrderTransition } from "@/lib/order-actions";

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const order = await executeStaffOrderTransition(ctx, {
      orderId: params.id,
      action: "preparing",
    });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mark preparing." },
      { status: 400 }
    );
  }
}

