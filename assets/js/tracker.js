import { DEFAULTS, MODELS } from './data.js';
import {
  TRACKER_CHECKED, SIZES, TK_STORES, CONDITIONS, OFFERS, HISTORY, APPLE_STEPS, PRICE_HIKE, RECORDS, SINCE_HIKE,
  BRAZIL, CITIES, DEFAULT_CITY, CALENDAR, ALERTS, TRACKER_SOURCES,
} from './deals.js';
import { Spring, clamp, reducedMotion } from './spring.js';
import {
  $, $$, usd, brl, pct, escapeHtml, onScroll, queueScroll, viewProgress, pinnedProgress, easeInOut, lerp,
  ICON, TIP_ICON, macSVG, computeCost, quotaCeiling, createTooltip, initSegmented, applyStops, initNav, initReveal,
} from './core.js';

const M5 = MODELS.find(m => m.id === 'air-m5');

/* ---------- Datas ---------- */
const DAY = 864e5;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDate = s => s.split('-').reverse().join('/');
const fmtShort = s => fmtDate(s).slice(0, 5);
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const daysSince = s => Math.round((today() - parseISO(s)) / DAY);
const whenText = o => o.when || fmtDate(o.date);
const agoText = s => {
  const d = daysSince(s);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
};
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/* ---------- Preferências (salvas neste aparelho) ---------- */
const KEY_SETTINGS = 'macnamala:tracker-settings';
const KEY_MINE = 'macnamala:tracker-mine';
const readJSON = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado: segue sem salvar */ }
};

const settings = {
  size: '13', city: DEFAULT_CITY, fx: DEFAULTS.fx, iof: DEFAULTS.iof, other: 0, taxInQuota: true,
  filter: 'all', unit: 'usd', trip: { from: '', to: '' },
  ...readJSON(KEY_SETTINGS, {}),
};
if (!SIZES[settings.size]) settings.size = '13';
if (!CITIES.some(c => c.id === settings.city)) settings.city = DEFAULT_CITY;
if (!Number.isFinite(settings.fx) || settings.fx < 1) settings.fx = DEFAULTS.fx;
if (!Number.isFinite(settings.iof)) settings.iof = DEFAULTS.iof;
if (!Number.isFinite(settings.other)) settings.other = 0;
if (!settings.trip || typeof settings.trip !== 'object') settings.trip = { from: '', to: '' };

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
let mine = readJSON(KEY_MINE, []);
if (!Array.isArray(mine)) mine = [];
mine = mine.filter(e => e && SIZES[e.size] && Number.isFinite(e.price) && ISO_RE.test(e.date));

const listeners = [];
const subscribe = fn => { listeners.push(fn); fn(); };
const commit = () => {
  writeJSON(KEY_SETTINGS, settings);
  listeners.forEach(fn => fn());
  queueScroll();
};
const saveMine = () => { writeJSON(KEY_MINE, mine); commit(); };

/* ---------- Contas ---------- */
const cityById = id => CITIES.find(c => c.id === id);
const city = () => cityById(settings.city);
const size = () => SIZES[settings.size];
const costOf = (price, c = city()) => computeCost({
  price, taxRate: c.rate, fx: settings.fx, iof: settings.iof, other: settings.other, taxInQuota: settings.taxInQuota,
});
const ceilingFor = (c = city()) => quotaCeiling(c.rate, { other: settings.other, taxInQuota: settings.taxInQuota });
const fees = cost => cost.salesTax + cost.iof + cost.duty;
const savingPct = (total, br) => Math.round((1 - total / br) * 100);
const fx2 = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const storeName = o => (o.store === 'outra' ? 'Outra loja' : TK_STORES[o.store]?.name || o.store);
const channelOf = o => o.channel || TK_STORES[o.store]?.channel || 'online';
const CHANNEL_LABEL = { online: 'Online', loja: 'Loja física', ambos: 'Loja e online' };
const mineOffers = () => mine.map(e => ({ ...e, mine: true, stale: daysSince(e.date) > 30 }));
const offersFor = s => [...OFFERS, ...mineOffers()].filter(o => o.size === s);
const liveOffers = s => offersFor(s).filter(o => !o.stale).sort((a, b) => a.price - b.price);
const bestOffer = s => liveOffers(s)[0];
// Os registros do usuário são recriados a cada leitura: compare pela identidade do anúncio, não do objeto.
const offerKey = o => (o.mine ? o.id : `${o.store}|${o.condition}|${o.price}|${o.date}`);
const sameOffer = (a, b) => Boolean(a && b) && offerKey(a) === offerKey(b);
const bestNew = s => liveOffers(s).find(o => o.condition === 'novo');
const matchesFilter = (o, f) => {
  if (f === 'online') return channelOf(o) !== 'loja';
  if (f === 'loja') return channelOf(o) !== 'online';
  if (f === 'usado') return o.condition !== 'novo';
  return true;
};
const isStoreRecord = o => RECORDS[o.size]?.some(r => r.store === o.store && r.condition === o.condition && o.price <= r.price);
const allTimeLow = s => Math.min(...HISTORY[s].map(h => h.price));
const brBest = s => BRAZIL[s].best;

const SEGMENTS = [
  { key: 'product', label: 'Preço do MacBook', color: 'var(--series-1)' },
  { key: 'salesTax', label: 'Sales tax', color: 'var(--series-2)' },
  { key: 'iof', label: 'IOF', color: 'var(--series-3)' },
  { key: 'duty', label: 'Imposto de importação', color: 'var(--series-4)' },
];
const segmentHint = (key, price, cost, c) => ({
  product: `${usd(price)} × R$ ${fx2(settings.fx)}`,
  salesTax: `${pct(c.rate)} em ${c.short}`,
  iof: `${pct(settings.iof)} sobre o que passou no cartão`,
  duty: cost.dutyUSD > 0 ? `50% de ${usd(Math.round(cost.dutyUSD * 2))} acima da cota` : 'Dentro da cota: nada a pagar',
}[key]);
const contextLine = () => `${size().name} M5 · ${size().config.split(' · GPU')[0]} · ${city().short} (${pct(city().rate)}) · dólar a R$ ${fx2(settings.fx)}`;

/* ---------- Hero: o preço cai com a rolagem ---------- */
function initHero() {
  const hero = $('#inicio');
  const stage = $('#tk-hero-stage');
  const hint = $('#tk-hero-hint');
  stage.innerHTML = ['13', '15'].map(s => `
    <figure class="tk-hm" data-size="${s}">
      <div class="tk-hm-mac">${macSVG(M5, SIZES[s].finish)}</div>
      <figcaption class="tk-hm-cap">
        <span class="tk-hm-size">${SIZES[s].short}</span>
        <span class="tk-hm-was"><span class="tk-hm-was-text"></span><span class="tk-hm-strike"></span></span>
        <strong class="tk-hm-now"></strong>
        <span class="tk-hm-final"></span>
      </figcaption>
    </figure>`).join('');
  const figs = $$('.tk-hm', stage).map(fig => {
    const s = fig.dataset.size;
    return {
      s,
      was: $('.tk-hm-was', fig), wasText: $('.tk-hm-was-text', fig), strike: $('.tk-hm-strike', fig),
      now: $('.tk-hm-now', fig), final: $('.tk-hm-final', fig),
    };
  });
  let values = [];
  subscribe(() => {
    values = figs.map(f => {
      const best = bestOffer(f.s);
      const cost = costOf(best.price);
      f.wasText.textContent = `${usd(SIZES[f.s].apple)} na Apple`;
      f.final.innerHTML = `<b>${brl(cost.total)}</b> no fim, em ${escapeHtml(city().short)}<span>${brl(brBest(f.s).price)} no Brasil</span>`;
      return { from: SIZES[f.s].apple, to: best.price };
    });
    queueScroll();
  });
  const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  onScroll(() => {
    const p = reducedMotion() ? 1 : pinnedProgress(hero);
    const drop = easeInOut(range(p, 0.06, 0.5));
    const reveal = easeInOut(range(p, 0.5, 0.8));
    figs.forEach((f, i) => {
      const { from, to } = values[i];
      const v = lerp(from, to, drop);
      f.now.textContent = usd(drop >= 1 ? to : Math.round(v));
      f.was.style.opacity = String(drop);
      f.strike.style.transform = `scaleX(${drop})`;
      f.final.style.opacity = String(reveal);
      f.final.style.transform = reducedMotion() ? '' : `translateY(${((1 - reveal) * 12).toFixed(1)}px)`;
    });
    hint.style.opacity = String(1 - range(p, 0, 0.12));
  });
}

