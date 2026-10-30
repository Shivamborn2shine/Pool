import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { publicId: string } }
) {
  const cards = await sql`
    SELECT business_id FROM public.loyalty_cards WHERE public_id = ${params.publicId} LIMIT 1
  `;
  if (cards.length === 0) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const rewards = await sql`
    SELECT
      id, name, description, image_url, points_required, monetary_value, stock_limit, redeemed_count, status
    FROM public.rewards
    WHERE business_id = ${cards[0].business_id} AND status = 'active'
    ORDER BY points_required ASC
  `;

  return NextResponse.json({ rewards });
}

