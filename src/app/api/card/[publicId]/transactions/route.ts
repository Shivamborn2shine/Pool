import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { publicId: string } }
) {
  const cards = await sql`
    SELECT id FROM public.loyalty_cards WHERE public_id = ${params.publicId} LIMIT 1
  `;
  if (cards.length === 0) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const transactions = await sql`
    SELECT
      id, type, points_change, amount_change, points_balance_after, redeemable_amount_after, description, expires_at, created_at
    FROM public.transactions
    WHERE card_id = ${cards[0].id}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ transactions });
}

