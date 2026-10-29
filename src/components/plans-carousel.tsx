"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatCurrency, plans } from "@/lib/store-data";
import styles from "./plans-carousel.module.css";

type ScrollState = {
  activeIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
};

function getPlanCards(viewport: HTMLDivElement) {
  return Array.from(viewport.querySelectorAll<HTMLElement>("[data-plan-card]"));
}

function getActiveIndex(viewport: HTMLDivElement) {
  const cards = getPlanCards(viewport);
  const maxScroll = viewport.scrollWidth - viewport.clientWidth;
  if (!cards.length || maxScroll <= 2 || viewport.scrollLeft <= 2) return 0;
  if (viewport.scrollLeft >= maxScroll - 2) return cards.length - 1;

  const origin = cards[0].offsetLeft;
  return cards.reduce((closest, card, index) => {
    const distance = Math.abs(card.offsetLeft - origin - viewport.scrollLeft);
    const closestDistance = Math.abs(cards[closest].offsetLeft - origin - viewport.scrollLeft);
    return distance < closestDistance ? index : closest;
  }, 0);
}

export function PlansCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    activeIndex: 0,
    canGoBack: false,
    canGoForward: true,
  });

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const nextState = {
      activeIndex: getActiveIndex(viewport),
      canGoBack: viewport.scrollLeft > 2,
      canGoForward: viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 2,
    };
    setScrollState((current) =>
      current.activeIndex === nextState.activeIndex &&
      current.canGoBack === nextState.canGoBack &&
      current.canGoForward === nextState.canGoForward
        ? current
        : nextState,
    );
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(viewport);
    getPlanCards(viewport).forEach((card) => observer.observe(card));
    viewport.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();

    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollToPosition(left: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({ left, behavior: reducedMotion ? "instant" : "smooth" });
  }

  function scrollToPlan(index: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cards = getPlanCards(viewport);
    const target = cards[Math.max(0, Math.min(index, cards.length - 1))];
    if (target) scrollToPosition(target.offsetLeft - cards[0].offsetLeft);
  }

  function move(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cards = getPlanCards(viewport);
    if (!cards.length) return;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const origin = cards[0].offsetLeft;
    const positions = cards.map((card) => Math.min(maxScroll, card.offsetLeft - origin));
    const nextPosition = direction === -1
      ? positions.filter((position) => position < viewport.scrollLeft - 2).at(-1) ?? 0
      : positions.find((position) => position > viewport.scrollLeft + 2) ?? maxScroll;
    scrollToPosition(nextPosition);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") scrollToPlan(0);
    else if (event.key === "End") scrollToPlan(plans.length - 1);
    else move(event.key === "ArrowLeft" ? -1 : 1);
  }

  return (
    <section id="assinaturas" aria-labelledby="plans-title" className="scroll-mt-20 bg-[#f7f1e7] py-12 md:py-20">
      <div className="shell min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#f45d3d]">Assinatura</p>
        <h2 id="plans-title" className="display-font mt-2 text-[2.4rem] font-bold leading-none md:text-[3.6rem]">
          Almoço resolvido.
        </h2>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p id="plans-scroll-hint" className="text-xs font-semibold text-[#687970]">Deslize para ver os planos</p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Plano anterior"
              aria-controls="plans-scroll"
              disabled={!scrollState.canGoBack}
              onClick={() => move(-1)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#173f32] bg-[#fffdf8] text-[#173f32] disabled:cursor-default disabled:opacity-30"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Próximo plano"
              aria-controls="plans-scroll"
              disabled={!scrollState.canGoForward}
              onClick={() => move(1)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#173f32] bg-[#fffdf8] text-[#173f32] disabled:cursor-default disabled:opacity-30"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div
          id="plans-scroll"
          ref={viewportRef}
          className={styles.track}
          role="region"
          aria-label="Planos de assinatura"
          aria-describedby="plans-scroll-hint"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {plans.map((plan) => (
            <article
              key={plan.name}
              data-plan-card
              aria-label={`Plano ${plan.name}`}
              className={`${styles.card} border bg-[#fffdf8] p-5 ${plan.featured ? "border-[#f45d3d] bg-white" : "border-[#d5d8d1]"}`}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="display-font text-[2.6rem] font-bold leading-none">{plan.meals}</span>
                <span className="text-xs font-bold text-[#687970]">refeições/mês</span>
              </div>
              <p className="mt-2 text-sm font-black text-[#287154]">{plan.name} · economize {plan.discount}%</p>
              <p className="mt-3 text-xl font-black">
                {formatCurrency(plan.priceInCents)}<span className="text-xs font-semibold text-[#87978f]">/mês</span>
              </p>
              <a
                href={`https://wa.me/5518999990109?text=${encodeURIComponent(`Olá! Quero o plano ${plan.name} (${plan.meals} refeições).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 flex h-12 w-full items-center justify-center rounded-full text-sm font-bold ${plan.featured ? "bg-[#f45d3d] text-white" : "border-2 border-[#173f32]"}`}
              >
                Quero este
              </a>
            </article>
          ))}
        </div>
        <p className="mt-2 text-right text-xs font-semibold tabular-nums text-[#687970]" aria-live="polite" aria-atomic="true">
          {scrollState.activeIndex + 1} de {plans.length}
        </p>
      </div>
    </section>
  );
}
