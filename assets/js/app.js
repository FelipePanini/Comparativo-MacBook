import { CHECKED_AT, DEFAULTS, FINISHES, MODELS, SPEC_ROWS, PRICES, STORES, STORE_NAMES, STATES, SOURCES } from './data.js';
import { Spring, VelocityTracker, project, rubberband, clamp, reducedMotion } from './spring.js';

/* ---------- Utilidades ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const byId = Object.fromEntries(MODELS.map(m => [m.id, m]));

const usd = value => {
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return 'US$\u00a0' + value.toLocaleString('pt-BR', { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: hasCents ? 2 : 0 });
};
const brl = value => 'R$\u00a0' + Math.round(value).toLocaleString('pt-BR');
const pct = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) + '%';
const thousands = value => value.toLocaleString('pt-BR');
const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Motor de rolagem: um único listener, tudo 1:1 com o scroll ---------- */
const scrollJobs = [];
let scrollQueued = false;
const runScrollJobs = () => {
  scrollQueued = false;
  for (const job of scrollJobs) job();
};
const queueScroll = () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(runScrollJobs);
};
addEventListener('scroll', queueScroll, { passive: true });
addEventListener('resize', queueScroll);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', queueScroll);
const onScroll = job => {
  scrollJobs.push(job);
  queueScroll();
};
// 0 quando o topo do elemento está em `start` (fração da janela), 1 quando chega em `end`.
const viewProgress = (el, start, end) => {
  const top = el.getBoundingClientRect().top;
  return clamp((innerHeight * start - top) / (innerHeight * (start - end)), 0, 1);
};
// Progresso dentro de uma seção com conteúdo fixo (sticky) logo abaixo da sub-navegação.
const LOCALNAV_H = 52;
const pinnedProgress = el => {
  const r = el.getBoundingClientRect();
  const total = r.height - (innerHeight - LOCALNAV_H);
  return clamp((LOCALNAV_H - r.top) / Math.max(1, total), 0, 1);
};
const easeOut = t => 1 - (1 - t) ** 3;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a, b, t) => a + (b - a) * t;

const offersFor = id => PRICES.filter(p => p.model === id).sort((a, b) => a.price - b.price);
const fromPrice = id => Math.min(...offersFor(id).map(p => p.price));
const toPrice = id => Math.max(...offersFor(id).map(p => p.price));
const stateById = id => STATES.find(s => s.id === id) || STATES[0];

