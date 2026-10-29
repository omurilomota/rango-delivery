"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Gift, History, LoaderCircle, LogOut, MapPin, ShoppingBag, Star, Trophy, User, Utensils } from "lucide-react";
import { formatCurrency } from "@/lib/store-data";

type AccountData = {
  customer: { id: number; name: string; phone: string; points: number; tier: string };
  orders: Array<{ id: string; shortId: string; totalInCents: number; status: string; createdAt: string; fulfillment: string }>;
};

const statusLabels: Record<string, string> = {
  received: "Recebido",
  preparing: "Em preparo",
  delivering: "Em entrega",
  completed: "Entregue",
  cancelled: "Cancelado",
};

export function AccountDashboard({ phone }: { phone: string }) {
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!phone) {
      setError("Entre pelo menu da página inicial para acessar sua conta.");
      return;
    }
    fetch(`/api/account?phone=${encodeURIComponent(phone)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as AccountData & { error?: string };
        if (!response.ok) throw new Error(result.error);
        setData(result);
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, [phone]);

  if (!data && !error) return <main className="grid min-h-screen place-items-center bg-[#f7f1e7]"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[#287154]" /><p className="mt-3 text-sm font-bold">Carregando sua conta...</p></div></main>;
  if (!data) return <main className="grid min-h-screen place-items-center bg-[#f7f1e7] p-5"><div className="max-w-md bg-white p-9 text-center"><User className="mx-auto text-[#87978f]" size={34} /><h1 className="display-font mt-4 text-4xl font-bold">Sua conta Rango</h1><p className="mt-3 text-sm leading-6 text-[#687970]">{error}</p><Link href="/" className="mt-6 inline-flex rounded-full bg-[#173f32] px-6 py-3 text-sm font-bold text-white">Voltar e entrar</Link></div></main>;

  const { customer, orders } = data;
  const progress = Math.min(10, customer.points % 10 || (customer.points > 0 ? 10 : 0));

  return (
    <div className="min-h-screen bg-[#f7f1e7]">
      <header className="border-b border-[#dedfd7] bg-[#fffdf8]"><div className="shell flex h-[72px] items-center justify-between"><Link href="/" className="flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-full bg-[#173f32] text-[#f1c85b]"><Utensils size={20} /></span><span className="display-font text-[27px] font-bold">Rango.</span></Link><Link href="/" className="flex items-center gap-2 text-sm font-bold text-[#52665c]"><ArrowLeft size={17} /> Cardápio</Link></div></header>
      <main className="shell py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.15em] text-[#f45d3d]">Minha conta</p><h1 className="display-font mt-2 text-5xl font-bold">Olá, {customer.name.split(" ")[0]}!</h1><p className="mt-3 text-[#687970]">Seu almoço, seus pontos e seus pedidos em um só lugar.</p></div><button onClick={() => { localStorage.removeItem("rango-account"); location.href = "/"; }} className="flex w-fit items-center gap-2 text-sm font-bold text-[#687970]"><LogOut size={17} /> Sair da conta</button></div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="bg-[#173f32] p-7 text-white md:p-9">
              <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-full bg-[#f1c85b] text-[#17352b]"><Trophy size={25} /></div><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#f1c85b]">Nível {customer.tier}</p><p className="display-font mt-1 text-3xl font-bold">{customer.points} pontos</p></div></div><Star className="text-[#f1c85b]" fill="currentColor" /></div>
              <div className="mt-8 grid grid-cols-10 gap-2">{Array.from({ length: 10 }).map((_, index) => <div key={index} className={`grid aspect-square place-items-center border text-xs font-black ${index < progress ? "border-[#f1c85b] bg-[#f1c85b] text-[#17352b]" : "border-white/25 text-white/35"}`}>{index < progress ? <Check size={14} /> : index + 1}</div>)}</div>
              <p className="mt-5 text-sm text-white/65">{progress === 10 ? "Você já pode resgatar uma marmita grátis!" : `Faltam ${10 - progress} pontos para sua próxima marmita grátis.`}</p>
            </section>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/#cardapio" className="group border border-[#dedfd7] bg-white p-5"><ShoppingBag className="text-[#287154]" /><p className="mt-5 font-black">Novo pedido</p><p className="mt-1 text-xs text-[#687970]">Veja o cardápio de hoje</p><ArrowRight className="mt-4 transition group-hover:translate-x-1" size={17} /></Link>
              <a href="https://wa.me/5518999990109?text=Ol%C3%A1%21%20Quero%20conhecer%20os%20planos%20de%20marmitas." target="_blank" rel="noreferrer" className="group border border-[#dedfd7] bg-white p-5"><CalendarDays className="text-[#f45d3d]" /><p className="mt-5 font-black">Assinatura</p><p className="mt-1 text-xs text-[#687970]">Economize até 15%</p><ArrowRight className="mt-4 transition group-hover:translate-x-1" size={17} /></a>
              <div className="col-span-2 flex items-center gap-4 border border-[#dedfd7] bg-white p-5"><div className="grid size-11 place-items-center bg-[#f1c85b]"><Gift size={21} /></div><div><p className="font-black">Presente de aniversário</p><p className="mt-1 text-xs text-[#687970]">Complete seu perfil no WhatsApp e receba uma surpresa.</p></div></div>
            </div>
          </div>

          <section className="mt-10 border border-[#dedfd7] bg-white p-6 md:p-8">
            <div className="flex items-center gap-3"><History className="text-[#287154]" /><h2 className="display-font text-3xl font-bold">Últimos pedidos</h2></div>
            {orders.length ? <div className="mt-6 divide-y divide-[#e5e6e0]">{orders.map((order) => <Link href={`/pedidos/${order.id}`} key={order.id} className="group grid gap-3 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="flex items-center gap-2"><strong className="text-sm">Pedido #{order.shortId}</strong><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${order.status === "completed" ? "bg-[#e8f2eb] text-[#287154]" : "bg-[#fff1dc] text-[#9a6512]"}`}>{statusLabels[order.status] ?? order.status}</span></div><p className="mt-1.5 text-xs text-[#687970]">{new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} · {order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</p></div><strong>{formatCurrency(order.totalInCents)}</strong><ArrowRight size={18} className="hidden text-[#87978f] transition group-hover:translate-x-1 sm:block" /></Link>)}</div> : <div className="py-14 text-center"><ShoppingBag className="mx-auto text-[#a1aaa5]" /><p className="mt-3 font-bold">Seu primeiro pedido vai aparecer aqui.</p></div>}
          </section>

          <div className="mt-8 flex items-center gap-3 text-sm text-[#687970]"><MapPin size={17} /> Rango Restaurante · Rua das Oliveiras, 300 · Junqueirópolis/SP</div>
        </div>
      </main>
    </div>
  );
}
