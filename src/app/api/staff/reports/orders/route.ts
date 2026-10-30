import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const exportFormat = searchParams.get("export");

  if (exportFormat === "csv") {
    const orders = await sql`
      SELECT
        o.order_number,
        o.customer_display_name,
        c.phone AS customer_phone,
        o.order_type,
        o.table_number,
        o.status,
        o.subtotal,
        o.tax_total,
        o.discount_total,
        o.total,
        o.points_earned,
        o.payment_method,
        o.payment_status,
        o.payment_reference,
        o.created_at
      FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE o.business_id = ${ctx.business.id}
      ORDER BY o.created_at DESC
      LIMIT 1000
    `;

    const headers = [
      "Order Number",
      "Customer",
      "Phone",
      "Order Type",
      "Table",
      "Status",
      "Subtotal",
      "Tax",
      "Discount",
      "Total",
      "Points Earned",
      "Payment Method",
      "Payment Status",
      "Reference",
      "Created At",
    ];

    const escapeCsv = (val: unknown) => {
      const s = val === null || val === undefined ? "" : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = orders.map((r) =>
      [
        r.order_number,
        r.customer_display_name,
        r.customer_phone,
        r.order_type,
        r.table_number || "",
        r.status,
        r.subtotal,
        r.tax_total,
        r.discount_total,
        r.total,
        r.points_earned,
        r.payment_method,
        r.payment_status,
        r.payment_reference || "",
        r.created_at ? new Date(r.created_at).toISOString() : "",
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${ctx.business.slug}-qr-orders.csv"`,
      },
    });
  }

  const [summary] = await sql`
    SELECT
      COUNT(*) AS total_orders,
      COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_orders,
      COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0) AS paid_revenue,
      COALESCE(SUM(points_earned) FILTER (WHERE payment_status = 'paid'), 0) AS total_points_issued,
      COUNT(DISTINCT customer_id) AS unique_ordering_customers
    FROM public.orders
    WHERE business_id = ${ctx.business.id}
  `;

  const statusBreakdown = await sql`
    SELECT status, COUNT(*) AS count
    FROM public.orders
    WHERE business_id = ${ctx.business.id}
    GROUP BY status
    ORDER BY count DESC
  `;

  const topItems = await sql`
    SELECT
      oi.item_name,
      SUM(oi.quantity) AS total_quantity,
      SUM(oi.total_price) AS total_revenue
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.business_id = ${ctx.business.id}
      AND o.status NOT IN ('cancelled', 'rejected', 'expired', 'refunded')
    GROUP BY oi.item_name
    ORDER BY total_quantity DESC
    LIMIT 10
  `;

  return NextResponse.json({
    summary: {
      totalOrders: Number(summary?.total_orders ?? 0),
      paidOrders: Number(summary?.paid_orders ?? 0),
      paidRevenue: Number(summary?.paid_revenue ?? 0),
      totalPointsIssued: Number(summary?.total_points_issued ?? 0),
      uniqueOrderingCustomers: Number(summary?.unique_ordering_customers ?? 0),
    },
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: Number(s.count),
    })),
    topItems: topItems.map((i) => ({
      itemName: i.item_name,
      totalQuantity: Number(i.total_quantity),
      totalRevenue: Number(i.total_revenue),
    })),
  });
}