const ICON = {
  check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  minus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  cross: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 2.8 19.5h18.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9.5v4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  okCircle: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8 12.5 2.7 2.7L16.2 9.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

const TIP_ICON = {
  suitcase: '<path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><rect x="4" y="7" width="16" height="13" rx="2.5"/><path d="M9 11v5M15 11v5"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  receipt: '<path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.2-1.5 1.2-2-1.5L6 20.5z"/><path d="m9.5 14.5 5-5"/><circle cx="10" cy="10" r=".6"/><circle cx="14" cy="14" r=".6"/>',
  keyboard: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7.5 14h9"/>',
  plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
  battery: '<rect x="2.5" y="7.5" width="17" height="9" rx="2"/><path d="M21.5 10.5v3M6 10.5v3M9 10.5v3M12 10.5v3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2"/>',
  box: '<path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01"/>',
};

/* ---------- Ilustração do MacBook (SVG) ---------- */
let svgUid = 0;
function macSVG(model, finishId = model.finish, { decorative = true } = {}) {
  const f = FINISHES[finishId];
  const id = `mac${++svgUid}`;
  const [c1, c2, c3] = model.wallpaper;
  const lid = { x: 52, y: 12, w: 296, h: 194 };
  const bezel = model.chin ? 9 : 7;
  const chin = model.chin ? 17 : 9;
  const scr = { x: lid.x + bezel, y: lid.y + bezel, w: lid.w - bezel * 2, h: lid.h - bezel - chin };
  const baseY = lid.y + lid.h;
  const baseH = model.pro ? 12 : 8;
  const bottom = baseY + baseH;
  const dockY = scr.y + scr.h - 15;
  const label = `Ilustração do ${model.name} ${model.chip} na cor ${f.label}`;
  const a11y = decorative ? 'aria-hidden="true" focusable="false"' : `role="img" aria-label="${label}"`;
  const wave1 = `M${scr.x} ${scr.y + scr.h * 0.62} C ${scr.x + scr.w * 0.25} ${scr.y + scr.h * 0.42}, ${scr.x + scr.w * 0.55} ${scr.y + scr.h * 0.86}, ${scr.x + scr.w} ${scr.y + scr.h * 0.5} V ${scr.y + scr.h} H ${scr.x} Z`;
  const wave2 = `M${scr.x} ${scr.y + scr.h * 0.8} C ${scr.x + scr.w * 0.3} ${scr.y + scr.h * 0.66}, ${scr.x + scr.w * 0.62} ${scr.y + scr.h * 1.02}, ${scr.x + scr.w} ${scr.y + scr.h * 0.72} V ${scr.y + scr.h} H ${scr.x} Z`;
  const dockColors = ['#0a84ff', '#30d158', '#ff9f0a', '#ff375f', '#bf5af2'];
  const dock = dockColors.map((c, i) => `<rect x="${200 - 22 + i * 9}" y="${dockY + 2}" width="6.5" height="6.5" rx="1.6" fill="${c}"/>`).join('');
  return `<svg class="mac-svg" viewBox="0 0 400 ${bottom + 18}" ${a11y}>
    <defs>
      <linearGradient id="${id}-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.lid}"/><stop offset="1" stop-color="${f.edge}"/></linearGradient>
      <linearGradient id="${id}-w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
      <radialGradient id="${id}-g" cx=".18" cy="1" r=".9"><stop offset="0" stop-color="${c3}" stop-opacity=".95"/><stop offset="1" stop-color="${c3}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".26"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <clipPath id="${id}-c"><rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" rx="4"/></clipPath>
    </defs>
    <ellipse cx="200" cy="${bottom + 5}" rx="188" ry="10" fill="url(#${id}-s)"/>
    <rect x="${lid.x}" y="${lid.y}" width="${lid.w}" height="${lid.h}" rx="11" fill="${f.edge}"/>
    <rect x="${lid.x + 1.6}" y="${lid.y + 1.6}" width="${lid.w - 3.2}" height="${lid.h - 3.2}" rx="9.6" fill="#0c0c0e"/>
    <g clip-path="url(#${id}-c)">
      <rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" fill="url(#${id}-w)"/>
      <rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="${scr.h}" fill="url(#${id}-g)"/>
      <path d="${wave1}" fill="#fff" opacity=".12"/>
      <path d="${wave2}" fill="#fff" opacity=".1"/>
      <rect x="${scr.x}" y="${scr.y}" width="${scr.w}" height="7" fill="#fff" opacity=".2"/>
      <rect x="${200 - 26}" y="${dockY}" width="52" height="10.5" rx="3.2" fill="#fff" opacity=".3"/>
      ${dock}
    </g>
    ${model.notch
      ? `<path d="M${200 - 16} ${scr.y - 0.5} h32 v5.2 a2.6 2.6 0 0 1 -2.6 2.6 h-26.8 a2.6 2.6 0 0 1 -2.6 -2.6 z" fill="#0c0c0e"/><circle cx="200" cy="${scr.y + 3}" r="1.2" fill="#1f2a36"/>`
      : `<circle cx="200" cy="${lid.y + 4.6}" r="1.3" fill="#1f2a36"/>`}
    ${model.chin ? `<text x="200" y="${lid.y + lid.h - 5.5}" text-anchor="middle" font-size="5.6" letter-spacing=".2" fill="#8e8e93" font-family="system-ui, sans-serif">MacBook Pro</text>` : ''}
    <path d="M18 ${baseY} H382 L379 ${bottom - 3} Q378 ${bottom} 374 ${bottom} H26 Q22 ${bottom} 21 ${bottom - 3} Z" fill="url(#${id}-b)"/>
    <rect x="18" y="${baseY}" width="364" height="1.1" fill="#fff" opacity=".55"/>
    <path d="M173 ${baseY} h54 q-1.4 3.6 -5.4 3.8 h-43.2 q-4 -.2 -5.4 -3.8 z" fill="#000" opacity=".16"/>
    ${model.pro ? `<rect x="44" y="${bottom - 1}" width="22" height="2.4" rx="1.2" fill="#000" opacity=".4"/><rect x="334" y="${bottom - 1}" width="22" height="2.4" rx="1.2" fill="#000" opacity=".4"/>` : ''}
  </svg>`;
}

/* ---------- Cálculo de custo ---------- */
function computeCost({ price, taxRate, fx, iof, other = 0 }) {
  const salesTax = price * taxRate / 100;
  const paid = price + salesTax;
  const excessWith = Math.max(0, other + paid - DEFAULTS.quota);
  const excessWithout = Math.max(0, other - DEFAULTS.quota);
  const dutyUSD = (excessWith - excessWithout) * DEFAULTS.dutyRate;
  const parts = {
    product: price * fx,
    salesTax: salesTax * fx,
    iof: paid * fx * iof / 100,
    duty: dutyUSD * fx,
  };
  return {
    ...parts,
    paid,
    dutyUSD,
    total: parts.product + parts.salesTax + parts.iof + parts.duty,
    quotaUsed: other + paid,
    over: other + paid > DEFAULTS.quota,
  };
}
const defaultCost = price => computeCost({ price, taxRate: stateById(DEFAULTS.state).rate, fx: DEFAULTS.fx, iof: DEFAULTS.iof });

/* ---------- Veredito ---------- */
function renderVerdict() {
  const picks = [
    { id: 'air-m5', range: false, mod: 'best', badge: 'Melhor escolha', sub: 'Novo, na Amazon ou na Best Buy', points: ['O chip mais rápido e 512 GB de série', 'Garantia nova e Wi-Fi 7', 'Apple cobra US$\u00a01.499; a Amazon, US$\u00a01.299'] },
    { id: 'pro-2021', range: true, mod: 'value', badge: 'Mais Mac pelo dinheiro', sub: 'Recondicionado', points: ['Tela mini-LED de 120 Hz, HDMI e leitor SD', 'Pode caber na cota de US$\u00a01.000', 'Pesa 2,1 kg; confira a bateria'] },
    { id: 'air-m2', range: false, mod: 'light', badge: 'Leve e barato', sub: 'Recondicionado (Walmart Restored)', points: ['Mesmo corpo de 1,51 kg dos Airs novos', 'Abaixo de US$\u00a01.000', 'Só 1 monitor externo'] },
  ];
  $('#verdict-grid').innerHTML = picks.map(p => {
    const m = byId[p.id];
    const low = fromPrice(p.id);
    const high = p.range ? toPrice(p.id) : low;
    const priceText = high > low ? `${usd(low)}–${thousands(Math.round(high))}` : `<span class="vcard-from">a partir de</span>${usd(low)}`;
    const costLow = defaultCost(low).total;
    const costHigh = defaultCost(high).total;
    const costText = high > low ? `≈ ${brl(costLow)} a ${brl(costHigh)}` : `≈ ${brl(costLow)}`;
    return `<article class="vcard vcard--${p.mod} reveal">
      <div class="vcard-visual">${macSVG(m)}</div>
      <span class="vcard-badge">${p.badge}</span>
      <h3 class="vcard-name">${m.name} ${m.chip}</h3>
      <p class="vcard-sub">${m.year} · ${p.sub}</p>
      <p class="vcard-price">${priceText}<small>${costText} no total, com sales tax de Orlando, IOF e imposto se passar da cota</small></p>
      <ul class="vcard-list">${p.points.map(t => `<li>${t}</li>`).join('')}</ul>
      <button class="vcard-more" type="button" data-open="${m.id}">Ver detalhes <span aria-hidden="true">›</span></button>
    </article>`;
  }).join('');

  $('#verdict-notes').innerHTML = `
    <div class="vnote vnote--skip reveal">${ICON.pause}<div><strong><span class="status-label">Não compensa agora:</span> Air M3 e M4</strong><p>Recondicionados custam de US$\u00a0990 a US$\u00a01.310, colados no M5 novo em promoção. Só vale um M4 por até ~US$\u00a01.000 (já esteve a US$\u00a0999 em maio).</p></div></div>
    <div class="vnote vnote--avoid reveal">${ICON.warning}<div><strong><span class="status-label">Evite:</span> Pro 16″ 2019 (Intel)</strong><p>Não recebe o macOS 27 nem Apple Intelligence, esquenta e já tem bateria velha. Só correções de segurança até ~2028.</p></div></div>`;
}

/* ---------- Carrossel de modelos ---------- */
function renderCarousel() {
  $('#carousel-track').innerHTML = MODELS.map(m => {
    const tagMod = m.verdict === 'best' ? 'best' : m.verdict === 'avoid' ? 'avoid' : '';
    const market = m.market === 'novo' ? 'Novo, a partir de' : 'Recondicionado, a partir de';
    const facts = [m.specs.battery, m.specs.weight, m.specs.ai === 'Sim' ? 'Apple Intelligence' : 'Sem Apple Intelligence'];
    return `<li class="mcard">
      <button class="mcard-hit" type="button" data-open="${m.id}" aria-label="${m.name} ${m.chip}, ${m.year}. ${market} ${usd(fromPrice(m.id))}. ${m.verdictLabel}. Ver detalhes.">
        <span class="mcard-tag ${tagMod ? `mcard-tag--${tagMod}` : ''}">${m.verdictLabel}</span>
        <span class="mcard-name">${m.name}<span>${m.chip} · ${m.year}</span></span>
        <span class="mcard-visual">${macSVG(m)}</span>
        <span class="mcard-price">${market}<strong>${usd(fromPrice(m.id))}</strong></span>
        <span class="mcard-facts">${facts.map(f => `<span>${f}</span>`).join('')}</span>
        <span class="mcard-plus" aria-hidden="true">${ICON.plus}</span>
      </button>
    </li>`;
  }).join('');
}

function initCarousel(onOpen) {
  const root = $('#carousel');
  const viewport = $('.carousel-viewport', root);
  const track = $('.carousel-track', root);
  const prev = $('[data-dir="-1"]', root);
  const next = $('[data-dir="1"]', root);
  let snaps = [0];
  let min = 0;
  const max = 0;

  const x = new Spring(0, {
    response: 0.45,
    damping: 1,
    precision: 0.1,
    onUpdate: v => {
      track.style.transform = `translate3d(${v}px, 0, 0)`;
    },
    onRest: () => updateButtons(),
  });

  const nearestIndex = value => {
    let best = 0;
    snaps.forEach((s, i) => { if (Math.abs(s - value) < Math.abs(snaps[best] - value)) best = i; });
    return best;
  };

  function updateButtons() {
    const i = nearestIndex(x.target);
    prev.disabled = i <= 0;
    next.disabled = i >= snaps.length - 1;
  }

  function measure() {
    const cards = [...track.children];
    if (!cards.length) return;
    const first = cards[0].offsetLeft;
    min = Math.min(0, viewport.clientWidth - track.scrollWidth);
    snaps = [...new Set(cards.map(c => Math.round(clamp(-(c.offsetLeft - first), min, max))))];
    x.set(snaps[nearestIndex(x.target)]);
    updateButtons();
  }

  const go = dir => {
    const i = clamp(nearestIndex(x.target) + dir, 0, snaps.length - 1);
    x.to(snaps[i], { damping: 1, response: 0.45 });
    updateButtons();
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  // Arrasto 1:1 com inércia, elástico nas bordas e interrupção a qualquer momento.
  const tracker = new VelocityTracker();
  let drag = null;
  let lastDragEnd = 0;

  viewport.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.pointerType === 'mouse' && e.target.closest('a')) return;
    // Só conta como "em movimento" se ainda dá para ver: cauda de mola quase parada não bloqueia o toque.
    const wasMoving = x.animating && (Math.abs(x.velocity) > 30 || Math.abs(x.target - x.value) > 2);
    x.stop(); // pega o valor que está na tela
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, origin: x.value, active: false, wasMoving };
    tracker.reset();
    tracker.add(e.clientX);
  });

  viewport.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        if (drag.wasMoving) x.to(snaps[nearestIndex(x.value)]);
        drag = null; // é rolagem vertical da página
        return;
      }
      drag.active = true;
      drag.x0 = e.clientX; // a folga de 8 px não vira salto
      viewport.setPointerCapture(e.pointerId);
      root.classList.add('is-dragging');
    }
    tracker.add(e.clientX);
    let v = drag.origin + (e.clientX - drag.x0);
    if (v > max) v = max + rubberband(v - max, viewport.clientWidth);
    if (v < min) v = min + rubberband(v - min, viewport.clientWidth);
    x.set(v);
  });

  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    root.classList.remove('is-dragging');
    if (!d.active) {
      // Um toque que só parou o movimento (ou pegou o carrossel fora do lugar) assenta e não abre o cartão.
      const snap = snaps[nearestIndex(clamp(x.value, min, max))];
      if (d.wasMoving || Math.abs(x.value - snap) > 0.5) {
        lastDragEnd = performance.now();
        x.to(snap, { damping: 1 });
      }
      return;
    }
    lastDragEnd = performance.now();
    tracker.add(e.clientX);
    const velocity = e.type === 'pointercancel' ? 0 : tracker.velocity;
    const landing = clamp(x.value + project(velocity, 0.993), min, max);
    const target = snaps[nearestIndex(landing)];
    const flicked = Math.abs(velocity) > 500;
    x.to(target, { velocity, damping: flicked ? 0.86 : 1, response: 0.42 });
    updateButtons();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // Trackpad: dois dedos na horizontal movem 1:1 e assentam no cartão mais próximo.
  let wheelRaw = null;
  let wheelTimer = 0;
  viewport.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (wheelRaw === null) { x.stop(); wheelRaw = x.value; }
    wheelRaw -= e.deltaX;
    let v = wheelRaw;
    if (v > max) v = max + rubberband(v - max, viewport.clientWidth);
    if (v < min) v = min + rubberband(v - min, viewport.clientWidth);
    x.set(v);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelRaw = null;
      x.to(snaps[nearestIndex(clamp(x.value, min, max))], { damping: 1, response: 0.4 });
      updateButtons();
    }, 120);
  }, { passive: false });

  track.addEventListener('click', e => {
    const card = e.target.closest('[data-open]');
    if (!card || performance.now() - lastDragEnd < 80) return;
    onOpen(card.dataset.open);
  });

  // Teclado: o cartão focado entra na tela.
  track.addEventListener('focusin', e => {
    const li = e.target.closest('.mcard');
    if (!li) return;
    const i = [...track.children].indexOf(li);
    const first = track.children[0].offsetLeft;
    const wanted = clamp(-(li.offsetLeft - first), min, max);
    const left = li.offsetLeft + x.value - first;
    if (left < 0 || left + li.offsetWidth > viewport.clientWidth) x.to(snaps[nearestIndex(wanted)] ?? snaps[i]);
  });
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
  });

  new ResizeObserver(measure).observe(viewport);
  measure();
}

