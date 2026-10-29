"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bike,
  Check,
  ChefHat,
  Clock3,
  Gift,
  MapPin,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Store,
  Utensils,
} from "lucide-react";
import { formatCurrency } from "@/lib/store-data";

type OrderData = {
  id: string;
  shortId: string;
  customerName: string;
  customerPhone: string;
  fulfillment: "delivery" | "pickup";
  deliveryAddress: string | null;
  subtotalInCents: number;
  deliveryFeeInCents: number;
  discountInCents: number;
  totalInCents: number;
  status: "received" | "preparing" | "delivering" | "completed" | "cancelled";
  paymentMethod: "pix" | "card" | "cash";
  estimatedAt: string;
  createdAt: string;
  items: Array<{ id: number; productName: string; quantity: number; unitPriceInCents: number }>;
  customer: { points: number; tier: string } | null;
};

const steps = [
  { status: "received", title: "Recebido", description: "Pedido confirmado", icon: ReceiptText },
  { status: "preparing", title: "Em preparo", description: "A cozinha está caprichando", icon: ChefHat },
  { status: "delivering", title: "Saiu para entrega", description: "Já está a caminho", icon: Bike },
  { status: "completed", title: "Entregue", description: "Bom apetite!", icon: PackageCheck },
] as const;

const paymentLabels = { pix: "Pix", card: "Cartão online", cash: "Na entrega" };