/* ---------- Controles (tamanho, cidade, câmbio) ---------- */
function cityOptions(select, selected) {
  const groups = [...new Set(CITIES.map(c => c.metro))];
  select.innerHTML = groups.map(g => `<optgroup label="${escapeHtml(g)}">${CITIES.filter(c => c.metro === g)
    .map(c => `<option value="${c.id}"${c.id === selected ? ' selected' : ''}>${escapeHtml(c.metro === 'Atlanta' ? c.label : c.short)} · ${pct(c.rate)}</option>`).join('')}</optgroup>`).join('');
}

function setRadio(root, value) {
  $$('button', root).forEach(b => b.setAttribute('aria-checked', String(b.dataset.value === value)));
}

function initControls() {
  const sizeSeg = $('#tk-size');
  setRadio(sizeSeg, settings.size);
  initSegmented(sizeSeg, v => { settings.size = v; commit(); });

  const citySelect = $('#tk-city');
  cityOptions(citySelect, settings.city);
  citySelect.addEventListener('change', () => { settings.city = citySelect.value; commit(); });

  const fx = $('#tk-fx');
  const iof = $('#tk-iof');
  const other = $('#tk-other');
  const otherOut = $('#tk-other-out');
  const taxQuota = $('#tk-taxquota');
  fx.value = settings.fx.toFixed(2);
  iof.value = settings.iof;
  other.value = settings.other;
  otherOut.textContent = usd(settings.other);
  taxQuota.checked = settings.taxInQuota;
  const readNumbers = () => {
    settings.fx = clamp(Number(fx.value) || DEFAULTS.fx, 1, 20);
    settings.iof = clamp(Number(iof.value) || 0, 0, 10);
    settings.other = clamp(Number(other.value) || 0, 0, 1000);
    settings.taxInQuota = taxQuota.checked;
    otherOut.textContent = usd(settings.other);
    commit();
  };
  $('#tk-controls').addEventListener('input', e => { if (e.target !== citySelect) readNumbers(); });
  $('#tk-controls').addEventListener('submit', e => e.preventDefault());

  // Outras seções trocam a cidade (lista de cidades): mantém o select em dia.
  subscribe(() => { if (citySelect.value !== settings.city) citySelect.value = settings.city; });
}

/* ---------- Melhor oferta ---------- */
function initBest() {
  const root = $('#tk-best');
  root.innerHTML = `
    <article class="tk-best-card">
      <div class="tk-best-main">
        <p class="tk-best-eyebrow" id="b-eyebrow"></p>
        <h3 class="tk-best-store" id="b-store"></h3>
        <p class="tk-best-tags" id="b-tags"></p>
        <p class="tk-best-price"><strong id="b-price"></strong><s id="b-was"></s></p>
        <p class="tk-best-meta" id="b-meta"></p>
        <p class="tk-best-link" id="b-link"></p>
        <div class="tk-best-final">
          <p class="result-label">Você paga no fim</p>
          <p class="result-total" id="b-total">R$ 0</p>
          <p class="result-sub" id="b-sub"></p>
        </div>
        <div class="tk-best-br" id="b-br"></div>
      </div>
      <div class="tk-best-side">
        <div class="stack" id="b-stack" role="img">${SEGMENTS.map(s => `<span class="stack-seg" data-key="${s.key}" style="--c:${s.color}"></span>`).join('')}</div>
        <ul class="stack-legend">${SEGMENTS.map(s => `<li data-key="${s.key}"><span class="sw" style="--c:${s.color}"></span><span>${s.label}<span class="hint"></span></span><span class="val"></span></li>`).join('')}
          <li class="stack-total"><span></span><span>Total</span><span class="val" id="b-total-row"></span></li></ul>
        <div class="meter" id="b-meter">
          <div class="meter-head"><span>Cota da Receita usada</span><strong id="b-quota"></strong></div>
          <div class="meter-track"><span class="meter-fill"></span><span class="meter-mark"></span></div>
          <p class="meter-status" id="b-status"></p>
        </div>
        <p class="tk-best-goal" id="b-goal"></p>
      </div>
    </article>`;

  const totalEl = $('#b-total');
  const totalSpring = new Spring(0, { response: 0.5, damping: 1, precision: 0.5, onUpdate: v => { totalEl.textContent = brl(v); } });
  const segEls = Object.fromEntries(SEGMENTS.map(s => [s.key, $(`.stack-seg[data-key="${s.key}"]`, root)]));
  const meterFill = $('.meter-fill', root);
  const meterMark = $('.meter-mark', root);
  const meterSpring = new Spring(0, { response: 0.45, damping: 1, precision: 0.05, onUpdate: v => { meterFill.style.width = `${v}%`; } });

  subscribe(() => {
    const s = settings.size;
    const c = city();
    const best = bestOffer(s);
    const cost = costOf(best.price);
    const br = brBest(s);
    const newBest = bestNew(s);

    $('#b-eyebrow').textContent = `Melhor oferta · ${size().name} M5 · ${size().config.split(' · GPU')[0]}`;
    $('#b-store').textContent = storeName(best);
    $('#b-link').innerHTML = best.url ? `<a class="text-link" href="${best.url}" target="_blank" rel="noopener">Ver na loja<span class="visually-hidden"> ${escapeHtml(storeName(best))} (abre em nova aba)</span> ↗</a>` : '';
    $('#b-tags').innerHTML = [CONDITIONS[best.condition], CHANNEL_LABEL[channelOf(best)], best.mine ? 'Você registrou' : '']
      .filter(Boolean).map(t => `<span class="tag">${t}</span>`).join('');
    $('#b-price').textContent = usd(best.price);
    $('#b-was').textContent = best.price < size().apple ? `${usd(size().apple)} na Apple` : '';
    const meta = [`Visto em ${whenText(best)} (${agoText(best.date)})`];
    if (best.note) meta.push(escapeHtml(best.note));
    if (newBest && !sameOffer(newBest, best)) meta.push(`Melhor preço de novo: ${usd(newBest.price)} em ${escapeHtml(storeName(newBest))}`);
    $('#b-meta').innerHTML = meta.join(' · ');

    totalSpring.to(cost.total);
    $('#b-sub').textContent = `Comprando em ${c.short}, com sales tax, IOF e imposto de importação.`;
    $('#b-total-row').textContent = brl(cost.total);
    const diff = br.price - cost.total;
    $('#b-br').innerHTML = `
      <span class="tk-best-br-label">No Brasil: <b>${brl(br.price)}</b> (${escapeHtml(br.store)}, à vista)</span>
      <strong class="tk-best-br-diff">${diff >= 0 ? `Você economiza ${brl(diff)} · ${savingPct(cost.total, br.price)}% a menos` : `Sai ${brl(-diff)} mais caro que no Brasil`}</strong>`;

    SEGMENTS.forEach(seg => {
      const share = cost.total > 0 ? (cost[seg.key] / cost.total) * 100 : 0;
      segEls[seg.key].style.display = share <= 0.01 ? 'none' : '';
      segEls[seg.key].style.flexBasis = `${share}%`;
      const li = $(`li[data-key="${seg.key}"]`, root);
      $('.val', li).textContent = brl(cost[seg.key]);
      $('.hint', li).textContent = segmentHint(seg.key, best.price, cost, c);
    });
    $('#b-stack').setAttribute('aria-label', `Composição do custo: ${SEGMENTS.map(seg => `${seg.label} ${brl(cost[seg.key])}`).join(', ')}`);

    const scale = Math.max(DEFAULTS.quota * 1.6, cost.quotaUsed * 1.08);
    meterSpring.to((cost.quotaUsed / scale) * 100);
    meterMark.style.left = `${(DEFAULTS.quota / scale) * 100}%`;
    $('#b-meter').classList.toggle('is-over', cost.over);
    $('#b-quota').textContent = `${usd(Math.round(cost.quotaUsed))} de ${usd(DEFAULTS.quota)}`;
    $('#b-status').className = `meter-status ${cost.over ? 'meter-status--over' : 'meter-status--ok'}`;
    $('#b-status').innerHTML = cost.over
      ? `${ICON.warning}<span>Passa ${usd(Math.round(cost.quotaUsed - DEFAULTS.quota))} da cota: declare na e-DBV e pague ${brl(cost.duty)}</span>`
      : `${ICON.okCircle}<span>Dentro da cota: sem imposto de importação</span>`;

    const ceiling = ceilingFor();
    const gap = best.price - ceiling;
    $('#b-goal').innerHTML = gap > 0
      ? `Para entrar na cota em ${escapeHtml(c.short)}, a etiqueta precisa ser de até <b>${usd(Math.floor(ceiling))}</b>. Faltam ${usd(Math.ceil(gap))} de desconto.`
      : `Esta oferta cabe na cota em ${escapeHtml(c.short)} (teto de ${usd(Math.floor(ceiling))} de etiqueta).`;
  });
}

