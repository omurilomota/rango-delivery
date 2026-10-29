import { db } from "@/db";
import {
  categories as categoriesTable,
  customers,
  orderItems,
  orders,
  products as productsTable,
  promotions,
} from "@/db/schema";
import { categories, products } from "@/lib/store-data";

const globalSeed = globalThis as typeof globalThis & { __rangoSeedPromise?: Promise<void> };

async function runSeed() {
  await db
    .insert(categoriesTable)
    .values(
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        active: true,
      })),
    )
    .onConflictDoNothing();

  for (const product of products) {
    await db
      .insert(productsTable)
      .values({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceInCents: product.priceInCents,
        originalPriceInCents: product.originalPriceInCents,
        imageUrl: product.imageUrl,
        badge: product.badge,
        prepMinutes: product.prepMinutes,
        featured: product.featured,
        active: true,
      })
      .onConflictDoUpdate({
        target: productsTable.slug,
        set: {
          categoryId: product.categoryId,
          name: product.name,
          description: product.description,
          priceInCents: product.priceInCents,
          imageUrl: product.imageUrl,
          badge: product.badge,
          prepMinutes: product.prepMinutes,
          featured: product.featured,
          active: true,
          updatedAt: new Date(),
        },
      });
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  await db
    .insert(promotions)
    .values({
      title: "Quarta da Feijoada",
      code: "FEIJOADA20",
      description: "20% OFF nas primeiras 20 feijoadas pedidas pelo Clube Rango.",
      discountPercent: 20,
      maxRedemptions: 20,
      redemptions: 7,
      endsAt: end,
      active: true,
    })
    .onConflictDoUpdate({
      target: promotions.code,
      set: { title: "Quarta da Feijoada", endsAt: end, active: true },
    });

  const [demoCustomer] = await db
    .insert(customers)
    .values({
      name: "Marina Alves",
      phone: "18999990000",
      points: 8,
      tier: "Ouro",
      marketingConsent: true,
      lastOrderAt: new Date(),
    })
    .onConflictDoUpdate({ target: customers.phone, set: { lastOrderAt: new Date() } })
    .returning({ id: customers.id });

  const sampleOrders = [
    { id: "11111111-1111-4111-8111-111111111111", hour: 10, minute: 48, productId: 4, quantity: 1, status: "preparing" as const, total: 3190, name: "Marina Alves" },
    { id: "22222222-2222-4222-8222-222222222222", hour: 11, minute: 3, productId: 1, quantity: 2, status: "received" as const, total: 5594, name: "João Pedro" },
    { id: "33333333-3333-4333-8333-333333333333", hour: 11, minute: 12, productId: 3, quantity: 1, status: "delivering" as const, total: 3990, name: "Carla Mendes" },
    { id: "44444444-4444-4444-8444-444444444444", hour: 9, minute: 56, productId: 2, quantity: 1, status: "completed" as const, total: 2797, name: "Rafael Lima" },
    { id: "55555555-5555-4555-8555-555555555555", hour: 10, minute: 22, productId: 6, quantity: 1, status: "completed" as const, total: 7192, name: "Oficina Avenida" },
  ];

  for (const sample of sampleOrders) {
    const createdAt = new Date();
    createdAt.setHours(sample.hour, sample.minute, 0, 0);
    const product = products.find((item) => item.id === sample.productId)!;
    const [inserted] = await db
      .insert(orders)
      .values({
        id: sample.id,
        customerId: sample.id.startsWith("1") ? demoCustomer.id : null,
        customerName: sample.name,
        customerPhone: sample.id.startsWith("1") ? "18999990000" : `1898888${sample.id[0].repeat(4)}`,
        fulfillment: sample.id.startsWith("2") ? "pickup" : "delivery",
        deliveryAddress: sample.id.startsWith("2") ? null : "Centro, Junqueirópolis/SP",
        subtotalInCents: sample.total,
        totalInCents: sample.total,
        status: sample.status,
        paymentMethod: sample.id.startsWith("4") ? "cash" : "pix",
        estimatedAt: new Date(createdAt.getTime() + 40 * 60 * 1000),
        createdAt,
        updatedAt: createdAt,
      })
      .onConflictDoNothing()
      .returning({ id: orders.id });

    if (inserted) {
      await db.insert(orderItems).values({
        orderId: inserted.id,
        productId: product.id,
        productName: product.name,
        unitPriceInCents: product.priceInCents,
        quantity: sample.quantity,
      });
    }
  }
}

export function ensureSeeded() {
  if (!globalSeed.__rangoSeedPromise) {
    globalSeed.__rangoSeedPromise = runSeed().catch((error) => {
      globalSeed.__rangoSeedPromise = undefined;
      throw error;
    });
  }
  return globalSeed.__rangoSeedPromise;
}
