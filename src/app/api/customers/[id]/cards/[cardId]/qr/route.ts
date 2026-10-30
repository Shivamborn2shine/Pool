import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import {
  generateCardQrDataUrl,
  generateCardQrPngBuffer,
  generateCardQrSvg,
  getPublicCardUrl,
} from "@/lib/qr";

async function resolveCard(
  businessId: string,
  customerId: string,
  cardId: string
) {
  const rows = await sql`
    SELECT lc.*, b.primary_color
    FROM public.loyalty_cards lc
    JOIN public.businesses b ON b.id = lc.business_id
    WHERE lc.id = ${cardId}
      AND lc.customer_id = ${customerId}
      AND lc.business_id = ${businessId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; cardId: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await resolveCard(ctx.business.id, params.id, params.cardId);
  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "png").toLowerCase();

  if (format === "svg") {
    const svg = await generateCardQrSvg(card.public_id, card.primary_color);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${card.card_number}.svg"`,
      },
    });
  }

  const pngBuffer = await generateCardQrPngBuffer(
    card.public_id,
    card.primary_color
  );
  return new NextResponse(pngBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${card.card_number}.png"`,
    },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string; cardId: string } }
) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await resolveCard(ctx.business.id, params.id, params.cardId);
  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const svg = await generateCardQrSvg(card.public_id, card.primary_color);
  const dataUrl = await generateCardQrDataUrl(
    card.public_id,
    card.primary_color
  );

  return NextResponse.json({
    publicId: card.public_id,
    cardNumber: card.card_number,
    publicUrl: getPublicCardUrl(card.public_id),
    qrSvg: svg,
    qrDataUrl: dataUrl,
  });
}