/* ---------- Lista de ofertas ---------- */
function initOffers() {
  const list = $('#tk-offers');
  const filterSeg = $('#tk-filter');
  setRadio(filterSeg, settings.filter);
  initSegmented(filterSeg, v => { settings.filter = v; commit(); });

  subscribe(() => {
    const s = settings.size;
    const ceiling = ceilingFor();
    const br = brBest(s).price;
    const best = bestOffer(s);
    const all = offersFor(s).filter(o => matchesFilter(o, settings.filter))
      .map(o => ({ o, cost: costOf(o.price) }))
      .sort((a, b) => (a.o.stale - b.o.stale) || (a.cost.total - b.cost.total));
    const row = ({ o, cost }) => {
      const badges = [];
      if (!o.stale && sameOffer(o, best)) badges.push('<span class="tag tag--best">Melhor agora</span>');
      if (!o.stale && isStoreRecord(o)) badges.push('<span class="tag tag--record">Menor preço já visto aqui</span>');
      if (!o.stale && o.condition === 'novo' && o.price <= SINCE_HIKE[s].price) badges.push('<span class="tag tag--record">Mínima desde o aumento</span>');
      if (o.mine) badges.push('<span class="tag">Você registrou</span>');
      const fits = o.price <= ceiling + 0.001;
      const quota = fits
        ? `<span class="tk-quota tk-quota--ok">${ICON.check}Cabe na cota</span>`
        : `<span class="tk-quota tk-quota--over">+${usd(Math.ceil(cost.quotaUsed - DEFAULTS.quota))} acima · imposto ${brl(cost.duty)}</span>`;
      const diff = br - cost.total;
      const name = escapeHtml(storeName(o));
      return `<li class="tk-offer${sameOffer(o, best) ? ' is-best' : ''}${o.stale ? ' is-stale' : ''}">
        <div class="tk-offer-store"><strong>${o.url ? `<a href="${o.url}" target="_blank" rel="noopener">${name}<span class="visually-hidden"> (abre em nova aba)</span></a>` : name}</strong>
          <span>${CHANNEL_LABEL[channelOf(o)]} · ${CONDITIONS[o.condition]}</span></div>
        <div class="tk-offer-price"><strong>${usd(o.price)}</strong><span>${o.stale ? `preço antigo · ${whenText(o)}` : `${o.when || fmtShort(o.date)} · ${agoText(o.date)}`}</span></div>
        <div class="tk-offer-quota">${quota}</div>
        <div class="tk-offer-final"><strong>${brl(cost.total)}</strong><span>${diff >= 0 ? `${brl(diff)} a menos que no Brasil` : `${brl(-diff)} a mais que no Brasil`}</span></div>
        ${badges.length || o.note ? `<p class="tk-offer-note">${badges.join('')}${o.note ? `<span>${escapeHtml(o.note)}</span>` : ''}</p>` : ''}
      </li>`;
    };
    const fresh = all.filter(x => !x.o.stale);
    const stale = all.filter(x => x.o.stale);
    list.innerHTML = (fresh.length ? fresh.map(row).join('') : '<li class="tk-empty">Nenhuma oferta atual com esse filtro.</li>') +
      (stale.length ? `<li class="tk-offers-divider">Preços antigos, só para referência</li>${stale.map(row).join('')}` : '');
    $('#tk-offers-note').textContent = `Custo final calculado para ${city().short}, com dólar a R$ ${fx2(settings.fx)} e IOF de ${pct(settings.iof)}. Preços sem imposto, como aparecem na loja. Ofertas consultadas até ${fmtDate(TRACKER_CHECKED)}.`;
  });
}

