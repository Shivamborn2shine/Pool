import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import {
  generateStoreQrDataUrl,
  generateStoreQrPngBuffer,
  generateStoreQrSvg,
  getStoreQrUrl,
} from "@/lib/qr";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  let qrRows = await sql`
    SELECT * FROM public.store_qr_codes
    WHERE business_id = ${ctx.business.id}
    ORDER BY created_at ASC
    LIMIT 1
  `;

  if (qrRows.length === 0) {
    qrRows = await sql`
      INSERT INTO public.store_qr_codes (
        business_id, type, slug, destination_url, status, label
      ) VALUES (
        ${ctx.business.id},
        'store',
        ${ctx.business.slug},
        ${`/s/${ctx.business.slug}`},
        'active',
        'Main Counter & Table Ordering QR'
      )
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
      RETURNING *
    `;
  }

  const qr = qrRows[0];
  const slug = qr.slug || ctx.business.slug;

  if (format === "svg") {
    const svg = await generateStoreQrSvg(slug, ctx.business.primary_color);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${slug}-store-qr.svg"`,
      },
    });
  }

  if (format === "png") {
    const buf = await generateStoreQrPngBuffer(
      slug,
      ctx.business.primary_color
    );
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${slug}-store-qr.png"`,
      },
    });
  }

  const qrDataUrl = await generateStoreQrDataUrl(
    slug,
    ctx.business.primary_color
  );

  const [freshBiz] = await sql`
    SELECT * FROM public.businesses WHERE id = ${ctx.business.id} LIMIT 1
  `;

  return NextResponse.json({
    qr: {
      ...qr,
      publicUrl: getStoreQrUrl(slug),
      qrDataUrl,
    },
    business: freshBiz
      ? {
          ...ctx.business,
          order_prefix: freshBiz.order_prefix || undefined,
          order_sequence:
            freshBiz.order_sequence !== null
              ? Number(freshBiz.order_sequence)
              : undefined,
          tax_percentage:
            freshBiz.tax_percentage !== null
              ? Number(freshBiz.tax_percentage)
              : 5,
          order_expiry_minutes:
            freshBiz.order_expiry_minutes !== null
              ? Number(freshBiz.order_expiry_minutes)
              : 20,
          require_table_number: Boolean(freshBiz.require_table_number ?? false),
        }
      : ctx.business,
  });
}

export async function PATCH(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only owners and managers can update store QR and order settings." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const label = body.label ? String(body.label).trim().slice(0, 100) : undefined;
    const orderPrefix = body.orderPrefix
      ? String(body.orderPrefix)
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 5)
      : undefined;
    const taxPercentage =
      body.taxPercentage !== undefined ? Number(body.taxPercentage) : undefined;
    const orderExpiryMinutes =
      body.orderExpiryMinutes !== undefined
        ? Number(body.orderExpiryMinutes)
        : undefined;
    const requireTableNumber =
      body.requireTableNumber !== undefined
        ? Boolean(body.requireTableNumber)
        : undefined;

    if (label) {
      await sql`
        UPDATE public.store_qr_codes
        SET label = ${label}, updated_at = NOW()
        WHERE business_id = ${ctx.business.id}
      `;
    }

    let updatedBusiness: Record<string, unknown> | null = null;
    if (
      orderPrefix ||
      taxPercentage !== undefined ||
      orderExpiryMinutes !== undefined ||
      requireTableNumber !== undefined
    ) {
      const [bRow] = await sql`
        SELECT order_prefix, tax_percentage, order_expiry_minutes, require_table_number
        FROM public.businesses
        WHERE id = ${ctx.business.id}
      `;
      const [updated] = await sql`
        UPDATE public.businesses
        SET
          order_prefix = ${orderPrefix || bRow.order_prefix || "SC"},
          tax_percentage = ${
            taxPercentage !== undefined && Number.isFinite(taxPercentage)
              ? Math.max(0, Math.min(50, taxPercentage))
              : Number(bRow.tax_percentage ?? 5)
          },
          order_expiry_minutes = ${
            orderExpiryMinutes !== undefined &&
            Number.isFinite(orderExpiryMinutes)
              ? Math.max(5, Math.min(180, Math.round(orderExpiryMinutes)))
              : Number(bRow.order_expiry_minutes ?? 20)
          },
          require_table_number = ${
            requireTableNumber !== undefined
              ? requireTableNumber
              : Boolean(bRow.require_table_number ?? false)
          },
          updated_at = NOW()
        WHERE id = ${ctx.business.id}
        RETURNING *
      `;
      updatedBusiness = updated;
    }

    await writeAuditLog({
      businessId: ctx.business.id,
      actorUserId: ctx.user.id,
      actorRole: ctx.role,
      action: "store_qr.settings_updated",
      entityType: "store_qr",
      entityId: ctx.business.id,
      afterState: { label, orderPrefix, taxPercentage, orderExpiryMinutes, requireTableNumber },
    });

    return NextResponse.json({
      success: true,
      business: updatedBusiness || ctx.business,
    });
  } catch (err) {
    console.error("PATCH /api/staff/qr error:", err);
    return NextResponse.json(
      { error: "Failed to update QR ordering settings." },
      { status: 500 }
    );
  }
}

