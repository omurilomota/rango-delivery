import { db } from "@/db";
import { customers, orderItems, orders } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { desc, eq, gte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [summaryRows, customerRows, recentOrders, topProducts, statusRows] = await Promise.all([
    db
      .select({
        revenueInCents: sql<number>`coalesce(sum(${orders.totalInCents}), 0)::int`,
        orderCount: sql<number>`count(*)::int`,
        averageInCents: sql<number>`coalesce(avg(${orders.totalInCents}), 0)::int`,
      })
      .from(orders)
      .where(gte(orders.createdAt, start)),
    db.select({ count: sql<number>`count(*)::int` }).from(customers),
    db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        totalInCents: orders.totalInCents,
        status: orders.status,
        fulfillment: orders.fulfillment,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(gte(orders.createdAt, start))
      .orderBy(desc(orders.createdAt))
      .limit(12),
    db
      .select({
        name: orderItems.productName,
        quantity: sql<number>`sum(${orderItems.quantity})::int`,
        revenueInCents: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPriceInCents})::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(gte(orders.createdAt, start))
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5),
    db
      .select({ status: orders.status, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, start))
      .groupBy(orders.status),
  ]);

  const summary = summaryRows[0];
  return Response.json({
    summary: {
      ...summary,
      customers: customerRows[0]?.count ?? 0,
      marketplaceSavingsInCents: Math.round((summary?.revenueInCents ?? 0) * 0.18),
      goalInCents: 180000,
    },
    orders: recentOrders.map((order) => ({ ...order, shortId: order.id.slice(0, 8).toUpperCase() })),
    topProducts,
    statuses: Object.fromEntries(statusRows.map((row) => [row.status, row.count])),
    generatedAt: new Date().toISOString(),
  });
}