/* ---------- A conta: cascata fixa ---------- */
function initWaterfall() {
  const section = $('#conta');
  const stepsBox = $('#wf-steps');
  const visual = $('#wf-visual');
  const W = 560;
  const H = 400;
  const BASE = 344;
  const TOP = 44;
  const COLS = ['Etiqueta', 'Sales tax', 'IOF', 'Imposto', 'Total', 'Brasil'];
  const slot = (W - 24) / COLS.length;
  const bw = Math.min(58, slot * 0.66);
  const colX = i => 12 + i * slot + (slot - bw) / 2;
  let model = null;
  let steps = [];

  subscribe(() => {
    const s = settings.size;
    const c = city();
    const best = bestOffer(s);
    const cost = costOf(best.price);
    const br = brBest(s);
    const p = cost.product;
    const segs = [
      [0, p], [p, p + cost.salesTax], [p + cost.salesTax, p + cost.salesTax + cost.iof],
      [p + cost.salesTax + cost.iof, cost.total], [0, cost.total], [0, br.price],
    ];
    const max = Math.max(cost.total, br.price) * 1.1;
    const y = v => BASE - (v / max) * (BASE - TOP);
    model = { segs, y, cost, br, cols: [] };
    const saving = br.price - cost.total;
    $('#wf-context').textContent = `${size().short} M5 por ${usd(best.price)} em ${storeName(best)} · ${c.short}`;
    stepsBox.innerHTML = [
      ['Etiqueta', brl(p), `${usd(best.price)} no cartão, com o dólar a R$ ${fx2(settings.fx)}.`],
      ['+ Sales tax', brl(cost.salesTax), c.rate > 0 ? `${pct(c.rate)} de imposto em ${c.short}. Em compra online vale o endereço de entrega.` : `${c.short} não cobra sales tax.`],
      ['+ IOF', brl(cost.iof), `${pct(settings.iof)} sobre tudo o que passou no cartão, imposto incluído.`],
      ['+ Imposto de importação', brl(cost.duty), cost.dutyUSD > 0
        ? `50% sobre os ${usd(Math.round(cost.dutyUSD * 2))} que passam da cota de US$ 1.000. Declare na e-DBV antes de pousar.`
        : 'Dentro da cota de US$ 1.000: não paga nada.'],
      ['= No fim', brl(cost.total), saving > 0
        ? `No Brasil o mesmo Mac custa ${brl(br.price)} (${br.store}). Você economiza ${brl(saving)}, ${savingPct(cost.total, br.price)}% a menos.`
        : `No Brasil custa ${brl(br.price)}: aqui sai mais caro.`],
    ].map(([label, value, text]) => `<article class="wf-step"><p class="wf-step-label">${label}</p><p class="wf-step-value">${value}</p><p class="wf-step-text">${escapeHtml(text)}</p></article>`).join('');
    steps = $$('.wf-step', stepsBox);

    const color = ['var(--wf-1)', 'var(--wf-2)', 'var(--wf-3)', 'var(--wf-4)', 'var(--wf-total)', 'var(--wf-br)'];
    const valueLabel = i => (i === 0 || i >= 4 ? brl(segs[i][1]) : `+${brl(segs[i][1] - segs[i][0])}`);
    visual.innerHTML = `
      <p class="wf-running"><span>Total até aqui</span><strong id="wf-running">${brl(p)}</strong></p>
      <svg class="wf-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cascata do custo: etiqueta ${brl(p)}, sales tax ${brl(cost.salesTax)}, IOF ${brl(cost.iof)}, imposto ${brl(cost.duty)}, total ${brl(cost.total)}; no Brasil ${brl(br.price)}.">
        <line class="wf-base" x1="8" x2="${W - 8}" y1="${BASE}" y2="${BASE}"/>
        ${COLS.map((label, i) => `
          <g class="wf-col" data-i="${i}">
            ${i > 0 && i < 4 ? `<line class="wf-link" x1="${colX(i - 1) + bw}" x2="${colX(i)}" y1="${y(segs[i][0])}" y2="${y(segs[i][0])}"/>` : ''}
            <rect class="wf-bar" x="${colX(i)}" width="${bw}" y="${BASE}" height="0" rx="4" fill="${color[i]}"/>
            <text class="wf-val${i === 4 ? ' wf-val--strong' : ''}" x="${colX(i) + bw / 2}" y="${y(segs[i][1]) - 10}" text-anchor="middle">${valueLabel(i)}</text>
            <text class="wf-cat" x="${colX(i) + bw / 2}" y="${BASE + 24}" text-anchor="middle">${label}</text>
          </g>`).join('')}
        ${saving > 0 ? `<line class="wf-gap" x1="${colX(4)}" x2="${colX(5) + bw}" y1="${y(cost.total)}" y2="${y(cost.total)}"/>
          <text class="wf-save" x="${colX(5) + bw / 2}" y="${(y(cost.total) + y(br.price)) / 2 + 5}" text-anchor="middle">−${savingPct(cost.total, br.price)}%</text>` : ''}
      </svg>`;
    model.cols = $$('.wf-col', visual).map(col => ({ col, bar: $('.wf-bar', col) }));
    model.extras = $$('.wf-gap, .wf-save', visual);
    model.running = $('#wf-running');
    queueScroll();
  });

  const STOPS = 4;
  onScroll(() => {
    if (!model) return;
    const reduce = reducedMotion();
    const t = Math.min(STOPS, lerp(-0.45, STOPS + 0.6, pinnedProgress(section)));
    applyStops(Math.max(0, t), steps);
    // Com movimento reduzido as barras aparecem de uma vez, sem crescer.
    const grow = i => {
      const g = i === 5 ? clamp((t - 3.7) / 0.3, 0, 1) : clamp((t - i + 0.45) / 0.45, 0, 1);
      return reduce ? (g > 0.5 ? 1 : 0) : g;
    };
    let running = 0;
    model.cols.forEach(({ col, bar }, i) => {
      const g = easeInOut(grow(i));
      const [from, to] = model.segs[i];
      const top = from + (to - from) * g;
      bar.setAttribute('y', model.y(top).toFixed(2));
      bar.setAttribute('height', Math.max(0, model.y(from) - model.y(top)).toFixed(2));
      col.style.setProperty('--g', g.toFixed(3));
      if (i < 4) running += (to - from) * g;
    });
    model.running.textContent = brl(running);
    const save = grow(5);
    model.extras.forEach(el => { el.style.opacity = String(save); });
  });
}

