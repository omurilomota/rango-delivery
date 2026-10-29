import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const productId = Number(id);
  const body = (await request.json()) as { active?: boolean; priceInCents?: number };
  if (!Number.isInteger(productId)) return Response.json({ error: "Produto inválido." }, { status: 400 });

  const changes: { active?: boolean; priceInCents?: number; updatedAt: Date } = { updatedAt: new Date() };
  if (typeof body.active === "boolean") changes.active = body.active;
  if (Number.isInteger(body.priceInCents) && Number(body.priceInCents) > 0) changes.priceInCents = Number(body.priceInCents);

  const [updated] = await db.update(products).set(changes).where(eq(products.id, productId)).returning();
  if (!updated) return Response.json({ error: "Produto não encontrado." }, { status: 404 });
  return Response.json(updated);
}
