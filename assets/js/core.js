// Peças compartilhadas pelas páginas do Mac na Mala (comparativo e rastreador de ofertas).
import { DEFAULTS, FINISHES, STATES } from './data.js';
import { Spring, clamp, reducedMotion } from './spring.js';

/* ---------- Utilidades ---------- */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const usd = value => {
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return 'US$\u00a0' + value.toLocaleString('pt-BR', { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: hasCents ? 2 : 0 });
};
export const brl = value => 'R$\u00a0' + Math.round(value).toLocaleString('pt-BR');
export const pct = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) + '%';
export const thousands = value => value.toLocaleString('pt-BR');
export const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Motor de rolagem: um único listener, tudo 1:1 com o scroll ---------- */
const scrollJobs = [];
let scrollQueued = false;
const runScrollJobs = () => {
  scrollQueued = false;
  for (const job of scrollJobs) job();
};
export const queueScroll = () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(runScrollJobs);
};
addEventListener('scroll', queueScroll, { passive: true });
addEventListener('resize', queueScroll);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', queueScroll);
export const onScroll = job => {
  scrollJobs.push(job);
  queueScroll();
};
// 0 quando o topo do elemento está em `start` (fração da janela), 1 quando chega em `end`.
export const viewProgress = (el, start, end) => {
  const top = el.getBoundingClientRect().top;
  return clamp((innerHeight * start - top) / (innerHeight * (start - end)), 0, 1);
};
// Progresso dentro de uma seção com conteúdo fixo (sticky) logo abaixo da sub-navegação.
export const LOCALNAV_H = 52;
export const pinnedProgress = el => {
  const r = el.getBoundingClientRect();
  const total = r.height - (innerHeight - LOCALNAV_H);
  return clamp((LOCALNAV_H - r.top) / Math.max(1, total), 0, 1);
};
export const easeOut = t => 1 - (1 - t) ** 3;
export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const lerp = (a, b, t) => a + (b - a) * t;

export const stateById = id => STATES.find(s => s.id === id) || STATES[0];

export const ICON = {
  check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  minus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  cross: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 2.8 19.5h18.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9.5v4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  okCircle: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8 12.5 2.7 2.7L16.2 9.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

export const TIP_ICON = {
  suitcase: '<path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><rect x="4" y="7" width="16" height="13" rx="2.5"/><path d="M9 11v5M15 11v5"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  receipt: '<path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.2-1.5 1.2-2-1.5L6 20.5z"/><path d="m9.5 14.5 5-5"/><circle cx="10" cy="10" r=".6"/><circle cx="14" cy="14" r=".6"/>',
  keyboard: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7.5 14h9"/>',
  plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
  battery: '<rect x="2.5" y="7.5" width="17" height="9" rx="2"/><path d="M21.5 10.5v3M6 10.5v3M9 10.5v3M12 10.5v3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2"/>',
  box: '<path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5h16v1a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.3 0z"/><path d="M5.5 12.5V20h13v-7.5M10 20v-4.5h4V20"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01"/>',
};

/* ---------- Ilustração do MacBook (SVG) ---------- */
let svgUid = 0;
export function macSVG(model, finishId = model.finish, { decorative = true } = {}) {
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
// `taxInQuota`: a Receita usa o valor da nota, que nos EUA já inclui o sales tax (padrão conservador).
export function computeCost({ price, taxRate, fx, iof, other = 0, taxInQuota = true }) {
  const salesTax = price * taxRate / 100;
  const paid = price + salesTax;
  const declared = taxInQuota ? paid : price;
  const excessWith = Math.max(0, other + declared - DEFAULTS.quota);
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
    quotaUsed: other + declared,
    over: other + declared > DEFAULTS.quota,
  };
}
// Maior preço de etiqueta que ainda cabe na cota (sem outras compras).
export const quotaCeiling = (taxRate, { other = 0, taxInQuota = true } = {}) =>
  Math.max(0, DEFAULTS.quota - other) / (taxInQuota ? 1 + taxRate / 100 : 1);
export const defaultCost = price => computeCost({ price, taxRate: stateById(DEFAULTS.state).rate, fx: DEFAULTS.fx, iof: DEFAULTS.iof });

export function createTooltip() {
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
export function initSegmented(root, onChange) {
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

/* ---------- Seções fixas com paradas (linha do tempo e Raio-X) ---------- */
// O texto sai antes de o próximo entrar (nunca dois sobrepostos); o visual faz um crossfade curto.
export function applyStops(t, steps, visuals) {
  const reduce = reducedMotion();
  steps.forEach((step, i) => {
    const d = t - i;
    const textOpacity = clamp(1 - (Math.abs(d) - 0.22) / 0.28, 0, 1);
    const visualOpacity = clamp(1 - (Math.abs(d) - 0.2) / 0.4, 0, 1);
    step.style.opacity = String(textOpacity);
    step.style.transform = reduce ? '' : `translateY(${(-d * 40).toFixed(1)}px)`;
    step.style.visibility = textOpacity === 0 ? 'hidden' : '';
    step.setAttribute('aria-hidden', String(textOpacity < 0.5));
    const visual = visuals?.[i];
    if (!visual) return;
    visual.style.opacity = String(visualOpacity);
    visual.style.visibility = visualOpacity === 0 ? 'hidden' : '';
    visual.style.transform = reduce ? '' : `translateX(${(-d * 56).toFixed(1)}px) scale(${(1 - Math.min(Math.abs(d), 1) * 0.06).toFixed(3)})`;
  });
}

/* ---------- Navegação ---------- */
export function initNav() {
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

  // Sub-navegação escura enquanto uma seção escura passa por baixo dela.
  const darkSections = $$('[data-nav-dark]');
  onScroll(() => {
    const dark = darkSections.some(sec => {
      const r = sec.getBoundingClientRect();
      return r.top <= LOCALNAV_H + 1 && r.bottom > LOCALNAV_H;
    });
    localnav.classList.toggle('localnav--dark', dark);
  });
}

export function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
}