/* ---------- Histórico ---------- */
function initHistory(tooltip) {
  const fig = $('#tk-chart');
  const unitSeg = $('#tk-unit');
  setRadio(unitSeg, settings.unit);
  initSegmented(unitSeg, v => { settings.unit = v; commit(); });
  const X0 = parseISO('2026-03-01');
  const X1 = parseISO('2026-12-10');
  const tips = [];
  let drawn = null;

  function render() {
    const s = settings.size;
    const brlMode = settings.unit === 'brl';
    const c = city();
    const W = Math.max(300, Math.round(fig.clientWidth || 900));
    const narrow = W < 620;
    const H = narrow ? 300 : 380;
    const m = { l: narrow ? 50 : 64, r: narrow ? 10 : 20, t: 26, b: 30 };
    const pw = W - m.l - m.r;
    const ph = H - m.t - m.b;
    const X = iso => m.l + ((parseISO(iso) - X0) / (X1 - X0)) * pw;
    const fmt = v => (brlMode ? brl(v) : usd(v));
    const val = price => (brlMode ? costOf(price).total : price);

    const hist = HISTORY[s].map(h => ({ ...h, v: val(h.price) }));
    const yours = mineOffers().filter(o => o.size === s && parseISO(o.date) >= X0 && parseISO(o.date) <= X1).map(o => ({ ...o, v: val(o.price) }));
    const steps = brlMode ? BRAZIL[s].steps : APPLE_STEPS[s];
    const brPoints = brlMode ? BRAZIL[s].points.map(b => ({ ...b, v: b.price })) : [];
    const ceiling = ceilingFor();
    const values = [...hist.map(h => h.v), ...yours.map(o => o.v), ...steps.map(st => st[1]), ...brPoints.map(b => b.v), ...(brlMode ? [] : [ceiling])];
    const lo = brlMode ? 0 : Math.floor((Math.min(...values) - 60) / 100) * 100;
    const hi = brlMode ? Math.ceil((Math.max(...values) * 1.05) / 2000) * 2000 : Math.ceil((Math.max(...values) + 60) / 100) * 100;
    const Y = v => m.t + (1 - (v - lo) / (hi - lo)) * ph;
    const tickStep = brlMode ? (hi > 16000 ? 4000 : 2000) : (hi - lo > 700 ? 200 : 100);
    const yTicks = [];
    for (let v = lo; v <= hi + 0.1; v += tickStep) yTicks.push(v);

    const months = [];
    for (let d = new Date(X0); d <= X1; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));
    const nowISO = toISO(today());
    const nowX = clamp(X(nowISO), m.l, m.l + pw);
    const bf = CALENDAR.find(e => e.hot);
    const hike = X(PRICE_HIKE.date);
    const stepPath = steps.map(([d, v], i) => `${i ? `H${X(d).toFixed(1)}V` : `M${X(d).toFixed(1)} `}${Y(v).toFixed(1)}`).join('') + `H${(m.l + pw).toFixed(1)}`;
    const linePath = hist.map((h, i) => `${i ? 'L' : 'M'}${X(h.date).toFixed(1)} ${Y(h.v).toFixed(1)}`).join('');
    const minPoint = hist.reduce((a, b) => (b.v < a.v ? b : a));

    tips.length = 0;
    const tip = html => { tips.push(html); return tips.length - 1; };
    const histTip = h => tip(`<strong class="tt-price">${usd(h.price)}</strong><span class="tt-meta">${whenText(h)} · ${escapeHtml(TK_STORES[h.store]?.name || h.store)}</span>${h.note ? `<span>${escapeHtml(h.note)}</span>` : ''}<span class="tt-meta">Custo final hoje em ${escapeHtml(c.short)}: ${brl(costOf(h.price).total)}</span>`);

    const legend = brlMode
      ? [['line', 'var(--series-1)', 'Custo final nos EUA (com tudo)'], ['dash', 'var(--ink-3)', 'Apple Brasil (preço de tabela)'], ['square', 'var(--series-2)', 'Lojas no Brasil (à vista)']]
      : [['line', 'var(--series-1)', 'Melhor preço visto (novo)'], ['dash', 'var(--ink-3)', 'Preço da Apple'], ['quota', 'var(--series-3)', `Teto da cota em ${c.short}`]];
    if (yours.length) legend.push(['ring', 'var(--series-2)', 'Seus registros']);

    fig.innerHTML = `
      <div class="pc-legend tk-legend">${legend.map(([kind, color, label]) => `<span class="pc-key"><span class="tk-sw tk-sw--${kind}" style="--c:${color}"></span>${escapeHtml(label)}</span>`).join('')}</div>
      <svg class="tk-chart-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Histórico de preço do ${size().name} M5. Menor preço: ${usd(minPoint.price)} em ${whenText(minPoint)}. Detalhes na tabela abaixo.">
        ${bf ? `<rect class="tk-band" x="${X(bf.start)}" y="${m.t}" width="${Math.max(6, X(bf.end) - X(bf.start))}" height="${ph}"/><text class="tk-band-label" x="${X(bf.start) - 4}" y="${m.t + 12}" text-anchor="end">Black Friday</text>` : ''}
        ${yTicks.map(v => `<line class="tk-grid" x1="${m.l}" x2="${m.l + pw}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tk-ytick" x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${brlMode ? (v / 1000).toLocaleString('pt-BR') + ' mil' : thousandsUSD(v)}</text>`).join('')}
        ${months.map((d, i) => `<text class="tk-xtick" x="${X(toISO(d)) + (narrow ? 0 : 2)}" y="${H - 8}">${narrow && i % 2 ? '' : MONTHS[d.getMonth()]}</text>`).join('')}
        <line class="tk-hike" x1="${hike}" x2="${hike}" y1="${m.t}" y2="${m.t + ph}"/>
        <text class="tk-hike-label" x="${hike + 5}" y="${m.t + 12}">${narrow ? 'Aumento' : PRICE_HIKE.label}</text>
        <line class="tk-now" x1="${nowX}" x2="${nowX}" y1="${m.t}" y2="${m.t + ph}"/>
        <text class="tk-now-label" x="${nowX + 4}" y="${m.t + ph - 6}">hoje</text>
        ${brlMode ? '' : `<line class="tk-ceiling" x1="${m.l}" x2="${m.l + pw}" y1="${Y(ceiling)}" y2="${Y(ceiling)}"/><text class="tk-ceiling-label" x="${m.l + pw}" y="${Y(ceiling) + 16}" text-anchor="end">Teto da cota: ${usd(Math.floor(ceiling))}</text>`}
        <path class="tk-step" d="${stepPath}"/>
        <path class="tk-line" d="${linePath}"/>
        ${hist.map(h => `<g class="tk-pt${h === minPoint ? ' tk-pt--min' : ''}" tabindex="0" data-tip="${histTip(h)}" data-x="${X(h.date)}" role="img" aria-label="${usd(h.price)} em ${whenText(h)}"><circle cx="${X(h.date)}" cy="${Y(h.v)}" r="${h === minPoint ? 6 : 4.5}"/><circle class="tk-hit" cx="${X(h.date)}" cy="${Y(h.v)}" r="14"/></g>`).join('')}
        ${brPoints.map(b => `<g class="tk-pt tk-pt--br" tabindex="0" data-tip="${tip(`<strong class="tt-price">${brl(b.price)}</strong><span class="tt-meta">${fmtDate(b.date)} · ${escapeHtml(b.store)}</span><span>${escapeHtml(b.note)}</span>`)}" data-x="${X(b.date)}" role="img" aria-label="Brasil: ${brl(b.price)} em ${fmtDate(b.date)}"><rect x="${X(b.date) - 5}" y="${Y(b.v) - 5}" width="10" height="10" rx="2"/><circle class="tk-hit" cx="${X(b.date)}" cy="${Y(b.v)}" r="14"/></g>`).join('')}
        ${yours.map(o => `<g class="tk-pt tk-pt--mine" tabindex="0" data-tip="${tip(`<strong class="tt-price">${usd(o.price)}</strong><span class="tt-meta">${fmtDate(o.date)} · ${escapeHtml(storeName(o))} · seu registro</span>${o.note ? `<span>${escapeHtml(o.note)}</span>` : ''}<span class="tt-meta">Custo final: ${brl(costOf(o.price).total)}</span>`)}" data-x="${X(o.date)}" role="img" aria-label="Seu registro: ${usd(o.price)} em ${fmtDate(o.date)}"><circle cx="${X(o.date)}" cy="${Y(o.v)}" r="5.5"/><circle class="tk-hit" cx="${X(o.date)}" cy="${Y(o.v)}" r="14"/></g>`).join('')}
        <text class="tk-min-label" x="${X(minPoint.date)}" y="${Y(minPoint.v) + 24}" text-anchor="middle">Mínima: ${fmt(minPoint.v)}</text>
      </svg>
      <details class="pc-table">
        <summary>Ver em tabela</summary>
        <div class="data-table-wrap"><table class="data-table">
          <thead><tr><th scope="col">Data</th><th scope="col">Loja</th><th scope="col" class="num">Preço</th><th scope="col" class="num">Custo final hoje</th><th scope="col">Observação</th></tr></thead>
          <tbody>${hist.map(h => `<tr><td>${whenText(h)}</td><td>${escapeHtml(TK_STORES[h.store]?.name || h.store)}</td><td class="num">${usd(h.price)}</td><td class="num">${brl(costOf(h.price).total)}</td><td>${escapeHtml(h.note || '')}</td></tr>`).join('')}</tbody>
        </table></div>
      </details>`;
    const line = $('.tk-line', fig);
    drawn = { line, length: line.getTotalLength(), points: $$('.tk-pt', fig), left: m.l, width: pw };
    line.style.strokeDasharray = `${drawn.length}`;

    $('#hist-context').textContent = brlMode
      ? `Cada preço convertido com as contas de hoje (${city().short}, dólar a R$ ${fx2(settings.fx)}).`
      : `${size().name} M5 · ${size().config}`;
    const low = allTimeLow(s);
    const lowEntry = HISTORY[s].find(h => h.price === low);
    $('#hist-intro').textContent = `O menor preço do ${size().short} M5 foi ${usd(low)} (${whenText(lowEntry)}), antes de a Apple subir o preço em 25/06. Depois do aumento, o melhor foi ${usd(SINCE_HIKE[s].price)} em ${SINCE_HIKE[s].when}. A faixa verde mostra até onde o preço precisa cair para entrar na cota.`;
    queueScroll();
  }

  const thousandsUSD = v => 'US$ ' + v.toLocaleString('pt-BR');
  subscribe(render);
  let lastWidth = 0;
  new ResizeObserver(() => {
    const w = Math.round(fig.clientWidth);
    if (Math.abs(w - lastWidth) > 4) { lastWidth = w; render(); }
  }).observe(fig);

  onScroll(() => {
    if (!drawn) return;
    const q = reducedMotion() ? 1 : viewProgress(fig, 0.88, 0.32);
    drawn.line.style.strokeDashoffset = String(drawn.length * (1 - q));
    drawn.points.forEach(pt => {
      const frac = (Number(pt.dataset.x) - drawn.left) / drawn.width;
      pt.style.opacity = String(clamp((q * 1.04 - frac) * 18, 0, 1));
    });
  });

  const show = el => tooltip.show(el, tips[Number(el.dataset.tip)]);
  fig.addEventListener('pointerover', e => { const pt = e.target.closest('.tk-pt'); if (pt) show(pt); });
  fig.addEventListener('pointerout', e => { if (e.target.closest('.tk-pt')) tooltip.hide(); });
  fig.addEventListener('focusin', e => { const pt = e.target.closest('.tk-pt'); if (pt) show(pt); });
  fig.addEventListener('focusout', () => tooltip.hide());
  addEventListener('scroll', () => tooltip.hide(), { passive: true });

  // Recordes por loja
  subscribe(() => {
    const s = settings.size;
    const low = allTimeLow(s);
    const lowEntry = HISTORY[s].find(h => h.price === low);
    const since = SINCE_HIKE[s];
    $('#tk-records').innerHTML = `
      <div class="tk-record-hero">
        <div class="tk-record-big"><p class="result-label">Menor preço da história</p><p class="tk-record-value">${usd(low)}</p><p class="result-sub">${escapeHtml(TK_STORES[lowEntry.store].name)} · ${whenText(lowEntry)} · antes do aumento</p></div>
        <div class="tk-record-big"><p class="result-label">Menor desde o aumento de junho</p><p class="tk-record-value">${usd(since.price)}</p><p class="result-sub">${since.where} · ${since.when}</p></div>
        <div class="tk-record-big"><p class="result-label">Preço da Apple hoje</p><p class="tk-record-value">${usd(size().apple)}</p><p class="result-sub">era ${usd(size().applePrev)} até 25/06/2026</p></div>
      </div>
      <h3 class="subhead">Menor preço já visto em cada loja</h3>
      <ul class="tk-record-list">${RECORDS[s].map(r => `<li><span>${escapeHtml(TK_STORES[r.store].name)}<span class="tk-record-cond">${CONDITIONS[r.condition]}${r.note ? ` · ${escapeHtml(r.note)}` : ''}</span></span><strong>${usd(r.price)}</strong><span class="tk-record-when">${escapeHtml(r.when)}</span></li>`).join('')}</ul>`;
  });
}

