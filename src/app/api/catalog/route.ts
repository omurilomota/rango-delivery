import { ensureSeeded } from "@/lib/seed";
import { categories, dailyProductIds, products } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  return Response.json({ categories, products, dailyProductIds, updatedAt: new Date().toISOString() });
}
