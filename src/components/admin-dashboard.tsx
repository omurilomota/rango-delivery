"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Bike,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Copy,
  Gift,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PackageCheck,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { RangoMark } from "@/components/rango-logo";
import { dailyProductIds, formatCurrency, products } from "@/lib/store-data";

type Tab = "dashboard" | "orders" | "menu" | "promotions" | "customers" | "companies" | "settings";
type Status = "received" | "preparing" | "delivering" | "completed" | "cancelled";
type DashboardData = {
  summary: { revenueInCents: number; orderCount: number; averageInCents: number; customers: number; marketplaceSavingsInCents: number; goalInCents: number };
  orders: Array<{ id: string; shortId: string; customerName: string; customerPhone: string; totalInCents: number; status: Status; fulfillment: "delivery" | "pickup"; paymentMethod: string; createdAt: string }>;
  topProducts: Array<{ name: string; quantity: number; revenueInCents: number }>;
  statuses: Record<string, number>;
  generatedAt: string;
};

const navItems: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "menu", label: "Cardápio do dia", icon: Utensils },
  { id: "promotions", label: "Promoções", icon: Tag },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "companies", label: "Empresas", icon: Building2 },
  { id: "settings", label: "Configurações", icon: Settings },
];

const statusStyle: Record<Status, { label: string; className: string }> = {
  received: { label: "Recebido", className: "bg-[#fff4d7] text-[#8d6413]" },
  preparing: { label: "Em preparo", className: "bg-[#e9f1ff] text-[#315d99]" },
  delivering: { label: "Em entrega", className: "bg-[#f2eaff] text-[#6c49a0]" },
  completed: { label: "Entregue", className: "bg-[#e8f3eb] text-[#287154]" },
  cancelled: { label: "Cancelado", className: "bg-[#ffebe7] text-[#b6402b]" },
};