/* ---------- Brasil × EUA ---------- */
function initBrazil() {
  const box = $('#tk-bars');
  let bars = [];
  subscribe(() => {
    const s = settings.size;
    const c = city();
    const best = bestOffer(s);
    const cost = costOf(best.price);
    const ceiling = Math.floor(ceilingFor());
    const atCeiling = costOf(ceiling);
    const b = BRAZIL[s];
    const rows = [
      { group: 'EUA', label: `Melhor oferta de hoje · ${storeName(best)}`, sub: `${usd(best.price)} + taxas em ${c.short}`, value: cost.total, color: 'var(--series-1)' },
      { group: 'EUA', label: 'Se achar pelo teto da cota', sub: `${usd(ceiling)} de etiqueta, sem imposto de importação`, value: atCeiling.total, color: 'var(--seq-soft)' },
      { group: 'Brasil', label: `Melhor loja · ${b.best.store}`, sub: b.best.note, value: b.best.price, color: 'var(--series-2)' },
      { group: 'Brasil', label: 'Apple Brasil, à vista', sub: '10% de desconto no Pix ou boleto', value: b.appleCash, color: 'var(--series-2)', soft: true },
      { group: 'Brasil', label: 'Apple Brasil, parcelado', sub: 'preço de tabela desde 25/06/2026', value: b.apple, color: 'var(--series-2)', soft: true },
    ];
    if (b.importers) rows.push({ group: 'Brasil', label: 'Importadoras (Pix)', sub: 'sem nota de loja oficial nem garantia Apple Brasil', value: b.importers[0], color: 'var(--ink-3)' });
    const max = Math.max(...rows.map(r => r.value));
    box.innerHTML = `<div class="pc-legend tk-legend"><span class="pc-key"><span class="tk-sw tk-sw--square" style="--c:var(--series-1)"></span>EUA, com todas as taxas</span><span class="pc-key"><span class="tk-sw tk-sw--square" style="--c:var(--series-2)"></span>Brasil</span></div>` + rows.map(r => `
      <div class="tk-bar-row" data-group="${r.group}">
        <div class="tk-bar-label"><strong>${escapeHtml(r.label)}</strong><span>${escapeHtml(r.sub)}</span></div>
        <div class="tk-bar-track"><span class="tk-bar${r.soft ? ' tk-bar--soft' : ''}" style="--c:${r.color}; --w:${(r.value / max) * 100}%"></span></div>
        <strong class="tk-bar-value">${brl(r.value)}</strong>
      </div>`).join('');
    bars = $$('.tk-bar', box);
    const saving = b.best.price - cost.total;
    $('#br-context').textContent = contextLine();
    $('#br-note').innerHTML = `Comprando nos EUA hoje você paga <b>${brl(cost.total)}</b> contra <b>${brl(b.best.price)}</b> na melhor loja brasileira: <b>${brl(saving)} a menos (${savingPct(cost.total, b.best.price)}%)</b>. No Brasil o preço vem com nota fiscal, garantia Apple Brasil e teclado ABNT2; nos EUA o teclado é americano. O menor preço já visto no Brasil foi ${brl(b.low ? b.low.price : b.best.price)}${b.low ? ` (${b.low.store}, ${b.low.when}, ${b.low.note})` : ''}.`;
    queueScroll();
  });
  onScroll(() => {
    const q = reducedMotion() ? 1 : easeInOut(viewProgress(box, 0.92, 0.5));
    bars.forEach((bar, i) => {
      const local = clamp(q * 1.25 - i * 0.05, 0, 1);
      bar.style.transform = `scaleX(${local.toFixed(4)})`;
    });
  });
}

