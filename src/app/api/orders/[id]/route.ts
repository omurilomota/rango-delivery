import { db } from "@/db";
import { customers, orderItems, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });

  const [items, customer] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    order.customerId
      ? db
          .select({ points: customers.points, tier: customers.tier })
          .from(customers)
          .where(and(eq(customers.id, order.customerId)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return Response.json({
    ...order,
    shortId: order.id.slice(0, 8).toUpperCase(),
    items,
    customer: customer[0] ?? null,
  });
}