/* ---------- Desempenho ---------- */
function renderPerf() {
  const metrics = [
    { key: 'single', title: 'Um núcleo', sub: 'Abrir apps, navegar, planilhas', max: 4500 },
    { key: 'multi', title: 'Todos os núcleos', sub: 'Exportar vídeo, compilar, IA local', max: 18000 },
  ];
  $('#perf-grid').innerHTML = metrics.map(metric => `
    <div class="bars reveal" data-metric="${metric.key}">
      <h3 class="bars-title">${metric.title}</h3>
      <p class="bars-sub">${metric.sub} · Geekbench 6 (aprox.)</p>
      ${MODELS.map(m => {
        const value = m.gb6[metric.key];
        return `<div class="bar-row">
          <span class="bar-label">${m.short}</span>
          <div class="bar-track" data-target="${(value / metric.max) * 100}">
            <div class="bar"></div>
            <span class="bar-value">≈ ${thousands(value)}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');

  // As barras crescem junto com a rolagem (e encolhem se você voltar).
  $$('#perf-grid .bars').forEach(panel => {
    const tracks = $$('.bar-track', panel).map(t => ({ bar: $('.bar', t), label: $('.bar-value', t), target: Number(t.dataset.target) }));
    onScroll(() => {
      const p = reducedMotion() ? 1 : viewProgress(panel, 0.95, 0.45);
      tracks.forEach((t, i) => {
        const local = easeOut(clamp(p * 1.4 - i * 0.08, 0, 1));
        const w = t.target * local;
        t.bar.style.width = `${w}%`;
        t.label.style.left = `${w}%`;
        t.label.style.opacity = String(clamp(local * 3 - 0.2, 0, 1));
      });
    });
  });

  const rows = [
    ['1,51 kg', 'Todos os Air 15″, do M2 ao M5.'],
    ['2,1 kg', 'O Pro 2021: 600 g a mais na mochila.'],
    ['120 Hz', 'Só o Pro 2021 tem tela ProMotion.'],
    ['até 21 h', 'Bateria do Pro 2021, quando nova.'],
    ['Wi-Fi 7', 'Exclusivo do Air M5.'],
    ['macOS 27', 'Todos recebem, menos o Pro 2019.'],
  ];
  $('#feature-rows').innerHTML = rows.map(([big, small]) => `<div class="feature-row"><strong>${big}</strong><span>${small}</span></div>`).join('');
}

/* ---------- Especificações ---------- */
const HIGHLIGHTS = {
  'air-m5': { chip: 'good', wireless: 'good', camera: 'good' },
  'air-m4': { camera: 'good' },
  'air-m2': { monitors: 'bad' },
  'pro-2021': { display: 'good', brightness: 'good', refresh: 'good', battery: 'good', ports: 'good' },
  'pro-2019': { battery: 'bad', camera: 'bad', ai: 'bad', macos: 'bad', cooling: 'bad' },
};

function initSpecs() {
  const selected = ['air-m5', 'pro-2021', 'air-m2'];
  const picker = $('#chip-picker');
  picker.innerHTML = MODELS.map(m => `<button class="chip" type="button" data-id="${m.id}" aria-pressed="${selected.includes(m.id)}">
    <svg class="chip-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${m.short}</button>`).join('');

  const wrap = $('#spec-table-wrap');
  function render() {
    const cols = MODELS.filter(m => selected.includes(m.id));
    const cell = (m, key) => {
      const value = escapeHtml(m.specs[key]);
      const flag = HIGHLIGHTS[m.id]?.[key];
      if (flag === 'good') return `<span class="flag flag--good">${ICON.check}<span>${value}</span></span>`;
      if (flag === 'bad') return `<span class="flag flag--bad">${ICON.warning}<span>${value}</span></span>`;
      return value;
    };
    const priceRow = `<tr><th scope="row">Preço hoje nos EUA</th>${cols.map(m => {
      const low = fromPrice(m.id);
      const high = toPrice(m.id);
      return `<td class="spec-cell"><strong>${usd(low)}</strong>${high > low ? ` a ${usd(high)}` : ''}<br><span class="muted">${m.market === 'novo' ? 'novo' : 'recondicionado'}</span></td>`;
    }).join('')}</tr>`;
    wrap.innerHTML = `<table class="spec">
      <caption class="visually-hidden">Especificações de ${cols.map(m => `${m.name} ${m.chip}`).join(', ')}</caption>
      <colgroup><col class="spec-col-label">${cols.map(() => '<col>').join('')}</colgroup>
      <thead><tr><th scope="col"><span class="visually-hidden">Item</span></th>${cols.map(m => `<th scope="col">
        <div class="spec-head-visual">${macSVG(m)}</div>
        <span class="spec-head-name">${m.name} ${m.chip}</span><span class="spec-head-sub">${m.released}</span></th>`).join('')}</tr></thead>
      <tbody>${priceRow}${SPEC_ROWS.map(([key, label]) => `<tr><th scope="row">${label}</th>${cols.map(m => `<td class="spec-cell">${cell(m, key)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  }

  picker.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const id = chip.dataset.id;
    const i = selected.indexOf(id);
    if (i >= 0) {
      if (selected.length === 1) return;
      selected.splice(i, 1);
    } else {
      if (selected.length === 3) selected.shift();
      selected.push(id);
    }
    $$('.chip', picker).forEach(c => c.setAttribute('aria-pressed', String(selected.includes(c.dataset.id))));
    render();
  });
  render();
}

/* ---------- Gráfico de preços ---------- */
const AXIS_MAX = 1600;
const CONDITION = {
  novo: { label: 'Novo', color: 'var(--series-1)' },
  recondicionado: { label: 'Recondicionado ou open-box', color: 'var(--series-2)' },
};

function renderPriceChart(tooltip) {
  const fig = $('#price-chart');
  const x = v => (v / AXIS_MAX) * 100;
  const ticks = [0, 400, 800, 1200, 1600];
  const quota = x(DEFAULTS.quota);

  const rows = MODELS.map(m => {
    const offers = offersFor(m.id);
    // Anúncios com o mesmo preço e condição viram um ponto só.
    const groups = [];
    offers.forEach(o => {
      const g = groups.find(gr => gr.price === o.price && gr.condition === o.condition);
      if (g) g.offers.push(o);
      else groups.push({ price: o.price, condition: o.condition, offers: [o] });
    });
    const low = offers[0].price;
    const high = offers[offers.length - 1].price;
    // Pontos a menos de ~2% de distância se afastam na vertical para não se cobrirem.
    let lastX = -Infinity;
    let lane = 0;
    groups.forEach(g => {
      lane = x(g.price) - lastX < 2.2 ? (lane === 0 ? -1 : lane === -1 ? 1 : 0) : 0;
      g.offset = lane * 9;
      lastX = x(g.price);
    });
    const dots = groups.map(g => {
      const stores = g.offers.map(o => STORE_NAMES[o.store]).join(' · ');
      const aria = `${m.name} ${m.chip}: ${usd(g.price)}, ${CONDITION[g.condition].label.toLowerCase()}, ${stores}`;
      return `<button class="pc-dot" type="button" style="left:${x(g.price)}%; top:calc(50% + ${g.offset}px); --c:${CONDITION[g.condition].color}" data-model="${m.id}" data-price="${g.price}" data-condition="${g.condition}" aria-label="${escapeHtml(aria)}"></button>`;
    }).join('');
    return `<div class="pc-row">
      <div class="pc-label"><strong>${m.name} ${m.chip}</strong><span>a partir de ${usd(low)}</span></div>
      <div class="pc-track">
        ${ticks.map(t => `<span class="pc-grid" style="left:${x(t)}%"></span>`).join('')}
        <span class="pc-quota" style="left:${quota}%"></span>
        ${high > low ? `<span class="pc-range" style="left:${x(low)}%; width:${x(high) - x(low)}%"></span>` : ''}
        ${dots}
      </div>
    </div>`;
  }).join('');

  const tableRows = PRICES.slice().sort((a, b) => MODELS.indexOf(byId[a.model]) - MODELS.indexOf(byId[b.model]) || a.price - b.price).map(p => {
    const m = byId[p.model];
    return `<tr><td>${m.name} ${m.chip}</td><td>${STORE_NAMES[p.store]}</td><td>${CONDITION[p.condition].label}</td><td class="num">${usd(p.price)}</td><td>${p.date}${p.stale ? ' (confirmar)' : ''}</td><td><a href="${p.url}" target="_blank" rel="noopener">Abrir</a></td></tr>`;
  }).join('');

  fig.innerHTML = `
    <div class="pc-legend" aria-hidden="true">
      <span class="pc-key"><span class="pc-swatch" style="background:var(--series-1)"></span>Novo</span>
      <span class="pc-key"><span class="pc-swatch" style="background:var(--series-2)"></span>Recondicionado ou open-box</span>
      <span class="pc-key"><span class="pc-swatch pc-swatch--quota"></span>Cota da Receita (US$\u00a01.000)</span>
    </div>
    <div class="pc-axis pc-head" aria-hidden="true"><span></span><div class="pc-ticks"><span class="pc-quota-label" style="left:${quota}%">Cota US$\u00a01.000</span></div></div>
    <div class="pc-rows" role="group" aria-label="Preços por modelo e loja">${rows}</div>
    <div class="pc-axis" aria-hidden="true"><span></span><div class="pc-ticks">${ticks.map(t => `<span class="pc-tick" style="left:${x(t)}%">${t === 0 ? 'US$\u00a00' : thousands(t)}</span>`).join('')}</div></div>
    <figcaption class="visually-hidden">Preços de MacBooks de 16 GB e 512 GB em lojas dos EUA, consultados em ${CHECKED_AT}.</figcaption>
    <details class="pc-table">
      <summary>Ver como tabela</summary>
      <div class="data-table-wrap"><table class="data-table">
        <thead><tr><th>Modelo</th><th>Loja</th><th>Condição</th><th class="num">Preço</th><th>Data</th><th>Link</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table></div>
    </details>`;

  // Pontos saem do US$\u00a00 e deslizam até o preço conforme a rolagem.
  const chartRows = $$('.pc-row', fig).map(row => ({
    dots: $$('.pc-dot', row).map(d => ({ el: d, x: x(Number(d.dataset.price)) })),
    range: $('.pc-range', row),
  }));
  chartRows.forEach(r => {
    if (r.range) { r.rangeLeft = parseFloat(r.range.style.left); r.rangeWidth = parseFloat(r.range.style.width); }
  });
  onScroll(() => {
    const p = reducedMotion() ? 1 : viewProgress($('.pc-rows', fig), 0.95, 0.4);
    chartRows.forEach((r, i) => {
      const local = easeOut(clamp(p * 1.35 - i * 0.07, 0, 1));
      r.dots.forEach(d => { d.el.style.left = `${d.x * local}%`; });
      if (r.range) {
        r.range.style.left = `${r.rangeLeft * local}%`;
        r.range.style.width = `${r.rangeWidth * local}%`;
      }
    });
  });

  // Tooltip por ponto: passa o mouse, foca pelo teclado ou toca no celular.
  let activeDot = null;
  const show = dot => {
    if (activeDot && activeDot !== dot) activeDot.classList.remove('is-active');
    activeDot = dot;
    dot.classList.add('is-active');
    const m = byId[dot.dataset.model];
    const price = Number(dot.dataset.price);
    const condition = dot.dataset.condition;
    const offers = offersFor(m.id).filter(o => o.price === price && o.condition === condition);
    tooltip.show(dot, `
      <strong>${m.name} ${m.chip}</strong>
      <div class="tt-price">${usd(price)}</div>
      <div class="tt-row"><span class="tt-swatch" style="background:${CONDITION[condition].color}"></span>${CONDITION[condition].label}</div>
      ${offers.map(o => `<div class="tt-meta">${STORE_NAMES[o.store]}${o.note ? ` · ${escapeHtml(o.note)}` : ''} · ${o.date}${o.stale ? ' (confirmar)' : ''}</div>`).join('')}
      <div class="tt-meta">Com sales tax e IOF: ≈ ${brl(defaultCost(price).total - defaultCost(price).duty)}</div>`);
  };
  const hide = () => {
    activeDot?.classList.remove('is-active');
    activeDot = null;
    tooltip.hide();
  };
  fig.addEventListener('pointerover', e => { const d = e.target.closest('.pc-dot'); if (d && e.pointerType === 'mouse') show(d); });
  fig.addEventListener('pointerout', e => { const d = e.target.closest('.pc-dot'); if (d && e.pointerType === 'mouse') hide(); });
  fig.addEventListener('pointerdown', e => { const d = e.target.closest('.pc-dot'); if (d && e.pointerType !== 'mouse') show(d); });
  fig.addEventListener('focusin', e => { const d = e.target.closest('.pc-dot'); if (d) show(d); });
  fig.addEventListener('focusout', e => { if (e.target.closest('.pc-dot')) hide(); });
  document.addEventListener('pointerdown', e => { if (activeDot && !e.target.closest('.pc-dot')) hide(); });
  window.addEventListener('scroll', () => { if (activeDot && document.activeElement !== activeDot) hide(); }, { passive: true });
}

function createTooltip() {
  const el = $('#tooltip');
  return {
    show(anchor, html) {
      el.innerHTML = html;
      el.hidden = false;
      const a = anchor.getBoundingClientRect();
      const t = el.getBoundingClientRect();
      let left = a.left + a.width / 2 - t.width / 2;
      left = clamp(left, 12, innerWidth - t.width - 12);
      let top = a.top - t.height - 14;
      if (top < 64) top = a.bottom + 14;
      el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    },
    hide() {
      el.hidden = true;
    },
  };
}

/* ---------- Segmented control com pílula em mola ---------- */
function initSegmented(root, onChange) {
  const pill = $('.segmented-pill', root);
  const buttons = $$('button', root);
  const px = new Spring(0, { response: 0.35, damping: 1, onUpdate: v => { pill.style.transform = `translateX(${v}px)`; } });
  const pw = new Spring(0, { response: 0.35, damping: 1, onUpdate: v => { pill.style.width = `${v}px`; } });
  let current = buttons.findIndex(b => b.getAttribute('aria-checked') === 'true');

  const place = animate => {
    const b = buttons[current];
    if (animate) {
      px.to(b.offsetLeft);
      pw.to(b.offsetWidth);
    } else {
      px.set(b.offsetLeft);
      pw.set(b.offsetWidth);
    }
  };
  const select = (i, focus) => {
    if (i === current) return;
    current = i;
    buttons.forEach((b, j) => {
      b.setAttribute('aria-checked', String(j === i));
      b.tabIndex = j === i ? 0 : -1;
    });
    if (focus) buttons[i].focus();
    place(true);
    onChange(buttons[i].dataset.value);
  };
  buttons.forEach((b, i) => {
    b.tabIndex = i === current ? 0 : -1;
    b.addEventListener('click', () => select(i));
  });
  root.addEventListener('keydown', e => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    select((current + dir + buttons.length) % buttons.length, true);
  });
  new ResizeObserver(() => place(false)).observe(root);
  place(false);
}

/* ---------- Lojas ---------- */
function renderStores() {
  const grid = $('#store-grid');
  const isRefurb = s => s.kind === 'refurb' || /Recondicionado|Renewed|Restored|Refurbished|Open-Box/.test(s.sells);
  grid.innerHTML = STORES.map(s => {
    const kindLabel = { oficial: 'Oficial Apple', varejo: 'Varejo', refurb: 'Recondicionados' }[s.kind];
    const tags = [s.kind, isRefurb(s) ? 'refurb' : ''].join(' ');
    return `<article class="store" data-tags="${tags}">
      <span class="store-kind store-kind--${s.kind}">${kindLabel}</span>
      <h3 class="store-name">${s.name}</h3>
      <p class="store-sells">${s.sells}</p>
      <dl class="store-facts">
        <div><dt>Garantia</dt><dd>${s.warranty}</dd></div>
        <div><dt>Devolução</dt><dd>${s.returns}</dd></div>
      </dl>
      <p class="store-tip">${s.tip}</p>
      <ul class="store-list">
        ${s.pros.map(p => `<li class="pro">${ICON.check}<span>${p}</span></li>`).join('')}
        ${s.cons.map(c => `<li class="con">${ICON.minus}<span>${c}</span></li>`).join('')}
      </ul>
      <a class="store-link" href="${s.url}" target="_blank" rel="noopener" aria-label="Abrir o site da ${s.name} (nova aba)">Abrir site <span aria-hidden="true">↗</span></a>
    </article>`;
  }).join('');

  initSegmented($('#store-filter'), value => {
    $$('.store', grid).forEach(card => {
      const visible = value === 'all' || card.dataset.tags.split(' ').includes(value);
      const wasHidden = card.classList.contains('is-hidden');
      card.classList.toggle('is-hidden', !visible);
      if (visible && wasHidden) {
        card.classList.add('is-entering');
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-entering')));
      }
    });
  });
}

/* ---------- Calculadora ---------- */
function initCalculator() {
  const form = $('#calc-form');
  const modelSelect = $('#calc-model');
  const stateSelect = $('#calc-state');
  const pricesBox = $('#calc-prices');
  const customWrap = $('#calc-custom-wrap');
  const customInput = $('#calc-custom');
  const fxInput = $('#calc-fx');
  const iofInput = $('#calc-iof');
  const otherInput = $('#calc-other');
  const otherOut = $('#calc-other-out');
  const result = $('#calc-result');

  modelSelect.innerHTML = MODELS.map(m => `<option value="${m.id}">${m.name} ${m.chip} (${m.year})</option>`).join('');
  stateSelect.innerHTML = STATES.map(s => `<option value="${s.id}">${s.label} · ${pct(s.rate)}</option>`).join('');
  stateSelect.value = DEFAULTS.state;
  fxInput.value = DEFAULTS.fx.toFixed(2);
  iofInput.value = DEFAULTS.iof;
  pricesBox.setAttribute('role', 'radiogroup');
  pricesBox.setAttribute('aria-label', 'Preço na loja');

  const state = { model: 'air-m5', choice: 0 };

  function renderPriceOptions() {
    const offers = offersFor(state.model);
    pricesBox.innerHTML = offers.map((o, i) => `<button class="price-option" type="button" role="radio" data-choice="${i}" aria-checked="${state.choice === i}">
        <strong>${usd(o.price)}</strong><span>${STORE_NAMES[o.store]} · ${o.condition}</span></button>`).join('') +
      `<button class="price-option" type="button" role="radio" data-choice="custom" aria-checked="${state.choice === 'custom'}"><strong>Outro valor</strong><span>digite o preço</span></button>`;
    customWrap.hidden = state.choice !== 'custom';
  }

  pricesBox.addEventListener('click', e => {
    const opt = e.target.closest('.price-option');
    if (!opt) return;
    state.choice = opt.dataset.choice === 'custom' ? 'custom' : Number(opt.dataset.choice);
    $$('.price-option', pricesBox).forEach(b => b.setAttribute('aria-checked', String(b === opt)));
    customWrap.hidden = state.choice !== 'custom';
    if (state.choice === 'custom') customInput.focus();
    update();
  });

  // Estrutura do resultado, montada uma vez; os números mudam em mola.
  const SEGMENTS = [
    { key: 'product', label: 'Preço do MacBook', color: 'var(--series-1)' },
    { key: 'salesTax', label: 'Sales tax', color: 'var(--series-2)' },
    { key: 'iof', label: 'IOF', color: 'var(--series-3)' },
    { key: 'duty', label: 'Imposto de importação', color: 'var(--series-4)' },
  ];
  result.innerHTML = `
    <div>
      <p class="result-label">Custo final estimado</p>
      <p class="result-total" id="r-total">R$\u00a00</p>
      <p class="result-sub" id="r-sub"></p>
    </div>
    <div class="stack" id="r-stack" role="img" aria-label="">${SEGMENTS.map(s => `<span class="stack-seg" data-key="${s.key}" style="--c:${s.color}"></span>`).join('')}</div>
    <ul class="stack-legend">${SEGMENTS.map(s => `<li data-key="${s.key}"><span class="sw" style="--c:${s.color}"></span><span>${s.label}<span class="hint"></span></span><span class="val"></span></li>`).join('')}</ul>
    <div class="meter" id="r-meter">
      <div class="meter-head"><span>Cota da Receita usada</span><strong id="r-quota"></strong></div>
      <div class="meter-track"><span class="meter-fill"></span><span class="meter-mark"></span></div>
      <p class="meter-status" id="r-status"></p>
    </div>
    <div class="compare-br" id="r-br" hidden></div>
    <p class="calc-note">Estimativa. A Receita converte pelo câmbio oficial do dia e o sales tax muda de cidade para cidade. Não inclui frete, spread de conta global nem AppleCare+.</p>`;

  const totalEl = $('#r-total');
  const totalSpring = new Spring(0, { response: 0.5, damping: 1, precision: 0.5, onUpdate: v => { totalEl.textContent = brl(v); } });
  const segEls = Object.fromEntries(SEGMENTS.map(s => [s.key, $(`.stack-seg[data-key="${s.key}"]`, result)]));
  const segSprings = Object.fromEntries(SEGMENTS.map(s => [s.key, new Spring(0, { response: 0.45, damping: 1, precision: 0.05, onUpdate: v => { segEls[s.key].style.flexBasis = `${v}%`; } })]));
  const meterFill = $('.meter-fill', result);
  const meterMark = $('.meter-mark', result);
  const meterSpring = new Spring(0, { response: 0.45, damping: 1, precision: 0.05, onUpdate: v => { meterFill.style.width = `${v}%`; } });

  function currentPrice() {
    if (state.choice === 'custom') return Math.max(0, Number(customInput.value) || 0);
    const offers = offersFor(state.model);
    return offers[clamp(state.choice, 0, offers.length - 1)].price;
  }

  function update() {
    const m = byId[state.model];
    const st = stateById(stateSelect.value);
    const fx = clamp(Number(fxInput.value) || DEFAULTS.fx, 1, 20);
    const iof = clamp(Number(iofInput.value) || 0, 0, 10);
    const other = Number(otherInput.value) || 0;
    const price = currentPrice();
    const c = computeCost({ price, taxRate: st.rate, fx, iof, other });
    otherOut.textContent = usd(other);

    totalSpring.to(c.total);
    const offer = state.choice === 'custom' ? null : offersFor(state.model)[state.choice];
    $('#r-sub').textContent = `${m.name} ${m.chip} · ${offer ? STORE_NAMES[offer.store] + ' · ' : ''}${usd(price)} + ${pct(st.rate)} de sales tax · dólar a R$ ${fx.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    SEGMENTS.forEach(s => {
      const share = c.total > 0 ? (c[s.key] / c.total) * 100 : 0;
      const seg = segEls[s.key];
      if (share <= 0.01) {
        segSprings[s.key].set(0);
        seg.style.display = 'none';
      } else {
        seg.style.display = '';
        segSprings[s.key].to(share);
      }
      const li = $(`li[data-key="${s.key}"]`, result);
      $('.val', li).textContent = brl(c[s.key]);
      const hint = {
        product: `${usd(price)} × R$ ${fx.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        salesTax: `${pct(st.rate)} · ${st.label}`,
        iof: `${pct(iof)} sobre o valor pago no cartão`,
        duty: c.dutyUSD > 0 ? `50% de ${usd(Math.round(c.dutyUSD * 2))} acima da cota` : 'Dentro da cota: nada a pagar',
      }[s.key];
      $('.hint', li).textContent = hint;
    });
    $('#r-stack').setAttribute('aria-label', `Composição: ${SEGMENTS.map(s => `${s.label} ${brl(c[s.key])}`).join(', ')}`);

    const scale = Math.max(DEFAULTS.quota * 1.6, c.quotaUsed * 1.08);
    meterSpring.to((c.quotaUsed / scale) * 100);
    meterMark.style.left = `${(DEFAULTS.quota / scale) * 100}%`;
    $('#r-meter').classList.toggle('is-over', c.over);
    $('#r-quota').textContent = `${usd(Math.round(c.quotaUsed))} de ${usd(DEFAULTS.quota)}`;
    $('#r-status').className = `meter-status ${c.over ? 'meter-status--over' : 'meter-status--ok'}`;
    $('#r-status').innerHTML = c.over
      ? `${ICON.warning}<span>Passou ${usd(Math.round(c.quotaUsed - DEFAULTS.quota))} da cota: declare na e-DBV</span>`
      : `${ICON.okCircle}<span>Dentro da cota: sem imposto de importação</span>`;

    const br = $('#r-br');
    if (m.brazil) {
      const diff = m.brazil.amazon - c.total;
      br.hidden = false;
      br.innerHTML = `<span>${m.brazil.label}: ${brl(m.brazil.amazon)} na Amazon Brasil · ${brl(m.brazil.importers[0])} a ${brl(m.brazil.importers[1])} em importadoras (Pix)</span>
        <strong>${diff >= 0 ? `≈ ${brl(diff)} a menos` : `≈ ${brl(-diff)} a mais`} que na Amazon Brasil</strong>`;
    } else {
      br.hidden = true;
    }
  }

  modelSelect.addEventListener('change', () => {
    state.model = modelSelect.value;
    state.choice = 0;
    renderPriceOptions();
    update();
  });
  form.addEventListener('input', e => { if (e.target !== modelSelect) update(); });
  form.addEventListener('submit', e => e.preventDefault());

  renderPriceOptions();
  update();

  return {
    setModel(id) {
      modelSelect.value = id;
      modelSelect.dispatchEvent(new Event('change'));
    },
  };
}

/* ---------- Dicas e fontes ---------- */
function renderTips() {
  const tips = [
    ['suitcase', 'Cota de US$\u00a01.000', ['Notebook entra na cota da Receita: não conta como item de uso pessoal. O que passar de US$\u00a01.000 paga 50% de imposto. Declare na e-DBV antes de pousar.', 'O PL 2204/25, que tiraria notebooks da cota, ainda não virou lei.']],
    ['card', 'IOF de 3,5%', ['É o IOF das compras no cartão no exterior. Some o spread do banco: por isso a calculadora usa o dólar a R$\u00a05,10, acima do comercial (R$\u00a04,99 em 09/10).']],
    ['receipt', 'Sales tax no caixa', ['A etiqueta nos EUA não inclui imposto. Na Flórida some de 6,5% a 7%; em Nova York, 8,875%. Delaware, Oregon e New Hampshire não cobram. Em compra online vale o endereço de entrega.']],
    ['keyboard', 'Teclado americano', ['Não tem Ç. No macOS, escolha o layout "U.S. International – PC" ou use Option + C para digitar ç. Os acentos funcionam normalmente.']],
    ['plug', 'Tomada', ['O carregador é bivolt (100–240 V). No Brasil você só precisa de um adaptador de plugue.']],
    ['shield', 'Garantia', ['A garantia de 1 ano da Apple vale para o Mac no Brasil; guarde o recibo. A garantia de lojas como Back Market quase sempre exige envio para os EUA.']],
    ['battery', 'Recondicionado: teste na hora', ['Em Ajustes > Bateria, veja a saúde e os ciclos (o MacBook aguenta 1.000). Teste câmera, som, teclado e portas, e confira o número de série em checkcoverage.apple.com.', 'Garanta que não há Bloqueio de Ativação (iCloud) nem gerenciamento remoto (MDM) de empresa, comum em Pro 2021 de frota corporativa.']],
    ['box', 'Entrega e mala', ['A Amazon entrega no hotel (avise a recepção) ou num Amazon Locker; a Best Buy separa para retirar no mesmo dia. Leve o MacBook na bagagem de mão.']],
    ['calendar', 'Quando comprar', ['Black Friday (27/11/2026) e Cyber Monday (30/11) costumam ter os maiores descontos do ano. Em outubro o Air M5 já está US$\u00a0200 abaixo do preço da Apple.']],
  ];
  $('#tips-grid').innerHTML = tips.map(([icon, title, paragraphs]) => `<article class="tip reveal">
      <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TIP_ICON[icon]}</svg>
      <h3>${title}</h3>${paragraphs.map(p => `<p>${p}</p>`).join('')}
    </article>`).join('');
}

function renderSources() {
  $('#sources').innerHTML = SOURCES.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${label}</a></li>`).join('');
}

/* ---------- Painel de detalhes (sheet) ---------- */
function initSheet(onCalculate) {
  const root = $('#sheet');
  const panel = $('.sheet', root);
  const scrim = $('.sheet-scrim', root);
  const header = $('#sheet-header');
  const body = $('#sheet-body');
  const visual = $('#sheet-visual');
  let isOpen = false;
  let lastFocus = null;
  let height = 1;
  let currentModel = null;

  const y = new Spring(0, {
    response: 0.4,
    damping: 1,
    precision: 0.5,
    onUpdate: v => {
      panel.style.transform = `translate3d(0, ${v}px, 0)`;
      scrim.style.opacity = String(clamp(1 - v / height, 0, 1));
    },
    onRest: v => {
      if (!isOpen && v >= height - 1) root.hidden = true;
    },
  });

  function renderFinish(m, finishId) {
    visual.innerHTML = macSVG(m, finishId, { decorative: false });
    $$('.finish', body).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.finish === finishId)));
    const label = $('.sheet-finish-label', body);
    if (label) label.textContent = FINISHES[finishId].label;
  }

  function render(id) {
    const m = byId[id];
    currentModel = m;
    const tagMod = m.verdict === 'best' ? 'best' : m.verdict === 'avoid' ? 'avoid' : '';
    const offers = offersFor(id);
    body.innerHTML = `
      <div class="sheet-finishes" role="group" aria-label="Cores">${m.finishes.map(f => `<button class="finish" type="button" data-finish="${f}" style="--sw:${FINISHES[f].lid}" aria-label="${FINISHES[f].label}" aria-pressed="false"></button>`).join('')}</div>
      <p class="sheet-finish-label"></p>
      <p class="sheet-tag ${tagMod ? `sheet-tag--${tagMod}` : ''}">${m.verdictLabel}</p>
      <h2 class="sheet-title" id="sheet-title">${m.name} ${m.chip} <span class="muted">${m.year}</span></h2>
      <p class="sheet-summary">${m.summary}</p>
      <h3 class="sheet-section-title">Prós e contras</h3>
      <div class="proscons">
        <ul>${m.pros.map(p => `<li class="pro">${ICON.check}<span>${p}</span></li>`).join('')}</ul>
        <ul>${m.cons.map(c => `<li class="con">${ICON.cross}<span>${c}</span></li>`).join('')}</ul>
      </div>
      <h3 class="sheet-section-title">Onde comprar (16 GB · 512 GB)</h3>
      <ul class="offer-list">${offers.map(o => `<li class="offer">
          <span class="offer-store">${STORE_NAMES[o.store]}</span>
          <span class="offer-meta">${o.condition === 'novo' ? 'Novo' : 'Recondicionado'} · ${o.date}${o.stale ? ' (confirmar)' : ''}${o.note ? ` · ${escapeHtml(o.note)}` : ''}</span>
          <span class="offer-price">${usd(o.price)}<a href="${o.url}" target="_blank" rel="noopener">Abrir loja <span aria-hidden="true">↗</span></a></span>
        </li>`).join('')}</ul>
      <h3 class="sheet-section-title">Especificações</h3>
      <dl class="spec-list">${SPEC_ROWS.map(([key, label]) => `<div><dt>${label}</dt><dd>${escapeHtml(m.specs[key])}</dd></div>`).join('')}</dl>
      <div class="sheet-actions">
        <button class="pill-button" type="button" data-calc="${m.id}">Calcular o custo deste</button>
        <button class="text-link vcard-more" type="button" data-close>Fechar</button>
      </div>`;
    body.scrollTop = 0;
    renderFinish(m, m.finish);
  }

  function open(id) {
    render(id);
    const reopening = !root.hidden;
    if (!reopening) lastFocus = document.activeElement;
    root.hidden = false;
    isOpen = true;
    height = panel.offsetHeight + 40;
    if (!reopening) y.set(height);
    document.documentElement.classList.add('sheet-open');
    if (reducedMotion()) {
      panel.style.opacity = '0';
      y.set(0);
      requestAnimationFrame(() => { panel.style.opacity = '1'; });
    } else {
      y.to(0, { damping: 1, response: 0.42 });
    }
    panel.focus({ preventScroll: true });
  }

  function close(velocity = 0) {
    if (!isOpen) return;
    isOpen = false;
    document.documentElement.classList.remove('sheet-open');
    if (reducedMotion()) {
      panel.style.opacity = '0';
      setTimeout(() => { if (!isOpen) { root.hidden = true; y.set(height); panel.style.opacity = ''; } }, 200);
    } else {
      y.to(height, { velocity, damping: 1, response: 0.36 });
    }
    lastFocus?.focus({ preventScroll: true });
  }

  root.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) close();
    const finish = e.target.closest('.finish');
    if (finish && currentModel) renderFinish(currentModel, finish.dataset.finish);
    const calc = e.target.closest('[data-calc]');
    if (calc) {
      close();
      onCalculate(calc.dataset.calc);
    }
  });

  root.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const focusables = $$('button, a[href], [tabindex]:not([tabindex="-1"])', panel).filter(el => !el.hidden && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });

  // Arrastar a alça: 1:1, elástico para cima, decide fechar pela projeção da velocidade.
  const tracker = new VelocityTracker();
  let drag = null;
  header.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button, a')) return;
    y.stop();
    drag = { id: e.pointerId, y0: e.clientY, origin: y.value };
    tracker.reset();
    tracker.add(e.clientY);
    header.setPointerCapture(e.pointerId);
  });
  header.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    tracker.add(e.clientY);
    let v = drag.origin + (e.clientY - drag.y0);
    if (v < 0) v = rubberband(v, height);
    y.set(v);
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    tracker.add(e.clientY);
    const velocity = tracker.velocity;
    const landing = y.value + project(velocity);
    if (landing > height * 0.42) {
      isOpen = true;
      close(velocity);
    } else {
      isOpen = true;
      root.hidden = false;
      document.documentElement.classList.add('sheet-open');
      y.to(0, { velocity, damping: Math.abs(velocity) > 400 ? 0.82 : 1, response: 0.36 });
    }
  };
  header.addEventListener('pointerup', end);
  header.addEventListener('pointercancel', end);

  window.addEventListener('resize', () => { if (!root.hidden) height = panel.offsetHeight + 40; });

  return { open, close };
}