function AdminLogo() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <RangoMark size={38} ink="#f1c85b" accent="#173f32" title="Rango" />
      <div>
        <span className="display-font block text-[23px] font-bold leading-none text-white">Rango</span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.16em] text-white/45">Painel</span>
      </div>
    </Link>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [toast, setToast] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState("");
  const [activeProducts, setActiveProducts] = useState<Record<number, boolean>>(() => Object.fromEntries(products.map((product) => [product.id, true])));
  const [menuPublished, setMenuPublished] = useState(true);
  const [promoActive, setPromoActive] = useState(true);
  const [search, setSearch] = useState("");

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível atualizar o painel.");
      setData((await response.json()) as DashboardData);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(), 20_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function changeStatus(id: string, status: Status) {
    setUpdatingOrder(id);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Não foi possível atualizar o pedido.");
      setData((current) => current ? { ...current, orders: current.orders.map((order) => order.id === id ? { ...order, status } : order) } : current);
      setToast(`Pedido movido para “${statusStyle[status].label}”`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Erro ao atualizar.");
    } finally {
      setUpdatingOrder("");
    }
  }

  async function toggleProduct(productId: number) {
    const active = !activeProducts[productId];
    setActiveProducts((current) => ({ ...current, [productId]: active }));
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!response.ok) {
      setActiveProducts((current) => ({ ...current, [productId]: !active }));
      setToast("Não foi possível alterar a disponibilidade.");
    } else setToast(active ? "Item disponível no cardápio" : "Item marcado como esgotado");
  }

  const pendingOrders = data?.orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length ?? 0;
  const goalProgress = data ? Math.min(100, Math.round((data.summary.revenueInCents / data.summary.goalInCents) * 100)) : 0;
  const visibleOrders = useMemo(() => {
    if (!data) return [];
    const term = search.toLocaleLowerCase("pt-BR");
    return data.orders.filter((order) => `${order.customerName} ${order.shortId}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [data, search]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f4f2ec]"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[#287154]" /><p className="mt-3 text-sm font-bold">Preparando o painel...</p></div></main>;

  return (
    <div className="min-h-screen bg-[#f4f2ec] text-[#17352b]">
      {toast && <div className="fixed left-1/2 top-5 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#173f32] px-5 py-3 text-sm font-bold text-white shadow-xl animate-rise"><Check size={16} className="text-[#f1c85b]" />{toast}</div>}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#173f32] transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6"><AdminLogo /><button className="text-white/60 lg:hidden" onClick={() => setSidebarOpen(false)}><X /></button></div>
        <nav className="p-4">
          <p className="px-3 pb-3 pt-2 text-[9px] font-black uppercase tracking-[.2em] text-white/35">Operação</p>
          {navItems.map((item) => <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }} className={`mb-1 flex h-11 w-full items-center gap-3 px-3 text-sm font-bold transition ${tab === item.id ? "bg-white text-[#173f32]" : "text-white/65 hover:bg-white/8 hover:text-white"}`}><item.icon size={18} /><span className="flex-1 text-left">{item.label}</span>{item.id === "orders" && pendingOrders > 0 && <span className="grid size-5 place-items-center rounded-full bg-[#f45d3d] text-[10px] text-white">{pendingOrders}</span>}</button>)}
        </nav>
        <div className="absolute inset-x-4 bottom-4 border border-white/10 bg-[#0f2f25] p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#f1c85b] text-xs font-black text-[#17352b]">MR</span><div className="min-w-0"><p className="truncate text-xs font-bold text-white">Murilo Rango</p><p className="text-[10px] text-white/40">Administrador</p></div></div><Link href="/" className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-xs font-bold text-white/55 hover:text-white"><ArrowLeft size={14} /> Ver loja</Link></div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#dedfd7] bg-[#fffdf8]/95 px-4 backdrop-blur-md md:px-7 lg:px-9">
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="grid size-10 place-items-center lg:hidden"><Menu /></button><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#f45d3d]">{navItems.find((item) => item.id === tab)?.label}</p><p className="hidden text-xs text-[#687970] sm:block">Quarta-feira, operação do almoço</p></div></div>
          <div className="flex items-center gap-2"><button onClick={() => setSound((value) => !value)} className={`hidden h-10 items-center gap-2 border px-3 text-xs font-bold sm:flex ${sound ? "border-[#b8d5c5] bg-[#edf5f0] text-[#287154]" : "border-[#d8ddd6] text-[#687970]"}`}><Bell size={15} /> Som {sound ? "ligado" : "desligado"}</button><button onClick={() => load(true)} className="grid size-10 place-items-center border border-[#d8ddd6] bg-white" aria-label="Atualizar"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button><span className="grid size-10 place-items-center rounded-full bg-[#173f32] text-xs font-black text-white">MR</span></div>
        </header>

        <main className="p-4 md:p-7 lg:p-9">
          {tab === "dashboard" && data && (
            <div className="animate-rise">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="display-font text-4xl font-bold md:text-5xl">Bom dia, Murilo!</h1><p className="mt-2 text-sm text-[#687970]">A cozinha está rodando. Veja como está o dia até agora.</p></div><button onClick={() => setTab("orders")} className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#f45d3d] px-5 text-sm font-bold text-white">Ver fila de pedidos <ArrowRight size={16} /></button></div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Vendas hoje", value: formatCurrency(data.summary.revenueInCents), note: "+12% vs. quarta passada", icon: CircleDollarSign, color: "text-[#287154] bg-[#e8f3eb]" },
                  { label: "Pedidos", value: String(data.summary.orderCount), note: `${pendingOrders} em andamento`, icon: ShoppingBag, color: "text-[#315d99] bg-[#e9f1ff]" },
                  { label: "Ticket médio", value: formatCurrency(data.summary.averageInCents), note: "Meta: R$ 38,00", icon: TrendingUp, color: "text-[#9a6512] bg-[#fff4d7]" },
                  { label: "Economia em comissão", value: formatCurrency(data.summary.marketplaceSavingsInCents), note: "estimativa de 18%", icon: Trophy, color: "text-[#7b4ca6] bg-[#f2eaff]" },
                ].map((metric) => <article key={metric.label} className="border border-[#dedfd7] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-[#687970]">{metric.label}</p><p className="mt-2 text-2xl font-black">{metric.value}</p></div><span className={`grid size-10 place-items-center ${metric.color}`}><metric.icon size={19} /></span></div><p className="mt-4 text-[11px] font-semibold text-[#87978f]">{metric.note}</p></article>)}
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
                <section className="border border-[#dedfd7] bg-white">
                  <div className="flex items-center justify-between border-b border-[#e2e3dc] px-5 py-4"><div><h2 className="font-black">Pedidos recentes</h2><p className="mt-1 text-xs text-[#687970]">Atualização automática a cada 20s</p></div><button onClick={() => setTab("orders")} className="text-xs font-bold text-[#287154]">Ver todos</button></div>
                  <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#faf9f5] text-[10px] uppercase tracking-[.08em] text-[#87978f]"><tr><th className="px-5 py-3">Pedido</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Canal</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{data.orders.slice(0, 6).map((order) => <tr key={order.id} className="border-t border-[#ecece6]"><td className="px-5 py-4 font-black">#{order.shortId}</td><td className="px-4 py-4"><p className="font-bold">{order.customerName}</p><p className="mt-0.5 text-[10px] text-[#87978f]">{new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></td><td className="px-4 py-4 text-xs text-[#687970]">{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</td><td className="px-4 py-4 font-bold">{formatCurrency(order.totalInCents)}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold ${statusStyle[order.status].className}`}>{statusStyle[order.status].label}</span></td></tr>)}</tbody></table></div>
                </section>

                <div className="grid gap-6">
                  <section className="border border-[#dedfd7] bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-black">Meta do dia</h2><span className="text-xs font-black text-[#287154]">{goalProgress}%</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8e9e3]"><div className="h-full bg-[#287154]" style={{ width: `${goalProgress}%` }} /></div><div className="mt-3 flex justify-between text-xs"><span className="text-[#687970]">{formatCurrency(data.summary.revenueInCents)}</span><strong>{formatCurrency(data.summary.goalInCents)}</strong></div></section>
                  <section className="border border-[#dedfd7] bg-white p-5"><h2 className="font-black">Mais vendidos hoje</h2><div className="mt-5 space-y-4">{data.topProducts.map((product, index) => <div key={product.name} className="flex items-center gap-3"><span className={`grid size-7 place-items-center text-xs font-black ${index === 0 ? "bg-[#f1c85b]" : "bg-[#eef0eb]"}`}>{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{product.name}</p><p className="mt-1 text-[10px] text-[#87978f]">{product.quantity} vendidos</p></div><strong className="text-xs">{formatCurrency(product.revenueInCents)}</strong></div>)}</div></section>
                </div>
              </div>
            </div>
          )}

          {tab === "orders" && data && (
            <div className="animate-rise">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="display-font text-4xl font-bold">Fila de pedidos</h1><p className="mt-2 text-sm text-[#687970]">Mova cada pedido conforme a cozinha avança.</p></div><label className="flex h-11 w-full items-center gap-2 border border-[#d8ddd6] bg-white px-3 md:w-auto md:min-w-64"><Search size={16} className="text-[#87978f]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar nome ou pedido" /></label></div>
              <div className="mt-7 grid gap-5 xl:grid-cols-3">
                {(["received", "preparing", "delivering"] as Status[]).map((columnStatus) => {
                  const orders = visibleOrders.filter((order) => order.status === columnStatus);
                  return <section key={columnStatus} className="min-h-[480px] border border-[#dedfd7] bg-[#eeeee8]"><header className="flex items-center justify-between border-b border-[#d9dcd5] bg-white p-4"><div className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${columnStatus === "received" ? "bg-[#d59a2e]" : columnStatus === "preparing" ? "bg-[#4778b4]" : "bg-[#7b56ac]"}`} /><h2 className="text-sm font-black">{statusStyle[columnStatus].label}</h2></div><span className="grid size-6 place-items-center rounded-full bg-[#eef0eb] text-[10px] font-black">{orders.length}</span></header><div className="space-y-3 p-3">{orders.map((order) => { const next: Status = columnStatus === "received" ? "preparing" : columnStatus === "preparing" ? "delivering" : "completed"; return <article key={order.id} className="border border-[#d9dcd5] bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-black text-[#f45d3d]">#{order.shortId}</p><p className="mt-1 font-black">{order.customerName}</p></div><button className="text-[#87978f]"><MoreHorizontal size={18} /></button></div><div className="mt-4 flex justify-between border-y border-[#e7e8e2] py-3 text-xs"><span className="text-[#687970]">{order.fulfillment === "delivery" ? "Entrega" : "Retirada"} · {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span><strong>{formatCurrency(order.totalInCents)}</strong></div><button disabled={updatingOrder === order.id} onClick={() => changeStatus(order.id, next)} className="mt-4 flex h-10 w-full items-center justify-center gap-2 bg-[#173f32] text-xs font-bold text-white disabled:opacity-60">{updatingOrder === order.id ? "Atualizando..." : columnStatus === "delivering" ? "Marcar como entregue" : `Mover para ${statusStyle[next].label.toLowerCase()}`}<ChevronRight size={15} /></button></article>; })}{!orders.length && <div className="py-16 text-center text-xs text-[#87978f]"><Check className="mx-auto mb-2" />Tudo limpo por aqui</div>}</div></section>;
                })}
              </div>
              <section className="mt-6 border border-[#dedfd7] bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Concluídos hoje</h2><p className="mt-1 text-xs text-[#687970]">{visibleOrders.filter((order) => order.status === "completed").length} pedidos entregues</p></div><PackageCheck className="text-[#287154]" /></div></section>
            </div>
          )}

          {tab === "menu" && (
            <div className="animate-rise">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#f45d3d]">Quarta-feira</p><h1 className="display-font mt-2 text-4xl font-bold">Cardápio do dia</h1><p className="mt-2 text-sm text-[#687970]">Edite disponibilidade e publique em todos os canais.</p></div><button onClick={() => { setMenuPublished((value) => !value); setToast(menuPublished ? "Cardápio retirado do ar" : "Cardápio publicado com sucesso"); }} className={`flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold ${menuPublished ? "border-2 border-[#287154] text-[#287154]" : "bg-[#f45d3d] text-white"}`}>{menuPublished ? <><Check size={17} /> Publicado</> : "Publicar cardápio"}</button></div>
              <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_330px]">
                <section className="border border-[#dedfd7] bg-white"><div className="flex items-center justify-between border-b border-[#e1e3dc] p-5"><div><h2 className="font-black">Pratos de hoje</h2><p className="mt-1 text-xs text-[#687970]">{dailyProductIds.length} itens selecionados</p></div><button className="flex items-center gap-2 text-xs font-bold text-[#287154]"><Plus size={15} /> Adicionar item</button></div><div className="divide-y divide-[#e8e9e3]">{products.filter((product) => dailyProductIds.includes(product.id)).map((product) => <div key={product.id} className="flex items-center gap-4 p-4 sm:p-5"><img src={product.imageUrl} alt="" className="size-16 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{product.name}</p><p className="mt-1 text-xs text-[#687970]">{formatCurrency(product.priceInCents)} · {product.prepMinutes} min</p></div><button onClick={() => toggleProduct(product.id)} className={`relative h-7 w-12 rounded-full transition ${activeProducts[product.id] ? "bg-[#287154]" : "bg-[#c9cdc7]"}`} aria-label="Alternar disponibilidade"><span className={`absolute top-1 size-5 rounded-full bg-white transition ${activeProducts[product.id] ? "left-6" : "left-1"}`} /></button><span className={`hidden w-20 text-right text-[10px] font-bold sm:block ${activeProducts[product.id] ? "text-[#287154]" : "text-[#b6402b]"}`}>{activeProducts[product.id] ? "Disponível" : "Esgotado"}</span></div>)}</div></section>
                <div className="space-y-6"><section className="border border-[#dedfd7] bg-white p-5"><h2 className="font-black">Publicação</h2><div className="mt-5 space-y-4 text-xs"><div className="flex justify-between"><span className="text-[#687970]">Status</span><strong className="text-[#287154]">{menuPublished ? "No ar" : "Rascunho"}</strong></div><div className="flex justify-between"><span className="text-[#687970]">Última edição</span><strong>Hoje, 9h42</strong></div><div className="flex justify-between"><span className="text-[#687970]">Agendado</span><strong>10h30</strong></div></div></section><section className="bg-[#173f32] p-5 text-white"><Bell className="text-[#f1c85b]" /><h3 className="mt-4 font-black">Avisar clientes</h3><p className="mt-2 text-xs leading-5 text-white/55">Envie o cardápio de hoje para os 248 clientes que aceitaram receber novidades.</p><button onClick={() => setToast("Campanha agendada para 10h30")} className="mt-4 h-10 w-full bg-[#f1c85b] text-xs font-black text-[#17352b]">Agendar notificação</button></section></div>
              </div>
            </div>
          )}

          {tab === "promotions" && (
            <div className="animate-rise"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="display-font text-4xl font-bold">Promoções</h1><p className="mt-2 text-sm text-[#687970]">Crie ofertas mensuráveis e acompanhe cada resgate.</p></div><button className="flex h-11 items-center gap-2 rounded-full bg-[#f45d3d] px-5 text-sm font-bold text-white"><Plus size={16} /> Nova promoção</button></div><div className="mt-7 grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><section className="border border-[#dedfd7] bg-white p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row"><div className="flex gap-4"><div className="grid size-12 place-items-center bg-[#f1c85b]"><Percent /></div><div><div className="flex items-center gap-2"><h2 className="font-black">Quarta da Feijoada</h2><span className="rounded-full bg-[#e8f3eb] px-2 py-1 text-[9px] font-bold text-[#287154]">ATIVA</span></div><p className="mt-1 text-xs text-[#687970]">Cupom FEIJOADA20 · 20% OFF</p></div></div><button onClick={() => setPromoActive((value) => !value)} className={`relative h-7 w-12 rounded-full ${promoActive ? "bg-[#287154]" : "bg-[#c9cdc7]"}`}><span className={`absolute top-1 size-5 rounded-full bg-white transition ${promoActive ? "left-6" : "left-1"}`} /></button></div><div className="mt-7 grid grid-cols-3 gap-4 border-t border-[#e3e4de] pt-6"><div><p className="text-[10px] uppercase text-[#87978f]">Resgates</p><p className="mt-1 text-xl font-black">7 <span className="text-xs text-[#87978f]">/ 20</span></p></div><div><p className="text-[10px] uppercase text-[#87978f]">Receita</p><p className="mt-1 text-xl font-black">R$ 178</p></div><div><p className="text-[10px] uppercase text-[#87978f]">Conversão</p><p className="mt-1 text-xl font-black">18,4%</p></div></div><div className="mt-5 h-2 rounded-full bg-[#e5e6e0]"><div className="h-full w-[35%] rounded-full bg-[#f45d3d]" /></div></section><section className="border-2 border-dashed border-[#cdd1ca] p-6 text-center"><Gift className="mx-auto text-[#87978f]" /><h3 className="mt-4 font-black">Indique e ganhe</h3><p className="mt-2 text-xs leading-5 text-[#687970]">Ative a campanha de indicação e recompense clientes fiéis.</p><button onClick={() => setToast("Campanha de indicação ativada")} className="mt-5 border border-[#173f32] px-5 py-2.5 text-xs font-bold">Ativar campanha</button></section></div></div>
          )}

          {tab === "customers" && data && (
            <div className="animate-rise"><div><h1 className="display-font text-4xl font-bold">Clientes</h1><p className="mt-2 text-sm text-[#687970]">Conheça quem compra, quem voltou e quem precisa de um lembrete.</p></div><div className="mt-7 grid gap-4 sm:grid-cols-3"><article className="border border-[#dedfd7] bg-white p-5"><UserRound className="text-[#287154]" /><p className="mt-4 text-3xl font-black">{data.summary.customers}</p><p className="mt-1 text-xs text-[#687970]">clientes cadastrados</p></article><article className="border border-[#dedfd7] bg-white p-5"><RefreshCw className="text-[#315d99]" /><p className="mt-4 text-3xl font-black">68%</p><p className="mt-1 text-xs text-[#687970]">voltaram em 30 dias</p></article><article className="border border-[#dedfd7] bg-white p-5"><Clock3 className="text-[#f45d3d]" /><p className="mt-4 text-3xl font-black">24</p><p className="mt-1 text-xs text-[#687970]">clientes para reativar</p></article></div><section className="mt-6 border border-[#dedfd7] bg-white"><div className="flex items-center justify-between border-b border-[#e3e4de] p-5"><h2 className="font-black">Segmentos inteligentes</h2><button className="text-xs font-bold text-[#287154]">Exportar CSV</button></div>{[{ name: "Fãs do Rango", desc: "5 ou mais pedidos nos últimos 60 dias", count: 86, color: "bg-[#e8f3eb] text-[#287154]" },{ name: "Sumidos há 15 dias", desc: "Compravam com frequência e pararam", count: 24, color: "bg-[#fff0e9] text-[#b6402b]" },{ name: "Aniversariantes do mês", desc: "Prontos para receber um mimo", count: 11, color: "bg-[#fff4d7] text-[#8d6413]" }].map((segment) => <div key={segment.name} className="flex flex-col justify-between gap-4 border-b border-[#e8e9e3] p-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-[10px] font-black ${segment.color}`}>{segment.count} CLIENTES</span><h3 className="font-black">{segment.name}</h3></div><p className="mt-2 text-xs text-[#687970]">{segment.desc}</p></div><button onClick={() => setToast(`Campanha criada para “${segment.name}”`)} className="flex items-center gap-2 text-xs font-bold text-[#287154]"><MessageCircle size={15} /> Criar campanha</button></div>)}</section></div>
          )}

          {tab === "companies" && (
            <div className="animate-rise"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="display-font text-4xl font-bold">Contas corporativas</h1><p className="mt-2 text-sm text-[#687970]">Pedidos recorrentes e faturamento mensal para empresas.</p></div><button className="flex h-11 items-center gap-2 rounded-full bg-[#f45d3d] px-5 text-sm font-bold text-white"><Plus size={16} /> Nova empresa</button></div><div className="mt-7 grid gap-5 lg:grid-cols-3">{[{ name: "Oficina Avenida", meals: 44, bill: 139480, contact: "Carlos" },{ name: "Agro Junqueira", meals: 28, bill: 89320, contact: "Fernanda" },{ name: "Contábil Centro", meals: 18, bill: 57420, contact: "Lucas" }].map((company) => <article key={company.name} className="border border-[#dedfd7] bg-white p-6"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center bg-[#eef5f0] text-[#287154]"><Building2 size={21} /></span><span className="rounded-full bg-[#e8f3eb] px-2.5 py-1 text-[9px] font-black text-[#287154]">ATIVA</span></div><h2 className="mt-5 font-black">{company.name}</h2><p className="mt-1 text-xs text-[#687970]">Contato: {company.contact}</p><div className="mt-5 grid grid-cols-2 gap-4 border-y border-[#e3e4de] py-4"><div><p className="text-[10px] text-[#87978f]">Marmitas/mês</p><p className="mt-1 font-black">{company.meals}</p></div><div><p className="text-[10px] text-[#87978f]">Fatura atual</p><p className="mt-1 font-black">{formatCurrency(company.bill)}</p></div></div><button className="mt-5 flex w-full items-center justify-center gap-2 border border-[#173f32] py-2.5 text-xs font-bold">Ver conta <ArrowRight size={14} /></button></article>)}</div></div>
          )}

          {tab === "settings" && (
            <div className="animate-rise"><div><h1 className="display-font text-4xl font-bold">Configurações</h1><p className="mt-2 text-sm text-[#687970]">Informações públicas, entrega e operação.</p></div><div className="mt-7 grid gap-6 xl:grid-cols-2"><section className="border border-[#dedfd7] bg-white p-6"><div className="flex items-center gap-3"><Store className="text-[#287154]" /><h2 className="font-black">Dados da loja</h2></div><div className="mt-6 grid gap-4"><label className="grid gap-1.5 text-xs font-bold">Nome da loja<input className="h-11 border border-[#d8ddd6] px-3 text-sm outline-none" defaultValue="Rango Restaurante e Petiscaria" /></label><label className="grid gap-1.5 text-xs font-bold">Endereço oficial<input className="h-11 border border-[#d8ddd6] px-3 text-sm outline-none" defaultValue="Rua das Oliveiras, 300 — Centro" /></label><label className="grid gap-1.5 text-xs font-bold">WhatsApp<input className="h-11 border border-[#d8ddd6] px-3 text-sm outline-none" defaultValue="(18) 99999-0109" /></label><button onClick={() => setToast("Dados da loja salvos")} className="mt-2 h-11 w-fit rounded-full bg-[#173f32] px-5 text-xs font-bold text-white">Salvar alterações</button></div></section><section className="border border-[#dedfd7] bg-white p-6"><div className="flex items-center gap-3"><Bike className="text-[#f45d3d]" /><h2 className="font-black">Taxas de entrega</h2></div><div className="mt-6 divide-y divide-[#e5e6e0]">{[{ area: "Centro", fee: "Grátis" },{ area: "Jardim Paulista", fee: "R$ 3,50" },{ area: "Vila Beatriz", fee: "R$ 4,50" },{ area: "Outros bairros", fee: "R$ 6,50" }].map((area) => <div key={area.area} className="flex items-center justify-between py-4"><div><p className="text-sm font-bold">{area.area}</p><p className="mt-1 text-[10px] text-[#87978f]">Ativa</p></div><button className="border border-[#d8ddd6] px-3 py-2 text-xs font-bold">{area.fee}</button></div>)}</div><button onClick={() => setToast("Regras de entrega salvas")} className="mt-5 h-11 w-fit rounded-full bg-[#173f32] px-5 text-xs font-bold text-white">Salvar taxas</button></section></div></div>
          )}
        </main>
      </div>
    </div>
  );
}
