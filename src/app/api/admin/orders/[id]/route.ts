import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

const allowedStatuses = ["received", "preparing", "delivering", "completed", "cancelled"] as const;
type AllowedStatus = (typeof allowedStatuses)[number];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { status?: AllowedStatus };
  if (!body.status || !allowedStatuses.includes(body.status)) {
    return Response.json({ error: "Status inválido." }, { status: 400 });
  }

  const [updated] = await db
    .update(orders)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning({ id: orders.id, status: orders.status, updatedAt: orders.updatedAt });

  if (!updated) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  return Response.json(updated);
}