/* ---------- Hero: a tampa abre com a rolagem ---------- */
function initHero() {
  const hero = $('#inicio');
  const mac = $('#hero-mac');
  const hint = $('#hero-hint');
  const finish = FINISHES['azul-ceu'];
  mac.style.setProperty('--lid', finish.lid);
  mac.style.setProperty('--edge', finish.edge);
  const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  onScroll(() => {
    const p = reducedMotion() ? 1 : pinnedProgress(hero);
    mac.style.setProperty('--open', (0.22 + 0.78 * easeInOut(range(p, 0, 0.5))).toFixed(4));
    mac.style.setProperty('--screen', easeInOut(range(p, 0.25, 0.55)).toFixed(4));
    mac.style.setProperty('--widget', easeInOut(range(p, 0.5, 0.75)).toFixed(4));
    hint.style.opacity = String(1 - range(p, 0, 0.15));
  });
}

/* ---------- Parágrafo que acende palavra por palavra ---------- */
function initLede() {
  const lede = $('#lede');
  const words = [];
  const wrap = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = part;
          words.push(span);
          frag.append(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrap(child);
      }
    });
  };
  wrap(lede);
  onScroll(() => {
    const p = reducedMotion() ? 1 : viewProgress(lede, 0.88, 0.3);
    const lit = p * (words.length + 6);
    words.forEach((w, i) => { w.style.setProperty('--o', (0.16 + 0.84 * clamp((lit - i) / 6, 0, 1)).toFixed(3)); });
  });
}

