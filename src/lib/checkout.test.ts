import { describe, expect, it } from "vitest";
import {
  COUPON_CODE,
  DEFAULT_DELIVERY_FEE_IN_CENTS,
  MAX_ITEM_QUANTITY,
  calculateTotals,
  normalizeItems,
  normalizePhone,
} from "./checkout";
import { neighborhoods, products } from "./store-data";

const feijoada = products.find((product) => product.id === 4)!;
const frango = products.find((product) => product.id === 1)!;

describe("normalizePhone", () => {
  it("remove a máscara e mantém DDD + número", () => {
    expect(normalizePhone("(18) 99999-0108")).toBe("18999990108");
  });

  it("descarta o código do país e usa os 11 últimos dígitos", () => {
    expect(normalizePhone("55 18 99999-0108")).toBe("18999990108");
  });

  it("devolve vazio quando não há dígitos", () => {
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone("sem número")).toBe("");
  });
});

describe("normalizeItems", () => {
  it("mantém produto conhecido e quantidade válida", () => {
    const [item] = normalizeItems([{ productId: frango.id, quantity: 2, notes: "  sem cebola  " }]);
    expect(item.product.id).toBe(frango.id);
    expect(item.quantity).toBe(2);
    expect(item.notes).toBe("sem cebola");
  });

  it("limita a quantidade entre 1 e o máximo", () => {
    expect(normalizeItems([{ productId: frango.id, quantity: 0 }])[0].quantity).toBe(1);
    expect(normalizeItems([{ productId: frango.id, quantity: -3 }])[0].quantity).toBe(1);
    expect(normalizeItems([{ productId: frango.id, quantity: 999 }])[0].quantity).toBe(MAX_ITEM_QUANTITY);
    expect(normalizeItems([{ productId: frango.id, quantity: 2.9 }])[0].quantity).toBe(2);
  });

  it("recusa produto inexistente", () => {
    expect(() => normalizeItems([{ productId: 9999, quantity: 1 }])).toThrow("Produto inválido");
  });
});

describe("calculateTotals", () => {
  it("não cobra entrega na retirada", () => {
    const totals = calculateTotals({
      items: normalizeItems([{ productId: frango.id, quantity: 2 }]),
      fulfillment: "pickup",
    });
    expect(totals.deliveryFeeInCents).toBe(0);
    expect(totals.subtotalInCents).toBe(frango.priceInCents * 2);
    expect(totals.totalInCents).toBe(frango.priceInCents * 2);
  });

  it("usa a taxa do bairro escolhido", () => {
    const bairro = neighborhoods.find((item) => item.feeInCents > 0)!;
    const totals = calculateTotals({
      items: normalizeItems([{ productId: frango.id, quantity: 1 }]),
      fulfillment: "delivery",
      neighborhood: bairro.name,
    });
    expect(totals.deliveryFeeInCents).toBe(bairro.feeInCents);
  });

  it("cai na taxa padrão quando o bairro é desconhecido", () => {
    const totals = calculateTotals({
      items: normalizeItems([{ productId: frango.id, quantity: 1 }]),
      fulfillment: "delivery",
      neighborhood: "Bairro que não existe",
    });
    expect(totals.deliveryFeeInCents).toBe(DEFAULT_DELIVERY_FEE_IN_CENTS);
  });

  it("aplica o cupom só sobre o produto da feijoada", () => {
    const items = normalizeItems([
      { productId: feijoada.id, quantity: 2 },
      { productId: frango.id, quantity: 1 },
    ]);
    const totals = calculateTotals({
      items,
      fulfillment: "pickup",
      couponCode: `  ${COUPON_CODE.toLowerCase()}  `,
    });
    const expectedDiscount = Math.round(feijoada.priceInCents * 2 * 0.2);
    expect(totals.couponApplied).toBe(true);
    expect(totals.discountInCents).toBe(expectedDiscount);
    expect(totals.totalInCents).toBe(totals.subtotalInCents - expectedDiscount);
  });

  it("não dá desconto quando o cupom não se aplica ao carrinho", () => {
    const totals = calculateTotals({
      items: normalizeItems([{ productId: frango.id, quantity: 1 }]),
      fulfillment: "pickup",
      couponCode: COUPON_CODE,
    });
    expect(totals.couponApplied).toBe(true);
    expect(totals.discountInCents).toBe(0);
  });

  it("ignora cupom diferente", () => {
    const totals = calculateTotals({
      items: normalizeItems([{ productId: feijoada.id, quantity: 1 }]),
      fulfillment: "pickup",
      couponCode: "OUTRO10",
    });
    expect(totals.couponApplied).toBe(false);
    expect(totals.discountInCents).toBe(0);
  });

  it("soma um ponto de fidelidade por unidade", () => {
    const totals = calculateTotals({
      items: normalizeItems([
        { productId: feijoada.id, quantity: 2 },
        { productId: frango.id, quantity: 3 },
      ]),
      fulfillment: "pickup",
    });
    expect(totals.earnedPoints).toBe(5);
  });

  it("nunca devolve total negativo", () => {
    const totals = calculateTotals({
      items: normalizeItems([{ productId: feijoada.id, quantity: 1 }]),
      fulfillment: "delivery",
      couponCode: COUPON_CODE,
    });
    expect(totals.totalInCents).toBeGreaterThanOrEqual(0);
  });
});
