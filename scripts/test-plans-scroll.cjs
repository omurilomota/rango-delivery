const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(check, message) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await check()) return;
    await delay(50);
  }
  throw new Error(message);
}

async function swipe(page, track, direction) {
  const session = await page.context().newCDPSession(page);
  const box = await track.boundingBox();
  assert.ok(box, "O carrossel precisa estar visível para receber o gesto.");
  const x = box.x + box.width * (direction === 1 ? 0.84 : 0.16);
  const y = box.y + Math.min(box.height * 0.3, 70);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 12; step += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - (box.width * 0.65 * step * direction) / 12, y }],
    });
    await delay(20);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 360, 390, 768, 1024, 1440]) {
      const mobile = width < 768;
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      const track = page.getByRole("region", { name: "Planos de assinatura" });
      const next = page.getByRole("button", { name: "Próximo plano", exact: true });
      const previous = page.getByRole("button", { name: "Plano anterior", exact: true });
      await track.waitFor({ state: "visible" });
      await track.scrollIntoViewIfNeeded();
      await waitFor(() => next.isEnabled(), "A navegação do carrossel não iniciou.");
      await delay(200);

      const metrics = await track.evaluate((element) => ({
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflow: getComputedStyle(element).overflowX,
        touchAction: getComputedStyle(element).touchAction,
      }));
      assert.ok(metrics.scrollWidth > metrics.width + 20, `Sem espaço horizontal a ${width}px.`);
      assert.equal(metrics.overflow, "auto");
      assert.ok(!metrics.touchAction.includes("none"), "O gesto de toque não pode ser bloqueado.");

      if (mobile) {
        await swipe(page, track, 1);
        await waitFor(() => track.evaluate((element) => element.scrollLeft > 20), `O gesto não rolou a ${width}px.`);
        await delay(650);
        for (let attempts = 0; attempts < 4 && !(await next.isDisabled()); attempts += 1) {
          await swipe(page, track, 1);
          await delay(650);
        }
        assert.ok(await next.isDisabled(), "O gesto precisa chegar até o último plano.");
        const endPosition = await track.evaluate((element) => element.scrollLeft);
        await swipe(page, track, -1);
        await waitFor(
          () => track.evaluate((element, end) => element.scrollLeft < end - 20, endPosition),
          "O gesto de retorno não funcionou.",
        );
        await delay(650);
        console.log(`${width}px: gesto até o último plano e retorno confirmados`);
      } else {
        await track.hover();
        await page.mouse.wheel(320, 0);
        await waitFor(() => track.evaluate((element) => element.scrollLeft > 20), `A rolagem horizontal não funcionou a ${width}px.`);
        console.log(`${width}px: rolagem horizontal confirmada`);
      }

      await track.focus();
      await page.keyboard.press("Home");
      await waitFor(() => track.evaluate((element) => element.scrollLeft < 2), "Home não voltou ao primeiro plano.");
      await delay(150);

      for (let attempts = 0; attempts < 5 && !(await next.isDisabled()); attempts += 1) {
        const before = await track.evaluate((element) => element.scrollLeft);
        await next.click();
        await waitFor(() => track.evaluate((element, start) => element.scrollLeft > start + 2, before), "A seta não avançou.");
        await delay(650);
      }
      assert.ok(await next.isDisabled(), "A seta deveria parar no último plano.");
      const lastPlanVisible = await track.evaluate((element) => {
        const last = element.querySelector("[data-plan-card]:last-child");
        const viewport = element.getBoundingClientRect();
        const card = last.getBoundingClientRect();
        return card.left >= viewport.left - 2 && card.right <= viewport.right + 2;
      });
      assert.ok(lastPlanVisible, "O último plano precisa aparecer por inteiro.");

      const beforeBack = await track.evaluate((element) => element.scrollLeft);
      await previous.click();
      await waitFor(() => track.evaluate((element, start) => element.scrollLeft < start - 2, beforeBack), "A seta não voltou.");
      await track.focus();
      await page.keyboard.press("Home");
      await waitFor(() => track.evaluate((element) => element.scrollLeft < 2), "O carrossel não voltou ao início.");
      await waitFor(() => previous.isDisabled(), "A seta anterior precisa estar desabilitada no início.");

      const documentOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(documentOverflow <= 1, `A página transbordou ${documentOverflow}px.`);
      assert.deepEqual(errors, [], "Erro JavaScript no navegador.");
      console.log(`${width}px: setas, último plano, teclado e largura da página OK`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
