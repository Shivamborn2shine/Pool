import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext, hasRolePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const bodyLines = rows.map((row) =>
    headers.map((h) => escapeCsvCell(row[h])).join(",")
  );
  return [headerLine, ...bodyLines].join("\r\n");
}

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Section 9: Only Owner and Manager can export data
  if (!hasRolePermission(ctx.role, ["owner", "manager"])) {
    return NextResponse.json(
      { error: "Only Owners and Managers have permission to export CSV data." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "customers").toLowerCase();

  let csvContent = "";
  let filename = `loopa-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  if (type === "purchases") {
    const rows = await sql`
      SELECT
        p.id,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        lc.card_number,
        p.amount,
        p.currency,
        p.points_awarded,
        p.receipt_number,
        p.category,
        p.source,
        p.status,
        p.purchase_date,
        p.created_at
      FROM public.purchases p
      JOIN public.customers c ON c.id = p.customer_id
      JOIN public.loyalty_cards lc ON lc.id = p.card_id
      WHERE p.business_id = ${ctx.business.id}
      ORDER BY p.purchase_date DESC
    `;
    csvContent = toCsv(
      [
        "id",
        "customer_name",
        "customer_phone",
        "card_number",
        "amount",
        "currency",
        "points_awarded",
        "receipt_number",
        "category",
        "source",
        "status",
        "purchase_date",
        "created_at",
      ],
      rows as unknown as Record<string, unknown>[]
    );
  } else if (type === "transactions") {
    const rows = await sql`
      SELECT
        t.id,
        lc.card_number,
        c.full_name AS customer_name,
        t.type,
        t.points_change,
        t.amount_change,
        t.points_balance_after,
        t.redeemable_amount_after,
        t.description,
        t.created_at
      FROM public.transactions t
      JOIN public.loyalty_cards lc ON lc.id = t.card_id
      JOIN public.customers c ON c.id = lc.customer_id
      WHERE t.business_id = ${ctx.business.id}
      ORDER BY t.created_at DESC
    `;
    csvContent = toCsv(
      [
        "id",
        "card_number",
        "customer_name",
        "type",
        "points_change",
        "amount_change",
        "points_balance_after",
        "redeemable_amount_after",
        "description",
        "created_at",
      ],
      rows as unknown as Record<string, unknown>[]
    );
  } else if (type === "claims") {
    const rows = await sql`
      SELECT
        p.id,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        lc.card_number,
        p.amount,
        p.points_awarded,
        p.receipt_number,
        p.status,
        p.review_note,
        p.purchase_date,
        p.reviewed_at
      FROM public.purchases p
      JOIN public.customers c ON c.id = p.customer_id
      JOIN public.loyalty_cards lc ON lc.id = p.card_id
      WHERE p.business_id = ${ctx.business.id}
        AND p.source = 'customer_claim'
      ORDER BY p.created_at DESC
    `;
    csvContent = toCsv(
      [
        "id",
        "customer_name",
        "customer_phone",
        "card_number",
        "amount",
        "points_awarded",
        "receipt_number",
        "status",
        "review_note",
        "purchase_date",
        "reviewed_at",
      ],
      rows as unknown as Record<string, unknown>[]
    );
  } else {
    filename = `loopa-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    const rows = await sql`
      SELECT
        c.id,
        c.full_name,
        c.phone,
        c.email,
        lc.card_number,
        lc.public_id,
        lc.status AS card_status,
        lc.points_balance,
        lc.redeemable_amount,
        lc.lifetime_points_earned,
        lc.lifetime_points_redeemed,
        lc.lifetime_purchase_amount,
        c.loyalty_consent,
        c.marketing_consent,
        c.created_at
      FROM public.customers c
      LEFT JOIN public.loyalty_cards lc ON lc.customer_id = c.id
      WHERE c.business_id = ${ctx.business.id}
      ORDER BY c.created_at DESC
    `;
    csvContent = toCsv(
      [
        "id",
        "full_name",
        "phone",
        "email",
        "card_number",
        "public_id",
        "card_status",
        "points_balance",
        "redeemable_amount",
        "lifetime_points_earned",
        "lifetime_points_redeemed",
        "lifetime_purchase_amount",
        "loyalty_consent",
        "marketing_consent",
        "created_at",
      ],
      rows as unknown as Record<string, unknown>[]
    );
  }

  await writeAuditLog({
    businessId: ctx.business.id,
    actorUserId: ctx.user.id,
    actorRole: ctx.role,
    action: `report.exported_${type}`,
    entityType: "report",
  });

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