/* ---------- Linha do tempo: cada rolada troca o modelo ---------- */
const TIMELINE = [
  ['pro-2019', 'O último Intel. Teclado bom, mas esquenta, dura 11 h e não recebe o macOS 27.'],
  ['pro-2021', 'O Apple Silicon chega ao Pro: tela mini-LED de 120 Hz, HDMI, leitor SD e até 21 h de bateria.'],
  ['air-m2', 'Nasce o Air de 15″: 1,51 kg, 1,15 cm e nenhuma ventoinha.'],
  ['air-m3', 'Chip M3, Wi-Fi 6E e dois monitores externos com a tampa fechada.'],
  ['air-m4', '16 GB viram padrão, câmera de 12 MP Center Stage e dois monitores com a tampa aberta.'],
  ['air-m5', '512 GB de série, Wi-Fi 7 e o chip mais rápido da lista. Em junho, a Apple subiu o preço para US$\u00a01.499.'],
];

function initTimeline() {
  const section = $('#linha-do-tempo');
  const models = TIMELINE.map(([id]) => byId[id]);
  $('#tl-steps').innerHTML = TIMELINE.map(([id, text]) => {
    const m = byId[id];
    return `<article class="tl-step"><p class="tl-year">${m.year}</p><h3 class="tl-name">${m.name} ${m.chip}</h3><p class="tl-text">${text}</p></article>`;
  }).join('');
  $('#tl-macs').innerHTML = models.map(m => `<div class="tl-mac">${macSVG(m)}</div>`).join('');
  const rail = $('#tl-rail');
  rail.innerHTML = `<span class="tl-rail-line"></span><span class="tl-rail-fill"></span>${models.map(m => `<span class="tl-tick">${m.year}</span>`).join('')}`;

  const steps = $$('.tl-step', section);
  const macs = $$('.tl-mac', section);
  const ticks = $$('.tl-tick', rail);
  const line = $('.tl-rail-line', rail);
  const fill = $('.tl-rail-fill', rail);
  const score = $('#tl-score');
  const meter = $('#tl-fill');
  let railStart = 0;
  let railLength = 0;
  const measureRail = () => {
    const base = rail.getBoundingClientRect().left;
    const centers = ticks.map(t => { const r = t.getBoundingClientRect(); return r.left - base + r.width / 2; });
    railStart = centers[0];
    railLength = centers[centers.length - 1] - centers[0];
    line.style.left = fill.style.left = `${railStart}px`;
    line.style.width = `${railLength}px`;
  };
  new ResizeObserver(() => { measureRail(); queueScroll(); }).observe(rail);

  const localnav = $('#localnav');
  onScroll(() => {
    // Sub-navegação escura enquanto a seção escura passa por baixo dela.
    const r = section.getBoundingClientRect();
    localnav.classList.toggle('localnav--dark', r.top <= LOCALNAV_H && r.bottom > LOCALNAV_H);
    const p = pinnedProgress(section);
    const t = p * (models.length - 1);
    const reduce = reducedMotion();
    steps.forEach((step, i) => {
      const d = t - i;
      // O texto sai antes de o próximo entrar (nunca dois anos sobrepostos); o Mac faz um crossfade curto.
      const textOpacity = clamp(1 - (Math.abs(d) - 0.22) / 0.28, 0, 1);
      const macOpacity = clamp(1 - (Math.abs(d) - 0.2) / 0.4, 0, 1);
      step.style.opacity = String(textOpacity);
      step.style.transform = reduce ? '' : `translateY(${(-d * 40).toFixed(1)}px)`;
      step.style.visibility = textOpacity === 0 ? 'hidden' : '';
      step.setAttribute('aria-hidden', String(textOpacity < 0.5));
      const mac = macs[i];
      mac.style.opacity = String(macOpacity);
      mac.style.transform = reduce ? '' : `translateX(${(-d * 56).toFixed(1)}px) scale(${(1 - Math.min(Math.abs(d), 1) * 0.06).toFixed(3)})`;
    });
    const active = Math.round(t);
    ticks.forEach((tick, i) => {
      tick.classList.toggle('is-active', i === active);
      tick.classList.toggle('is-past', i <= t + 0.001);
    });
    fill.style.width = `${railLength * p}px`;
    const lo = Math.floor(t);
    const hi = Math.min(models.length - 1, lo + 1);
    const value = lerp(models[lo].gb6.single, models[hi].gb6.single, t - lo);
    score.textContent = `≈ ${thousands(Math.round(value / 10) * 10)}`;
    meter.style.width = `${(value / 4500) * 100}%`;
  });
}

