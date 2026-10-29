import { neighborhoods, products, type Product } from "./store-data";

export const COUPON_CODE = "FEIJOADA20";
export const COUPON_PRODUCT_ID = 4;
export const COUPON_RATE = 0.2;
export const DEFAULT_DELIVERY_FEE_IN_CENTS = 650;
export const MAX_ITEM_QUANTITY = 20;

export type CheckoutItemInput = {
  productId: number;
  quantity: number;
  notes?: string;
};

export type NormalizedItem = {
  product: Product;
  quantity: number;
  notes?: string;
};

export type CheckoutTotals = {
  subtotalInCents: number;
  deliveryFeeInCents: number;
  discountInCents: number;
  totalInCents: number;
  earnedPoints: number;
  couponApplied: boolean;
};

/** Mantém só dígitos e os 11 últimos (DDD + número). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-11);
}

/** Valida o produto e limita a quantidade entre 1 e 20 unidades. */
export function normalizeItems(items: CheckoutItemInput[]): NormalizedItem[] {
  return items.map((item) => {
    const product = products.find((candidate) => candidate.id === Number(item.productId));
    if (!product) throw new Error("Produto inválido no carrinho.");
    const quantity = Math.max(
      1,
      Math.min(MAX_ITEM_QUANTITY, Math.floor(Number(item.quantity))),
    );
    return { product, quantity, notes: item.notes?.trim() };
  });
}

/**
 * Fecha os valores do pedido no servidor.
 * O cupom FEIJOADA20 vale só sobre os itens do produto 4 e nunca deixa o total negativo.
 */
export function calculateTotals(input: {
  items: NormalizedItem[];
  fulfillment: "delivery" | "pickup";
  neighborhood?: string;
  couponCode?: string;
}): CheckoutTotals {
  const subtotalInCents = input.items.reduce(
    (total, item) => total + item.product.priceInCents * item.quantity,
    0,
  );
  const selectedNeighborhood = neighborhoods.find(
    (item) => item.name === input.neighborhood,
  );
  const deliveryFeeInCents =
    input.fulfillment === "delivery"
      ? (selectedNeighborhood?.feeInCents ?? DEFAULT_DELIVERY_FEE_IN_CENTS)
      : 0;
  const couponApplied =
    input.couponCode?.trim().toUpperCase() === COUPON_CODE;
  const feijoadaSubtotal = input.items
    .filter((item) => item.product.id === COUPON_PRODUCT_ID)
    .reduce((total, item) => total + item.product.priceInCents * item.quantity, 0);
  const discountInCents = couponApplied
    ? Math.round(feijoadaSubtotal * COUPON_RATE)
    : 0;
  const totalInCents = Math.max(
    0,
    subtotalInCents + deliveryFeeInCents - discountInCents,
  );
  const earnedPoints = input.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  return {
    subtotalInCents,
    deliveryFeeInCents,
    discountInCents,
    totalInCents,
    earnedPoints,
    couponApplied,
  };
}