export function OrderTracking({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  async function load() {
    try {
      const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = (await response.json()) as OrderData & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Pedido não encontrado.");
      setOrder(data);
      setUpdatedAt(new Date());
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível atualizar o pedido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 10_000);
    return () => window.clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f1e7]"><div className="text-center"><RefreshCw className="mx-auto animate-spin text-[#287154]" /><p className="mt-3 text-sm font-bold">Buscando seu pedido...</p></div></main>;
  }

  if (!order || error) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f1e7] p-5"><section className="max-w-md border border-[#dedfd7] bg-white p-9 text-center"><ShoppingBag className="mx-auto text-[#87978f]" size={36} /><h1 className="display-font mt-5 text-4xl font-bold">Pedido não encontrado</h1><p className="mt-3 text-sm text-[#687970]">{error}</p><Link href="/" className="mt-6 inline-flex rounded-full bg-[#173f32] px-6 py-3 text-sm font-bold text-white">Voltar ao cardápio</Link></section></main>;
  }

  const currentIndex = order.status === "cancelled" ? -1 : steps.findIndex((step) => step.status === order.status);
  const firstName = order.customerName.split(" ")[0];
  const eta = new Date(order.estimatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#f7f1e7]">
      <header className="border-b border-[#dedfd7] bg-[#fffdf8]">
        <div className="shell flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-full bg-[#173f32] text-[#f1c85b]"><Utensils size={20} /></span><span className="display-font text-[27px] font-bold">Rango.</span></Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[#52665c]"><ArrowLeft size={17} /> Voltar ao cardápio</Link>
        </div>
      </header>

      <main className="shell py-10 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="text-xs font-black uppercase tracking-[.15em] text-[#f45d3d]">Pedido #{order.shortId}</p><h1 className="display-font mt-2 text-5xl font-bold leading-none">Oi, {firstName}.<br />A gente cuida daqui.</h1></div>
            <button onClick={load} className="flex w-fit items-center gap-2 text-xs font-bold text-[#687970]"><RefreshCw size={15} /> Atualizado {updatedAt ? updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "agora"}</button>
          </div>

          {order.status === "cancelled" ? (
            <div className="mt-10 border border-[#e3b7ae] bg-[#fff1ee] p-6"><h2 className="font-bold text-[#b23d29]">Este pedido foi cancelado</h2><p className="mt-2 text-sm text-[#78534c]">Fale com nossa equipe se precisar de ajuda.</p></div>
          ) : (
            <section className="mt-10 border border-[#dedfd7] bg-white p-6 soft-shadow md:p-9">
              <div className="flex items-center justify-between border-b border-[#e2e3dc] pb-6">
                <div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-full bg-[#f1c85b]"><Clock3 size={22} /></div><div><p className="text-xs font-bold uppercase tracking-[.1em] text-[#687970]">Previsão</p><p className="mt-1 text-xl font-black">até {eta}</p></div></div>
                <span className="hidden rounded-full bg-[#eef5f0] px-4 py-2 text-xs font-bold text-[#287154] sm:block">Acompanhamento ao vivo</span>
              </div>
              <div className="mt-9 grid gap-0 md:grid-cols-4">
                {steps.map((step, index) => {
                  const complete = index <= currentIndex;
                  const active = index === currentIndex;
                  return (
                    <div key={step.status} className="relative flex gap-4 pb-7 md:block md:pb-0 md:text-center">
                      {index < steps.length - 1 && <span className={`absolute left-6 top-12 h-[calc(100%-32px)] w-0.5 md:left-[50%] md:top-6 md:h-0.5 md:w-full ${index < currentIndex ? "bg-[#287154]" : "bg-[#dfe2dc]"}`} />}
                      <div className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full border-2 md:mx-auto ${complete ? "border-[#287154] bg-[#287154] text-white" : "border-[#dfe2dc] bg-white text-[#9aa69f]"} ${active ? "shadow-[0_0_0_7px_#e6f0e9]" : ""}`}><step.icon size={20} /></div>
                      <div className="md:mt-4"><p className={`text-sm font-black ${complete ? "text-[#17352b]" : "text-[#9aa69f]"}`}>{step.title}</p><p className="mt-1 text-xs text-[#87978f]">{step.description}</p></div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
            <section className="border border-[#dedfd7] bg-white p-6 md:p-8">
              <h2 className="display-font text-2xl font-bold">Resumo do pedido</h2>
              <div className="mt-6 space-y-5">
                {order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b border-[#e6e7e1] pb-4"><div className="flex gap-3"><span className="grid size-7 place-items-center bg-[#eef5f0] text-xs font-black text-[#287154]">{item.quantity}×</span><span className="text-sm font-bold">{item.productName}</span></div><strong className="text-sm">{formatCurrency(item.quantity * item.unitPriceInCents)}</strong></div>)}
              </div>
              <div className="mt-5 space-y-2 text-sm"><div className="flex justify-between text-[#687970]"><span>Subtotal</span><span>{formatCurrency(order.subtotalInCents)}</span></div><div className="flex justify-between text-[#687970]"><span>Entrega</span><span>{order.deliveryFeeInCents ? formatCurrency(order.deliveryFeeInCents) : "Grátis"}</span></div>{order.discountInCents > 0 && <div className="flex justify-between font-bold text-[#287154]"><span>Desconto</span><span>-{formatCurrency(order.discountInCents)}</span></div>}<div className="flex justify-between border-t border-[#dedfd7] pt-4 text-lg font-black"><span>Total</span><span>{formatCurrency(order.totalInCents)}</span></div></div>
            </section>

            <div className="space-y-6">
              <section className="border border-[#dedfd7] bg-white p-6">
                <h2 className="display-font text-2xl font-bold">Detalhes</h2>
                <div className="mt-5 space-y-5 text-sm">
                  <div className="flex gap-3"><MapPin className="shrink-0 text-[#287154]" size={19} /><div><p className="font-bold">{order.fulfillment === "delivery" ? "Entrega" : "Retirada no balcão"}</p><p className="mt-1 leading-5 text-[#687970]">{order.deliveryAddress ?? "Rua das Oliveiras, 300 — Centro"}</p></div></div>
                  <div className="flex gap-3"><ReceiptText className="shrink-0 text-[#287154]" size={19} /><div><p className="font-bold">Pagamento</p><p className="mt-1 text-[#687970]">{paymentLabels[order.paymentMethod]}</p></div></div>
                </div>
              </section>
              {order.customer && <section className="bg-[#173f32] p-6 text-white"><div className="flex items-center gap-3"><Gift className="text-[#f1c85b]" /><div><p className="text-xs font-bold uppercase tracking-[.1em] text-[#f1c85b]">Clube Rango · {order.customer.tier}</p><p className="display-font mt-1 text-3xl font-bold">{order.customer.points} pontos</p></div></div><p className="mt-4 text-xs leading-5 text-white/60">Continue pedindo por aqui. Com 10 pontos, sua próxima marmita é grátis.</p></section>}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#d6d9d2] pt-7 sm:flex-row">
            <p className="text-sm text-[#687970]">Precisa falar com a equipe?</p>
            <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:gap-3"><a href={`https://wa.me/5518999990109?text=${encodeURIComponent(`Olá! Preciso de ajuda com o pedido #${order.shortId}.`)}`} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#173f32] px-4 text-sm font-bold"><MessageCircle size={17} /> WhatsApp</a><Link href="/#cardapio" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#f45d3d] px-4 text-sm font-bold text-white"><ShoppingBag size={17} /> Pedir de novo</Link></div>
          </div>
        </div>
      </main>
    </div>
  );
}
