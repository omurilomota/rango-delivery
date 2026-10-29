import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const phone = new URL(request.url).searchParams.get("phone")?.replace(/\D/g, "").slice(-11) ?? "";
  if (phone.length < 10) return Response.json({ error: "WhatsApp inválido." }, { status: 400 });

  const [customer] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  if (!customer) return Response.json({ error: "Cliente não encontrado." }, { status: 404 });

  const history = await db
    .select({
      id: orders.id,
      totalInCents: orders.totalInCents,
      status: orders.status,
      createdAt: orders.createdAt,
      fulfillment: orders.fulfillment,
    })
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return Response.json({
    customer: { id: customer.id, name: customer.name, phone: customer.phone, points: customer.points, tier: customer.tier },
    orders: history.map((order) => ({ ...order, shortId: order.id.slice(0, 8).toUpperCase() })),
  });
}