/* ---------- Cidades ---------- */
function initCities() {
  const box = $('#tk-cities');
  box.addEventListener('click', e => {
    const btn = e.target.closest('[data-city]');
    if (!btn) return;
    settings.city = btn.dataset.city;
    commit();
  });
  subscribe(() => {
    const s = settings.size;
    const best = bestOffer(s);
    const rows = CITIES.map(c => ({ c, cost: costOf(best.price, c), ceiling: ceilingFor(c) }));
    const maxFees = Math.max(...rows.map(r => fees(r.cost)));
    const groups = [...new Set(CITIES.map(c => c.metro))];
    const atlCheap = rows.find(r => r.c.id === 'atl-cobb');
    const atlCity = rows.find(r => r.c.id === 'atl-city');
    const zero = rows.find(r => r.c.id === 'de');
    $('#city-intro').innerHTML = `Em Atlanta o imposto muda de condado para condado: 6% em Cobb e Gwinnett, 8,9% dentro da cidade. Comprar em Marietta ou Duluth em vez de Buckhead economiza <b>${brl(atlCity.cost.total - atlCheap.cost.total)}</b> neste Mac. Nos estados sem sales tax a economia é de mais ${brl(atlCheap.cost.total - zero.cost.total)}. Toque numa cidade para refazer as contas do site inteiro.`;
    box.innerHTML = `<div class="pc-legend tk-legend">${[['Sales tax', 2], ['IOF', 3], ['Imposto de importação', 4]].map(([label, n]) => `<span class="pc-key"><span class="tk-sw tk-sw--square" style="--c:var(--series-${n})"></span>${label}</span>`).join('')}</div>` + groups.map(g => `
      <section class="tk-city-group" aria-label="${escapeHtml(g)}">
        <h3 class="tk-city-group-title">${escapeHtml(g)}</h3>
        <div class="tk-city-head" aria-hidden="true"><span>Região</span><span>Imposto</span><span>Taxas no total</span><span>Teto da cota</span><span>No fim</span></div>
        <ul class="tk-city-list">${rows.filter(r => r.c.metro === g).sort((a, b) => a.cost.total - b.cost.total).map(({ c, cost, ceiling }) => `
          <li class="tk-city${c.id === settings.city ? ' is-selected' : ''}">
            <button type="button" class="tk-city-btn" data-city="${c.id}" aria-pressed="${c.id === settings.city}">
              <span class="tk-city-name"><strong>${escapeHtml(c.metro === 'Atlanta' ? c.label.split(' · ')[0] : c.short)}</strong><span>${escapeHtml(c.metro === 'Atlanta' ? c.label.split(' · ')[1] : c.label.split(' · ')[1] || '')}</span></span>
              <span class="tk-city-rate">${pct(c.rate)}</span>
              <span class="tk-city-fees"><span class="tk-city-track"><span class="tk-city-bar" style="--w:${maxFees ? (fees(cost) / maxFees) * 100 : 0}%">${[['salesTax', 2], ['iof', 3], ['duty', 4]].map(([k, n]) => `<i style="flex-grow:${cost[k].toFixed(1)}; --c:var(--series-${n})"></i>`).join('')}</span></span><span>${brl(fees(cost))}</span></span>
              <span class="tk-city-ceiling">${usd(Math.floor(ceiling))}</span>
              <span class="tk-city-total">${brl(cost.total)}</span>
            </button>
            <ul class="tk-city-stores">${c.stores.map(([kind, name]) => `<li class="tk-store-chip tk-store-chip--${kind}">${escapeHtml(name)}${kind === 'microcenter' ? '<span> · preço só na loja</span>' : ''}</li>`).join('')}</ul>
          </li>`).join('')}</ul>
      </section>`).join('');
  });
}

/* ---------- Calendário e viagem ---------- */
function initCalendar() {
  const from = $('#tk-trip-from');
  const to = $('#tk-trip-to');
  const status = $('#tk-trip-status');
  const box = $('#tk-cal');
  from.value = settings.trip.from || '';
  to.value = settings.trip.to || '';
  const onTrip = () => {
    settings.trip = { from: ISO_RE.test(from.value) ? from.value : '', to: ISO_RE.test(to.value) ? to.value : '' };
    if (settings.trip.from && settings.trip.to && settings.trip.to < settings.trip.from) settings.trip.to = settings.trip.from;
    commit();
  };
  from.addEventListener('change', onTrip);
  to.addEventListener('change', onTrip);
  $('#tk-trip').addEventListener('submit', e => e.preventDefault());

  const T0 = parseISO('2026-10-01');
  const T1 = parseISO('2027-04-01');
  const pos = iso => clamp((parseISO(iso) - T0) / (T1 - T0), 0, 1) * 100;
  subscribe(() => {
    const { from: a, to: b } = settings.trip;
    const hasTrip = Boolean(a && b);
    const overlaps = e => hasTrip && e.start <= b && e.end >= a;
    const months = [];
    for (let d = new Date(T0); d < T1; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));
    const nowISO = toISO(today());
    const upcoming = CALENDAR.filter(e => e.end >= nowISO);
    const next = upcoming.find(e => e.hot) || upcoming[0];

    if (hasTrip) {
      const hit = CALENDAR.filter(e => !e.past && overlaps(e));
      status.innerHTML = hit.length
        ? `${ICON.okCircle}<span>Sua viagem (${fmtShort(a)} a ${fmtShort(b)}) pega: <b>${hit.map(e => escapeHtml(e.name)).join(', ')}</b>.</span>`
        : `${ICON.warning}<span>Sua viagem (${fmtShort(a)} a ${fmtShort(b)}) não pega nenhuma promoção grande. Dá para comprar online antes e mandar entregar no hotel.</span>`;
      status.className = `tk-trip-status ${hit.length ? 'is-ok' : 'is-warn'}`;
    } else {
      const days = next ? Math.max(0, Math.round((parseISO(next.start) - today()) / DAY)) : 0;
      status.innerHTML = next ? `<span>Informe as datas para ver o que coincide. ${escapeHtml(next.name)} começa ${days ? `em ${days} dias` : 'hoje'} (${fmtShort(next.start)}).</span>` : '';
      status.className = 'tk-trip-status';
    }

    box.innerHTML = `
      <div class="tk-cal-track" role="img" aria-label="Linha do tempo de outubro de 2026 a março de 2027 com as janelas de promoção${hasTrip ? ' e a sua viagem' : ''}.">
        ${months.map(d => `<span class="tk-cal-month" style="left:${pos(toISO(d))}%">${MONTHS[d.getMonth()]}${d.getMonth() === 0 ? ` ${d.getFullYear()}` : ''}</span>`).join('')}
        ${hasTrip ? `<span class="tk-cal-trip" style="left:${pos(a)}%; width:${Math.max(0.8, pos(b) - pos(a))}%"><span>sua viagem</span></span>` : ''}
        ${CALENDAR.map(e => `<span class="tk-cal-win${e.hot ? ' is-hot' : ''}${e.past ? ' is-past' : ''}" style="left:${pos(e.start)}%; width:${Math.max(0.8, pos(e.end) - pos(e.start) + 0.55)}%"></span>`).join('')}
        <span class="tk-cal-now" style="left:${pos(nowISO)}%"><span>hoje</span></span>
      </div>
      <ol class="tk-cal-list">${CALENDAR.map(e => {
        const when = e.start === e.end ? fmtShort(e.start) : `${fmtShort(e.start)} a ${fmtShort(e.end)}`;
        const tag = e.past ? '<span class="tag">Já passou</span>' : overlaps(e) ? '<span class="tag tag--best">Na sua viagem</span>' : e.hot ? '<span class="tag tag--record">A melhor chance</span>' : '';
        return `<li class="tk-cal-item${e.past ? ' is-past' : ''}${e.hot ? ' is-hot' : ''}"><p class="tk-cal-when">${when}</p><div><p class="tk-cal-name">${escapeHtml(e.name)} ${tag}</p><p class="tk-cal-note">${escapeHtml(e.note)}</p></div></li>`;
      }).join('')}</ol>`;
  });
}

