import { db } from "@/db";
import { customers, loyaltyLedger, orderItems, orders } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import {
  COUPON_CODE,
  calculateTotals,
  normalizeItems,
  normalizePhone,
} from "@/lib/checkout";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type CheckoutBody = {
  customerName?: string;
  customerPhone?: string;
  fulfillment?: "delivery" | "pickup";
  neighborhood?: string;
  deliveryAddress?: string;
  paymentMethod?: "pix" | "card" | "cash";
  couponCode?: string;
  notes?: string;
  marketingConsent?: boolean;
  items?: Array<{ productId: number; quantity: number; notes?: string }>;
};

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as CheckoutBody;
    const name = body.customerName?.trim();
    const phone = normalizePhone(body.customerPhone ?? "");
    const fulfillment = body.fulfillment === "pickup" ? "pickup" : "delivery";
    const method = ["pix", "card", "cash"].includes(body.paymentMethod ?? "")
      ? (body.paymentMethod as "pix" | "card" | "cash")
      : "pix";

    if (!name || phone.length < 10) {
      return Response.json({ error: "Informe nome e WhatsApp válidos." }, { status: 400 });
    }
    if (!body.items?.length) {
      return Response.json({ error: "Seu carrinho está vazio." }, { status: 400 });
    }
    if (fulfillment === "delivery" && !body.deliveryAddress?.trim()) {
      return Response.json({ error: "Informe o endereço de entrega." }, { status: 400 });
    }

    const normalizedItems = normalizeItems(body.items);
    const {
      subtotalInCents,
      deliveryFeeInCents,
      discountInCents,
      totalInCents,
      earnedPoints,
      couponApplied,
    } = calculateTotals({
      items: normalizedItems,
      fulfillment,
      neighborhood: body.neighborhood,
      couponCode: body.couponCode,
    });
    const estimatedAt = new Date(Date.now() + (fulfillment === "delivery" ? 40 : 25) * 60 * 1000);

    const result = await db.transaction(async (tx) => {
      const [customer] = await tx
        .insert(customers)
        .values({
          name,
          phone,
          marketingConsent: Boolean(body.marketingConsent),
          points: 0,
          lastOrderAt: new Date(),
        })
        .onConflictDoUpdate({
          target: customers.phone,
          set: {
            name,
            marketingConsent: Boolean(body.marketingConsent),
            lastOrderAt: new Date(),
          },
        })
        .returning();

      const [order] = await tx
        .insert(orders)
        .values({
          customerId: customer.id,
          customerName: name,
          customerPhone: phone,
          fulfillment,
          deliveryAddress: fulfillment === "delivery" ? body.deliveryAddress?.trim() : null,
          subtotalInCents,
          deliveryFeeInCents,
          discountInCents,
          totalInCents,
          paymentMethod: method,
          couponCode: couponApplied ? COUPON_CODE : null,
          notes: body.notes?.trim(),
          estimatedAt,
        })
        .returning();

      await tx.insert(orderItems).values(
        normalizedItems.map((item) => ({
          orderId: order.id,
          productId: item.product.id,
          productName: item.product.name,
          unitPriceInCents: item.product.priceInCents,
          quantity: item.quantity,
          notes: item.notes,
        })),
      );

      await tx
        .update(customers)
        .set({ points: sql`${customers.points} + ${earnedPoints}`, lastOrderAt: new Date() })
        .where(eq(customers.id, customer.id));
      await tx.insert(loyaltyLedger).values({
        customerId: customer.id,
        orderId: order.id,
        points: earnedPoints,
        reason: `Pedido #${order.id.slice(0, 8).toUpperCase()}`,
      });

      return { order, earnedPoints, customerPoints: customer.points + earnedPoints };
    });

    return Response.json(
      {
        id: result.order.id,
        shortId: result.order.id.slice(0, 8).toUpperCase(),
        status: result.order.status,
        estimatedAt: result.order.estimatedAt,
        totalInCents,
        earnedPoints: result.earnedPoints,
        customerPoints: result.customerPoints,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("checkout_error", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível criar o pedido." },
      { status: 500 },
    );
  }
}
