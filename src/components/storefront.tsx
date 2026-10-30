"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Bell,
  Bike,
  Camera,
  Check,
  Clock3,
  Copy,
  CreditCard,
  Gift,
  Heart,
  MapPin,
  Menu,
  Minus,
  Navigation,
  Phone,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trophy,
  User,
  X,
} from "lucide-react";
import { RangoLogo } from "@/components/rango-logo";
import { PlansCarousel } from "@/components/plans-carousel";
import {
  categories,
  formatCurrency,
  heroImage,
  neighborhoods,
  products,
  type Product,
} from "@/lib/store-data";

type CartLine = { product: Product; quantity: number };
type CheckoutStage = "cart" | "details" | "payment" | "success";
type Account = { id: number; name: string; phone: string; points: number; tier: string };
type OrderResult = {
  id: string;
  shortId: string;
  estimatedAt: string;
  totalInCents: number;
  earnedPoints: number;
  customerPoints: number;
};

const inputClass =
  "h-13 w-full border border-[#d8ddd6] bg-white px-4 text-base text-[#17352b] outline-none transition focus:border-[#287154]";

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Rango+Restaurante+e+Petiscaria+Rua+Sao+Salvador+Junqueiropolis+SP";

function calculateStoreStatus() {
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const lunch = day >= 1 && day <= 6 && minutes >= 600 && minutes < 840;
  const night = day >= 2 && day <= 6 && minutes >= 1080 && minutes < 1380;
  if (lunch) return { open: true, label: "Aberto", detail: "almoço até 14h" };
  if (night) return { open: true, label: "Aberto", detail: "petiscaria até 23h" };
  if (day >= 1 && day <= 6 && minutes < 600) return { open: false, label: "Abre às 10h", detail: "hoje" };
  if (day >= 2 && day <= 6 && minutes >= 840) return { open: false, label: "Abre às 18h", detail: "petiscaria" };
  return { open: false, label: "Fechado", detail: "seg–sáb, 10h" };
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return (
    <article className="group overflow-hidden border border-[#e0e1da] bg-white">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#ece9e1]">
        <img className="food-image h-full w-full object-cover" src={product.imageUrl} alt={product.name} loading="lazy" />
        {product.badge && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#fffdf8] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.06em] text-[#173f32]">
            {product.badge}
          </span>
        )}
        <button
          type="button"
          aria-label={`Favoritar ${product.name}`}
          className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-white/95 text-[#173f32]"
        >
          <Heart size={16} />
        </button>
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-[15px] font-black leading-tight sm:text-[16px]">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#7b8a83]">{product.description}</p>
        <div className="mt-3 flex flex-col gap-2.5">
          <span className="text-[17px] font-black leading-none text-[#173f32]">{formatCurrency(product.priceInCents)}</span>
          <button
            type="button"
            onClick={() => onAdd(product)}
            aria-label={`Adicionar ${product.name}`}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#173f32] px-3 text-[13px] font-bold text-white active:scale-95"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}

export function Storefront() {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState<CheckoutStage>("cart");
  const [category, setCategory] = useState("destaques");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [storeStatus, setStoreStatus] = useState({ open: false, label: "…", detail: "" });
  const [countdown, setCountdown] = useState("05:42:18");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [neighborhood, setNeighborhood] = useState(neighborhoods[0].name);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [payment, setPayment] = useState<"pix" | "card" | "cash">("pix");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [loginStep, setLoginStep] = useState<"phone" | "code">("phone");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rango-cart");
      if (saved) setCart(JSON.parse(saved) as CartLine[]);
      const savedAccount = localStorage.getItem("rango-account");
      if (savedAccount) setAccount(JSON.parse(savedAccount) as Account);
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (cartHydrated) localStorage.setItem("rango-cart", JSON.stringify(cart));
  }, [cart, cartHydrated]);

  useEffect(() => {
    const update = () => setStoreStatus(calculateStoreStatus());
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const update = () => {
      const remaining = Math.max(0, end.getTime() - Date.now());
      const h = Math.floor(remaining / 3_600_000);
      const m = Math.floor((remaining % 3_600_000) / 60_000);
      const s = Math.floor((remaining % 60_000) / 1000);
      setCountdown([h, m, s].map((value) => String(value).padStart(2, "0")).join(":"));
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + line.product.priceInCents * line.quantity, 0);
  const selectedNeighborhood = neighborhoods.find((item) => item.name === neighborhood) ?? neighborhoods[0];
  const deliveryFee = fulfillment === "delivery" ? selectedNeighborhood.feeInCents : 0;
  const feijoadaSubtotal = cart
    .filter((line) => line.product.id === 4)
    .reduce((total, line) => total + line.product.priceInCents * line.quantity, 0);
  const discount = couponApplied ? Math.round(feijoadaSubtotal * 0.2) : 0;
  const total = subtotal + deliveryFee - discount;

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const categoryMatch = category === "destaques" ? product.featured : product.categoryId === Number(category);
      const searchMatch = !term || `${product.name} ${product.description}`.toLocaleLowerCase("pt-BR").includes(term);
      return categoryMatch && searchMatch;
    });
  }, [category, search]);

  function addProduct(product: Product) {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (found) return current.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      return [...current, { product, quantity: 1 }];
    });
    setToast(`${product.name} na sacola`);
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((current) =>
      current
        .map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0),
    );
  }

  function openCart() {
    setCheckoutStage("cart");
    setCartOpen(true);
  }

  function activatePromotion() {
    const feijoada = products.find((product) => product.id === 4)!;
    if (!cart.some((line) => line.product.id === 4)) addProduct(feijoada);
    setCouponCode("FEIJOADA20");
    setCouponApplied(true);
    setCheckoutStage("cart");
    setCartOpen(true);
    setToast("Cupom aplicado");
  }

  function applyCoupon() {
    if (couponCode.trim().toUpperCase() === "FEIJOADA20" && feijoadaSubtotal > 0) {
      setCouponApplied(true);
      setToast("20% OFF na feijoada");
    } else {
      setCouponApplied(false);
      setToast(feijoadaSubtotal === 0 ? "Adicione a feijoada" : "Cupom inválido");
    }
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          fulfillment,
          neighborhood,
          deliveryAddress: fulfillment === "delivery" ? `${street}, ${number} — ${neighborhood}, Junqueirópolis/SP` : undefined,
          paymentMethod: payment,
          couponCode: couponApplied ? "FEIJOADA20" : undefined,
          notes,
          marketingConsent,
          items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        }),
      });
      const data = (await response.json()) as OrderResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar o pedido.");
      setOrderResult(data);
      setCheckoutStage("success");
      setCart([]);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Erro ao fechar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoginLoading(true);
    try {
      if (loginStep === "phone") {
        const response = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send", phone: loginPhone }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error);
        setLoginStep("code");
        setToast("Use o código 1234");
      } else {
        const response = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", phone: loginPhone, name: loginName, code: loginCode }),
        });
        const data = (await response.json()) as { error?: string; customer?: Account };
        if (!response.ok || !data.customer) throw new Error(data.error ?? "Código inválido.");
        setAccount(data.customer);
        localStorage.setItem("rango-account", JSON.stringify(data.customer));
        setCustomerName(data.customer.name);
        setCustomerPhone(data.customer.phone);
        setLoginOpen(false);
        setToast("Bem-vindo!");
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffdf8] pb-[68px] md:pb-0">
      {toast && (
        <div className="fixed left-1/2 top-[84px] z-[80] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full bg-[#173f32] px-5 py-3 text-sm font-bold text-white shadow-xl animate-rise">
          <Check size={16} className="shrink-0 text-[#f1c85b]" /> {toast}
        </div>
      )}

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e6e6df] bg-[#fffdf8]">
        <div className="shell flex h-[64px] items-center justify-between gap-2 min-[400px]:gap-3">
          <RangoLogo size={38} />
          <nav className="hidden items-center gap-6 lg:flex">
            <a className="text-sm font-bold text-[#52665c]" href="#cardapio">Cardápio</a>
            <a className="text-sm font-bold text-[#52665c]" href="#promocoes">Promoções</a>
            <a className="text-sm font-bold text-[#52665c]" href="#clube">Clube</a>
            <a className="text-sm font-bold text-[#52665c]" href="#local">Onde estamos</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (account ? router.push(`/conta?phone=${account.phone}`) : setLoginOpen(true))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e0e1da]"
              aria-label="Minha conta"
            >
              <User size={19} />
            </button>
            <button
              type="button"
              onClick={openCart}
              className="relative flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#f45d3d] px-3.5 text-sm font-bold text-white min-[400px]:px-4"
              aria-label="Abrir sacola"
            >
              <ShoppingBag size={18} /> <span className="hidden min-[400px]:inline">Sacola</span>
              {cartCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#f45d3d]">{cartCount}</span>}
            </button>
            <button onClick={() => setMenuOpen((value) => !value)} className="grid size-11 place-items-center lg:hidden" aria-label="Abrir menu">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-[#e6e6df] px-5 py-3 lg:hidden animate-rise">
            {[["Cardápio", "#cardapio"], ["Promoções", "#promocoes"], ["Clube Rango", "#clube"], ["Onde estamos", "#local"]].map(([label, href]) => (
              <a key={href} onClick={() => setMenuOpen(false)} className="flex h-12 items-center justify-between border-b border-[#eeeeea] font-bold" href={href}>
                {label} <ArrowRight size={17} />
              </a>
            ))}
            <a href="tel:+5518999990109" className="mt-3 flex h-12 items-center gap-2 font-bold text-[#287154]"><Phone size={18} /> (18) 99999-0109</a>
          </nav>
        )}
      </header>

      <main>
        <section id="inicio" className="bg-[#f7f1e7] pt-[64px]">
          <div className="shell py-8 md:grid md:min-h-[620px] md:grid-cols-[.92fr_1.08fr] md:items-center md:gap-12 md:py-16">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d8c9] bg-[#fffdf8] px-3 py-1.5 text-[11px] font-black uppercase tracking-[.06em]">
                <span className={`size-2 rounded-full ${storeStatus.open ? "status-pulse bg-[#287154]" : "bg-[#b36a58]"}`} />
                {storeStatus.label} · {storeStatus.detail}
              </div>
              <h1 className="display-font mt-4 text-[clamp(2.9rem,13vw,5.6rem)] font-bold leading-[.88]">
                Comida<br />de verdade.<br /><span className="italic text-[#287154]">Todo dia.</span>
              </h1>
              <p className="mt-4 max-w-md text-[17px] leading-6 text-[#5e7067]">
                Marmita caprichada, buffet fresquinho e feijoada às quartas.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <a href="#cardapio" className="flex h-13 items-center justify-center gap-2 rounded-full bg-[#f45d3d] px-6 text-[15px] font-bold text-white">
                  Ver cardápio de hoje <ArrowRight size={18} />
                </a>
                <button onClick={openCart} className="flex h-13 items-center justify-center gap-2 rounded-full border-2 border-[#173f32] px-6 text-[15px] font-bold">
                  <ShoppingBag size={18} /> Fazer pedido
                </button>
              </div>
            </div>

            <div className="relative mt-8 h-[340px] sm:h-[400px] md:mt-0 md:h-auto md:min-h-[520px]">
              <div className="absolute inset-3 rotate-2 bg-[#f1c85b] md:inset-7" />
              <div className="absolute inset-0 -rotate-1 overflow-hidden border-[6px] border-[#fffdf8] bg-[#ddd] strong-shadow">
                <img src={heroImage} alt="Mesa com comida brasileira caseira" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-3 left-2 flex items-center gap-2.5 bg-[#fffdf8] p-3 shadow-xl">
                <div className="grid size-9 place-items-center rounded-full bg-[#f1c85b]"><Star size={17} fill="currentColor" /></div>
                <div>
                  <strong className="block text-sm leading-none">4,8 no Google</strong>
                  <span className="text-[10px] text-[#687970]">47 avaliações</span>
                </div>
              </div>
              <div className="absolute -right-1 top-5 bg-[#173f32] px-4 py-3 text-white shadow-xl">
                <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#f1c85b]">Hoje</p>
                <p className="display-font text-xl font-bold leading-tight">Feijoada!</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e0e1da] bg-[#173f32] text-white">
          <div className="shell grid grid-cols-3 divide-x divide-white/10 py-3">
            {[
              ["Almoço", "seg–sáb, 10–14h"],
              ["Petiscaria", "ter–sáb, 18–23h"],
              ["Entrega", "Centro grátis"],
            ].map(([title, text]) => (
              <div key={title} className="px-2 text-center first:pl-0 last:pr-0">
                <p className="text-[11px] font-black uppercase tracking-[.06em] text-[#f1c85b]">{title}</p>
                <p className="mt-0.5 text-[10px] text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cardapio" className="scroll-mt-20 py-12 md:py-20">
          <div className="shell">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f45d3d]">Hoje</p>
                <h2 className="display-font mt-1.5 text-[2.4rem] font-bold leading-none md:text-[3.6rem]">Cardápio</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#287154]"><Clock3 size={15} /> atualizado 9h42</div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <label className="flex h-12 items-center gap-2 border border-[#e0e1da] bg-white px-3.5">
                <Search size={18} className="text-[#87978f]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar prato" className="w-full bg-transparent text-base outline-none" />
              </label>
              <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                <button onClick={() => setCategory("destaques")} className={`h-10 shrink-0 rounded-full px-4 text-sm font-bold ${category === "destaques" ? "bg-[#173f32] text-white" : "border border-[#e0e1da] bg-white text-[#52665c]"}`}>Destaques</button>
                {categories.map((item) => (
                  <button key={item.id} onClick={() => setCategory(String(item.id))} className={`h-10 shrink-0 rounded-full px-4 text-sm font-bold ${category === String(item.id) ? "bg-[#173f32] text-white" : "border border-[#e0e1da] bg-white text-[#52665c]"}`}>{item.name}</button>
                ))}
              </div>
            </div>

            {visibleProducts.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addProduct} />)}
              </div>
            ) : (
              <div className="mt-8 border border-dashed border-[#c6cec8] py-12 text-center">
                <Search className="mx-auto text-[#87978f]" />
                <p className="mt-3 font-bold">Nada por aqui.</p>
                <button onClick={() => setSearch("")} className="mt-2 h-11 px-4 text-sm font-bold text-[#f45d3d]">Limpar busca</button>
              </div>
            )}
          </div>
        </section>

        <section id="promocoes" className="scroll-mt-20 bg-[#f1c85b] py-12 md:py-16">
          <div className="shell">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#173f32] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.08em] text-white">
              <Sparkles size={13} className="text-[#f1c85b]" /> Hoje só
            </div>
            <h2 className="display-font mt-4 text-[2.9rem] font-bold leading-[.92] md:text-[5rem]">
              Feijoada<br /><span className="text-[#f45d3d]">20% OFF.</span>
            </h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button onClick={activatePromotion} className="flex h-13 items-center gap-2 rounded-full bg-[#f45d3d] px-6 text-[15px] font-bold text-white">
                Usar cupom <ArrowRight size={18} />
              </button>
              <button onClick={() => { navigator.clipboard?.writeText("FEIJOADA20"); setToast("Cupom copiado"); }} className="flex h-13 items-center gap-2 rounded-full border-2 border-[#173f32] px-5 text-[15px] font-bold">
                <Copy size={17} /> FEIJOADA20
              </button>
            </div>

            <div className="mt-7 border-2 border-[#173f32] bg-[#fffdf8] p-5 shadow-[8px_8px_0_#173f32]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#687970]">Termina em</p>
                  <p className="mt-1 font-mono text-[1.7rem] sm:text-[2.2rem] font-black leading-none tracking-tight whitespace-nowrap">{countdown}</p>
                </div>
                <div className="text-right min-w-[110px]">
                  <p className="text-sm text-[#8b8676] line-through">R$ 31,90</p>
                  <p className="mt-1 display-font text-[1.7rem] sm:text-[2.2rem] font-bold leading-none text-[#17352b]">R$ 25,52</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e4e0d3]"><div className="h-full w-[65%] bg-[#f45d3d]" /></div>
              <p className="mt-2 text-xs font-bold text-[#687970]">13 de 20 cupons restantes</p>
            </div>
          </div>
        </section>

        <section id="clube" className="scroll-mt-20 bg-[#173f32] py-12 text-white md:py-20">
          <div className="shell">
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f1c85b]">Clube Rango</p>
            <h2 className="display-font mt-3 text-[2.6rem] font-bold leading-[.95] md:text-[4.4rem]">
              10 pedidos.<br />A 11ª é por nossa conta.
            </h2>

            <div className="mt-7 border border-white/15 bg-[#0f2f25] p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-[#f1c85b] text-[#17352b]"><Trophy size={22} /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#f1c85b]">Seu progresso</p>
                  <p className="display-font text-2xl font-bold leading-tight">8 de 10 pontos</p>
                </div>
                <span className="rounded-full border border-[#f1c85b]/50 px-3 py-1.5 text-[10px] font-bold text-[#f1c85b]">Ouro</span>
              </div>
              <div className="mt-4 grid grid-cols-10 gap-1.5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className={`grid aspect-square place-items-center text-xs font-black ${index < 8 ? "bg-[#f1c85b] text-[#17352b]" : "border border-white/25 text-white/40"}`}>
                    {index < 8 ? <Check size={13} /> : index + 1}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs font-bold text-white/70">Faltam <span className="text-[#f1c85b]">2 pedidos</span></p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {([
                { icon: Gift, label: "10ª grátis" },
                { icon: Bell, label: "Ofertas" },
                { icon: Star, label: "Aniversário" },
              ]).map((benefit) => (
                <div key={benefit.label} className="border border-white/10 p-3 text-center">
                  <benefit.icon className="mx-auto text-[#f1c85b]" size={19} />
                  <p className="mt-2 text-[11px] font-bold">{benefit.label}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setLoginOpen(true)} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#f1c85b] text-[15px] font-bold text-[#17352b]">
              Entrar no clube <ArrowRight size={18} />
            </button>
          </div>
        </section>

        <PlansCarousel />

        <section id="local" className="scroll-mt-20 py-12 md:py-20">
          <div className="shell">
            <h2 className="display-font text-[2.4rem] font-bold leading-none md:text-[3.6rem]">Onde estamos</h2>
            <div className="mt-5 border border-[#e0e1da] bg-white">
              <div className="relative h-44 overflow-hidden bg-[#e9e7df]">
                <div className="absolute inset-0 opacity-70 dot-pattern" />
                <div className="absolute left-[26%] top-[10%] h-[80%] w-2 rotate-12 bg-white" />
                <div className="absolute left-[58%] top-[4%] h-[92%] w-2.5 -rotate-[22deg] bg-white" />
                <div className="absolute left-[6%] top-[52%] h-2.5 w-[88%] -rotate-6 bg-white" />
                <div className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#f45d3d] text-white shadow-xl"><MapPin size={26} /></div>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 shrink-0 text-[#287154]" size={19} />
                  <div>
                    <p className="font-black">Rua das Oliveiras, 300 — Centro</p>
                    <p className="mt-1 text-sm text-[#7b8a83]">Junqueirópolis/SP · CEP 17890-000</p>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <Clock3 className="mt-0.5 shrink-0 text-[#287154]" size={19} />
                  <div className="text-sm">
                    <p><strong>Almoço</strong> seg–sáb · 10h às 14h</p>
                    <p className="mt-1"><strong>Petiscaria</strong> ter–sáb · 18h às 23h</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Star className="shrink-0 text-[#f1c85b]" size={19} fill="currentColor" />
                  <p className="text-sm"><strong>4,8 no Google</strong> · 47 avaliações · R$ 20–40 por pessoa</p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <a href={MAPS_URL} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#173f32] text-sm font-bold text-white">
                    <Navigation size={17} /> Google Maps
                  </a>
                  <a href="tel:+5518999990109" className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#173f32] text-sm font-bold">
                    <Phone size={17} /> Ligar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0f2f25] px-0 py-10 text-white">
        <div className="shell">
          <RangoLogo inverse size={38} />
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-white/60">
            <a href="tel:+5518999990109">(18) 99999-0109</a>
            <a href={MAPS_URL} target="_blank" rel="noreferrer">Google Maps</a>
            <a href="https://www.instagram.com/" className="flex items-center gap-1.5"><Camera size={15} /> @demonstracao</a>
            <a href="/admin">Painel</a>
          </div>
          <p className="mt-7 text-[11px] text-white/35">© 2026 Rango Restaurante e Petiscaria · Junqueirópolis/SP</p>
          <p className="mt-1 text-[10px] text-white/20">
            <a
              href="https://wa.me/5518998133524"
              target="_blank"
              rel="noreferrer"
              aria-label="Falar com Murilo Mota no WhatsApp"
              className="transition-colors hover:text-[#f1c85b]"
            >
              Desenvolvido por Murilo Mota · 55 (18) 99813-3524
            </a>
          </p>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[64px] grid-cols-4 border-t border-[#e0e1da] bg-[#fffdf8] md:hidden">
        {([
          { label: "Início", href: "#inicio", icon: Store },
          { label: "Cardápio", href: "#cardapio", icon: ShoppingBag },
          { label: "Clube", href: "#clube", icon: Trophy },
          { label: "Local", href: "#local", icon: MapPin },
        ]).map((item, index) => (
          <a key={item.label} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${index === 0 ? "text-[#287154]" : "text-[#7b8a83]"}`}>
            <item.icon size={20} /> {item.label}
          </a>
        ))}
      </nav>

      {cartOpen && (
        <div className="fixed inset-0 z-[70] bg-[#0f2f25]/55" onMouseDown={(event) => { if (event.currentTarget === event.target) setCartOpen(false); }}>
          <aside className="ml-auto flex h-full w-full max-w-[520px] flex-col bg-[#fffdf8] shadow-2xl animate-slide-in">
            <div className="flex h-[64px] items-center justify-between border-b border-[#e0e1da] px-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#f45d3d]">{checkoutStage === "success" ? "Confirmado" : "Seu pedido"}</p>
                <h2 className="display-font text-xl font-bold">{checkoutStage === "cart" ? "Sacola" : checkoutStage === "details" ? "Entrega" : checkoutStage === "payment" ? "Pagamento" : "Tudo certo!"}</h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="grid size-10 place-items-center rounded-full border border-[#e0e1da]" aria-label="Fechar"><X size={19} /></button>
            </div>

            {checkoutStage !== "success" && (
              <div className="grid grid-cols-3 border-b border-[#e0e1da] px-5 py-2.5">
                {["Sacola", "Entrega", "Pagamento"].map((label, index) => {
                  const activeIndex = checkoutStage === "cart" ? 0 : checkoutStage === "details" ? 1 : 2;
                  return (
                    <div key={label} className={`flex items-center gap-1.5 text-[11px] font-bold ${index <= activeIndex ? "text-[#287154]" : "text-[#a5ada8]"}`}>
                      <span className={`grid size-5 place-items-center rounded-full text-[10px] ${index <= activeIndex ? "bg-[#287154] text-white" : "bg-[#e5e7e2]"}`}>{index + 1}</span>
                      {label}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              {checkoutStage === "cart" && (
                <div>
                  {!cart.length ? (
                    <div className="py-16 text-center">
                      <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f0eadf] text-[#687970]"><ShoppingBag size={28} /></div>
                      <h3 className="display-font mt-4 text-2xl font-bold">Sacola vazia</h3>
                      <button onClick={() => setCartOpen(false)} className="mt-5 h-12 rounded-full bg-[#173f32] px-6 text-sm font-bold text-white">Escolher meu almoço</button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {cart.map((line) => (
                          <div key={line.product.id} className="flex gap-3 border-b border-[#e6e6df] pb-3">
                            <img src={line.product.imageUrl} alt="" className="size-16 object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold">{line.product.name}</p>
                              <div className="mt-2 flex w-fit items-center border border-[#e0e1da]">
                                <button onClick={() => updateQuantity(line.product.id, -1)} className="grid size-11 place-items-center" aria-label="Remover"><Minus size={16} /></button>
                                <span className="grid min-w-9 place-items-center text-sm font-bold">{line.quantity}</span>
                                <button onClick={() => updateQuantity(line.product.id, 1)} className="grid size-11 place-items-center" aria-label="Adicionar"><Plus size={16} /></button>
                              </div>
                            </div>
                            <strong className="text-sm">{formatCurrency(line.product.priceInCents * line.quantity)}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Cupom" className="h-12 flex-1 border border-[#e0e1da] bg-white px-3 text-base uppercase outline-none" />
                        <button onClick={applyCoupon} className="h-12 border border-[#173f32] px-4 text-sm font-bold">Aplicar</button>
                      </div>
                      {couponApplied && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#287154]"><Check size={14} /> FEIJOADA20 aplicado</p>}
                    </>
                  )}
                </div>
              )}

              {checkoutStage === "details" && (
                <div className="animate-rise">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => setFulfillment("delivery")} className={`flex items-center gap-2.5 border p-3 text-left ${fulfillment === "delivery" ? "border-[#287154] bg-[#eef5f0]" : "border-[#e0e1da]"}`}>
                      <Bike size={21} /><span><strong className="block text-sm">Entrega</strong><small className="text-[#7b8a83]">Receber</small></span>
                    </button>
                    <button onClick={() => setFulfillment("pickup")} className={`flex items-center gap-2.5 border p-3 text-left ${fulfillment === "pickup" ? "border-[#287154] bg-[#eef5f0]" : "border-[#e0e1da]"}`}>
                      <Store size={21} /><span><strong className="block text-sm">Retirada</strong><small className="text-[#7b8a83]">Balcão</small></span>
                    </button>
                  </div>
                  <div className="mt-5 grid gap-3.5">
                    <label className="grid gap-1.5 text-xs font-bold">Nome<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} className={inputClass} placeholder="Seu nome" /></label>
                    <label className="grid gap-1.5 text-xs font-bold">WhatsApp<input required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className={inputClass} placeholder="(18) 99999-9999" inputMode="tel" /></label>
                    {fulfillment === "delivery" && (
                      <>
                        <label className="grid gap-1.5 text-xs font-bold">Bairro<select value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className={inputClass}>{neighborhoods.map((item) => <option key={item.name}>{item.name}</option>)}</select><span className="text-[11px] font-normal text-[#7b8a83]">{selectedNeighborhood.eta} · {selectedNeighborhood.feeInCents ? formatCurrency(selectedNeighborhood.feeInCents) : "grátis"}</span></label>
                        <div className="grid grid-cols-[1fr_96px] gap-2.5">
                          <label className="grid gap-1.5 text-xs font-bold">Rua<input required value={street} onChange={(event) => setStreet(event.target.value)} className={inputClass} placeholder="Rua" /></label>
                          <label className="grid gap-1.5 text-xs font-bold">Nº<input required value={number} onChange={(event) => setNumber(event.target.value)} className={inputClass} placeholder="123" /></label>
                        </div>
                      </>
                    )}
                    <label className="grid gap-1.5 text-xs font-bold">Observação<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-16 w-full border border-[#e0e1da] bg-white p-3 text-base outline-none" placeholder="Sem cebola, troco..." /></label>
                  </div>
                </div>
              )}

              {checkoutStage === "payment" && (
                <form id="checkout-form" onSubmit={submitOrder} className="animate-rise">
                  <div className="grid gap-2.5">
                    {[
                      { id: "pix" as const, icon: QrCode, title: "Pix", text: "QR Code após confirmar" },
                      { id: "card" as const, icon: CreditCard, title: "Cartão", text: "Crédito ou débito" },
                      { id: "cash" as const, icon: Banknote, title: "Na entrega", text: "Dinheiro ou cartão" },
                    ].map((item) => (
                      <button type="button" onClick={() => setPayment(item.id)} key={item.id} className={`flex items-center gap-3 border p-3.5 text-left ${payment === item.id ? "border-[#287154] bg-[#eef5f0]" : "border-[#e0e1da]"}`}>
                        <item.icon size={22} className={payment === item.id ? "text-[#287154]" : "text-[#7b8a83]"} />
                        <span className="flex-1"><strong className="block text-sm">{item.title}</strong><small className="text-[#7b8a83]">{item.text}</small></span>
                        <span className={`grid size-5 place-items-center rounded-full border ${payment === item.id ? "border-[#287154] bg-[#287154] text-white" : "border-[#bbc3bd]"}`}>{payment === item.id && <Check size={12} />}</span>
                      </button>
                    ))}
                  </div>
                  <label className="mt-5 flex gap-2.5 text-xs leading-5 text-[#7b8a83]">
                    <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1 accent-[#287154]" />
                    Quero receber o cardápio e ofertas no WhatsApp.
                  </label>
                </form>
              )}

              {checkoutStage === "success" && orderResult && (
                <div className="py-6 text-center animate-rise">
                  <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#287154] text-white shadow-[0_0_0_10px_#e6f0e9]"><Check size={38} strokeWidth={2.5} /></div>
                  <p className="mt-6 text-[11px] font-black uppercase tracking-[.14em] text-[#f45d3d]">Pedido #{orderResult.shortId}</p>
                  <h3 className="display-font mt-2 text-3xl font-bold">Na fila da cozinha!</h3>
                  <div className="mx-auto mt-5 max-w-sm border border-[#e0e1da] bg-white p-4 text-left text-sm">
                    <div className="flex justify-between border-b border-[#e6e6df] pb-3"><span className="text-[#7b8a83]">Previsão</span><strong>{new Date(orderResult.estimatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong></div>
                    <div className="flex justify-between pt-3"><span className="text-[#7b8a83]">Total</span><strong>{formatCurrency(orderResult.totalInCents)}</strong></div>
                  </div>
                  <div className="mx-auto mt-3 flex max-w-sm items-center gap-2.5 bg-[#f1c85b] p-3.5 text-left">
                    <Gift size={21} />
                    <p className="text-xs"><strong className="block">+{orderResult.earnedPoints} pontos</strong>Agora você tem {orderResult.customerPoints}.</p>
                  </div>
                  <button onClick={() => router.push(`/pedidos/${orderResult.id}`)} className="mt-6 h-13 w-full max-w-sm rounded-full bg-[#173f32] font-bold text-white">Acompanhar pedido</button>
                </div>
              )}
            </div>

            {checkoutStage !== "success" && cart.length > 0 && (
              <div className="border-t border-[#e0e1da] bg-white px-5 py-4">
                <div className="mb-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#7b8a83]"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-[#7b8a83]"><span>{fulfillment === "delivery" ? "Entrega" : "Retirada"}</span><span>{deliveryFee ? formatCurrency(deliveryFee) : "Grátis"}</span></div>
                  {discount > 0 && <div className="flex justify-between font-bold text-[#287154]"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
                  <div className="flex justify-between border-t border-[#e6e6df] pt-2 text-lg font-black"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-2.5">
                  {checkoutStage !== "cart" && <button onClick={() => setCheckoutStage(checkoutStage === "payment" ? "details" : "cart")} className="h-13 border border-[#173f32] px-4 font-bold"><ArrowRight className="rotate-180" size={18} /></button>}
                  <button
                    type={checkoutStage === "payment" ? "submit" : "button"}
                    form={checkoutStage === "payment" ? "checkout-form" : undefined}
                    disabled={submitting}
                    onClick={() => {
                      if (checkoutStage === "cart") setCheckoutStage("details");
                      else if (checkoutStage === "details") {
                        if (!customerName || customerPhone.replace(/\D/g, "").length < 10 || (fulfillment === "delivery" && (!street || !number))) setToast("Preencha os dados");
                        else setCheckoutStage("payment");
                      }
                    }}
                    className={`flex h-13 items-center justify-center gap-2 rounded-full bg-[#f45d3d] font-bold text-white disabled:opacity-60 ${checkoutStage === "cart" ? "col-span-2" : ""}`}
                  >
                    {submitting ? "Enviando..." : checkoutStage === "payment" ? "Confirmar pedido" : "Continuar"} {!submitting && <ArrowRight size={17} />}
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {loginOpen && (
        <div className="fixed inset-0 z-[75] grid place-items-center bg-[#0f2f25]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}>
          <div className="w-full max-w-md bg-[#fffdf8] p-6 shadow-2xl animate-rise">
            <div className="flex items-start justify-between">
              <div className="grid size-11 place-items-center rounded-full bg-[#f1c85b] text-[#173f32]"><Trophy size={21} /></div>
              <button onClick={() => setLoginOpen(false)} className="grid size-9 place-items-center rounded-full border border-[#e0e1da]"><X size={17} /></button>
            </div>
            <h2 className="display-font mt-5 text-3xl font-bold">{loginStep === "phone" ? "Entrar no Clube" : "Código enviado"}</h2>
            <p className="mt-2 text-sm text-[#7b8a83]">{loginStep === "phone" ? "Use seu WhatsApp para ganhar pontos." : "Digite 1234 na demonstração."}</p>
            <form onSubmit={handleLogin} className="mt-5 grid gap-3.5">
              {loginStep === "phone" ? (
                <>
                  <label className="grid gap-1.5 text-xs font-bold">Nome<input value={loginName} onChange={(event) => setLoginName(event.target.value)} className={inputClass} placeholder="Seu nome" /></label>
                  <label className="grid gap-1.5 text-xs font-bold">WhatsApp<input required value={loginPhone} onChange={(event) => setLoginPhone(event.target.value)} className={inputClass} placeholder="(18) 99999-9999" inputMode="tel" /></label>
                </>
              ) : (
                <label className="grid gap-1.5 text-xs font-bold">Código<input required autoFocus value={loginCode} onChange={(event) => setLoginCode(event.target.value.replace(/\D/g, "").slice(0, 4))} className={`${inputClass} text-center text-2xl font-black tracking-[.5em]`} placeholder="••••" inputMode="numeric" /></label>
              )}
              <button disabled={loginLoading} className="mt-1 h-13 rounded-full bg-[#173f32] font-bold text-white disabled:opacity-60">
                {loginLoading ? "Só um instante..." : loginStep === "phone" ? "Receber código" : "Entrar"}
              </button>
            </form>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#87978f]"><ShieldCheck size={14} /> Protegido pela LGPD</p>
          </div>
        </div>
      )}
    </div>
  );
}
