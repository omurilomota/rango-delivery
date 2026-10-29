import { db } from "@/db";
import { customers } from "@/db/schema";

export const dynamic = "force-dynamic";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-11);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; phone?: string; code?: string; name?: string };
  const phone = normalizePhone(body.phone ?? "");
  if (phone.length < 10) return Response.json({ error: "WhatsApp inválido." }, { status: 400 });

  if (body.action === "send") {
    return Response.json({ ok: true, demo: true, message: "Código enviado. Na demonstração, use 1234." });
  }

  if (body.action === "verify") {
    if (body.code !== "1234") return Response.json({ error: "Código incorreto. Tente 1234." }, { status: 401 });
    const name = body.name?.trim() || "Cliente Rango";
    const [customer] = await db
      .insert(customers)
      .values({ name, phone, marketingConsent: true })
      .onConflictDoUpdate({ target: customers.phone, set: { name } })
      .returning({ id: customers.id, name: customers.name, phone: customers.phone, points: customers.points, tier: customers.tier });
    return Response.json({ ok: true, customer });
  }

  return Response.json({ error: "Ação inválida." }, { status: 400 });
}