/* ---------- Estratégias e mitos ---------- */
function initStrategies() {
  const box = $('#tk-strats');
  subscribe(() => {
    const s = settings.size;
    const c = city();
    const best = bestOffer(s);
    const cost = costOf(best.price);
    const ceiling = Math.floor(ceilingFor());
    const low = allTimeLow(s);
    const cards = [
      ['receipt', 'Passar da cota custa menos do que parece', `O imposto é de 50% só sobre o que passa de US$ 1.000, não sobre o Mac inteiro. Na melhor oferta de hoje isso dá ${brl(cost.duty)}, e mesmo assim você economiza ${brl(brBest(s).price - cost.total)} em relação ao Brasil.`],
      ['pin', 'Em Atlanta, compre fora da cidade', 'Cobb e Gwinnett cobram 6%; dentro de Atlanta são 8,9%. Micro Center (Marietta e Duluth), Apple Cumberland e Apple Mall of Georgia ficam nos condados mais baratos. Na compra online, mande entregar num hotel ou Amazon Locker nesses condados.'],
      ['target', `O número mágico: ${usd(ceiling)}`, `Com ${pct(c.rate)} de imposto em ${c.short}, a etiqueta precisa ser de até ${usd(ceiling)} para entrar na cota. O ${size().short} M5 já esteve a ${usd(low)}, mas isso foi antes do aumento de junho. A Black Friday (27/11) é a melhor chance de chegar perto.`],
      ['box', 'Open-Box na Best Buy', 'São unidades devolvidas, revisadas e vendidas com desconto na própria loja. O Air 13″ apareceu por US$ 989,99 em julho. Prefira o estado "Excellent", veja os ciclos da bateria em Ajustes e confira se vem o carregador.'],
      ['shield', 'Recondicionado da própria Apple', `O Air 13″ M5 sai por ${usd(1099)} quando tem estoque, com 1 ano de garantia da Apple, caixa nova e direito a AppleCare+. O estoque aparece e some ao longo do dia: vale olhar várias vezes.`],
      ['store', 'Peça online e retire na loja', 'Best Buy e Apple deixam comprar pelo site e retirar no mesmo dia. O imposto é o da loja onde você retira: escolha uma em Cobb ou Gwinnett e pague 6%.'],
      ['card', 'Pague sempre em dólar', 'Se a maquininha oferecer cobrar em reais, recuse. A conversão da loja costuma ser bem pior que a do seu cartão, e o IOF é o mesmo.'],
      ['calendar', 'Guarde a nota e acompanhe o preço', 'A Best Buy costuma devolver a diferença se ela mesma baixar o preço dentro do prazo de devolução. Na Amazon, dá para devolver em 30 dias e comprar de novo mais barato, se o prazo da viagem permitir.'],
      ['keyboard', 'Se a cota for prioridade: MacBook Neo', 'Custa US$ 699 e cabe na cota com folga. Mas usa o chip A18 Pro do iPhone, tem só 8 GB de memória e o teclado não é iluminado: bem mais fraco que o Air M5.'],
    ];
    box.innerHTML = cards.map(([icon, title, text]) => `
      <article class="tip tk-strat"><svg class="tip-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${TIP_ICON[icon]}</svg>
        <h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('');
  });

  const myths = [
    ['Tirar da caixa e usar na viagem livra do imposto.', 'Não. Para a Receita, notebook não é bem de uso pessoal: entra na cota mesmo usado.'],
    ['Dá para somar a cota de duas pessoas.', 'Não para o mesmo produto. A cota é individual; um Mac de US$ 1.300 conta inteiro na cota de quem o traz.'],
    ['Se não declarar, no pior caso pago o imposto.', 'Se for pego sem declarar, paga os 50% de imposto e mais 50% de multa sobre o que passou da cota: o dobro.'],
    ['O free shop do desembarque resolve.', 'Ele tem uma cota separada de US$ 1.000, mas raramente vende MacBook e os preços são mais altos que nos EUA.'],
    ['Declarar dá um trabalhão no aeroporto.', 'A e-DBV é preenchida no celular, pelo app Viajantes ou pelo site da Receita, e o imposto sai numa guia (DARF) que dá para pagar pelo app do banco.'],
    ['O sales tax é devolvido no aeroporto.', 'Nos EUA não existe devolução de imposto para turista como na Europa. O jeito de pagar menos é escolher onde comprar.'],
  ];
  $('#tk-myths').innerHTML = myths.map(([myth, truth]) => `
    <article class="tk-myth"><p class="tk-myth-claim">${ICON.cross}<span>${escapeHtml(myth)}</span></p><p class="tk-myth-truth">${escapeHtml(truth)}</p></article>`).join('');
}

/* ---------- Meus preços ---------- */
function initMine() {
  const form = $('#tk-mine-form');
  const storeSel = $('#mine-store');
  const condSel = $('#mine-condition');
  const sizeSel = $('#mine-size');
  const channelSel = $('#mine-channel');
  const dateInput = $('#mine-date');
  const list = $('#tk-mine-list');
  storeSel.innerHTML = Object.entries(TK_STORES).map(([id, s]) => `<option value="${id}">${escapeHtml(s.name)}</option>`).join('') + '<option value="outra">Outra loja</option>';
  condSel.innerHTML = Object.entries(CONDITIONS).map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  storeSel.value = 'microcenter';
  dateInput.value = toISO(today());
  sizeSel.value = settings.size;
  storeSel.addEventListener('change', () => {
    const ch = TK_STORES[storeSel.value]?.channel;
    if (ch === 'online') channelSel.value = 'online';
    if (ch === 'loja') channelSel.value = 'loja';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const price = Number($('#mine-price').value);
    if (!Number.isFinite(price) || price < 100 || !ISO_RE.test(dateInput.value)) {
      $('#mine-price').reportValidity();
      return;
    }
    mine.push({
      id: `m${Date.now().toString(36)}`,
      size: sizeSel.value, store: storeSel.value, channel: channelSel.value, condition: condSel.value,
      price: Math.round(price * 100) / 100, date: dateInput.value, note: $('#mine-note').value.trim().slice(0, 80),
    });
    $('#mine-price').value = '';
    $('#mine-note').value = '';
    writeJSON(KEY_MINE, mine);
    // Mostra o registro no tamanho certo (o clique no controle já refaz todas as contas).
    if (sizeSel.value !== settings.size) $(`#tk-size button[data-value="${sizeSel.value}"]`).click();
    else commit();
  });

  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    mine = mine.filter(m => m.id !== btn.dataset.remove);
    saveMine();
  });

  subscribe(() => {
    const items = [...mine].sort((a, b) => b.date.localeCompare(a.date));
    list.innerHTML = items.length
      ? items.map(m => {
        const cost = costOf(m.price);
        return `<li class="tk-mine-item">
          <div><strong>${usd(m.price)} · ${SIZES[m.size].short}</strong><span>${escapeHtml(storeName(m))} · ${CHANNEL_LABEL[m.channel] || ''} · ${CONDITIONS[m.condition]} · ${fmtDate(m.date)}${daysSince(m.date) > 30 ? ' · antigo' : ''}</span>${m.note ? `<span>${escapeHtml(m.note)}</span>` : ''}</div>
          <div class="tk-mine-cost"><strong>${brl(cost.total)}</strong><span>${m.price <= ceilingFor() ? 'cabe na cota' : 'passa da cota'}</span></div>
          <button type="button" class="tk-mine-remove" data-remove="${m.id}" aria-label="Remover registro de ${usd(m.price)}">${ICON.cross}</button>
        </li>`;
      }).join('')
      : '<li class="tk-empty">Nenhum preço registrado ainda. Quando passar numa loja, anote o preço da etiqueta.</li>';
  });

  $('#tk-alerts').innerHTML = ALERTS.map(a => `<li><a href="${a.url}" target="_blank" rel="noopener">${escapeHtml(a.name)}<span class="visually-hidden"> (abre em nova aba)</span></a><span>${escapeHtml(a.what)}</span></li>`).join('');
}

/* ---------- Início ---------- */
$('#tk-checked').textContent = `Ofertas de ${fmtDate(TRACKER_CHECKED)}`;
$('#sources').innerHTML = TRACKER_SOURCES.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${escapeHtml(label)}</a></li>`).join('');
const tooltip = createTooltip();
initControls();
initHero();
initBest();
initOffers();
initWaterfall();
initHistory(tooltip);
initBrazil();
initCities();
initCalendar();
initStrategies();
initMine();
initNav();
initReveal();