/* ---------- Navegação ---------- */
function initNav() {
  const button = $('.menu-button');
  const panel = $('#menu-panel');
  const setOpen = open => {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    panel.hidden = !open;
  };
  button.addEventListener('click', () => setOpen(panel.hidden));
  panel.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); button.focus(); } });
  document.addEventListener('pointerdown', e => { if (!panel.hidden && !e.target.closest('.globalnav')) setOpen(false); });

  // Borda da sub-navegação só quando ela gruda no topo.
  const localnav = $('#localnav');
  new IntersectionObserver(([entry]) => localnav.classList.toggle('is-stuck', !entry.isIntersecting)).observe($('#globalnav'));
}

function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
}

/* ---------- Início ---------- */
renderVerdict();
renderCarousel();
renderPerf();
initSpecs();
renderStores();
renderTips();
renderSources();
const tooltip = createTooltip();
renderPriceChart(tooltip);
const calculator = initCalculator();
const sheet = initSheet(id => {
  calculator.setModel(id);
  $('#calculadora').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
});
initCarousel(id => sheet.open(id));
document.addEventListener('click', e => {
  const opener = e.target.closest('.vcard-more[data-open]');
  if (opener) sheet.open(opener.dataset.open);
});
initHero();
initLede();
initTimeline();
initNav();
initReveal();
