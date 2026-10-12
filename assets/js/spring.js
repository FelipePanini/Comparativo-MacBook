// Molas no estilo Apple: dois parâmetros, "damping" (1 = sem overshoot) e "response" (s).
// Toda animação parte do valor atual e herda a velocidade, então pode ser interrompida a qualquer momento.

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const active = new Set();
let frame = 0;
let last = 0;

function tick(now) {
  const dt = Math.min(0.064, (now - last) / 1000 || 1 / 60);
  last = now;
  for (const spring of [...active]) spring._step(dt);
  frame = active.size ? requestAnimationFrame(tick) : 0;
}

function schedule(spring) {
  active.add(spring);
  if (!frame) {
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
}

export class Spring {
  constructor(value = 0, { response = 0.4, damping = 1, precision = 0.01, onUpdate = () => {}, onRest = () => {} } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.response = response;
    this.damping = damping;
    this.precision = precision;
    this.onUpdate = onUpdate;
    this.onRest = onRest;
  }

  get animating() {
    return active.has(this);
  }

  // Redireciona a mola. A velocidade atual é mantida, a menos que outra seja passada.
  to(target, { velocity, response, damping } = {}) {
    this.target = target;
    if (velocity !== undefined) this.velocity = velocity;
    if (response !== undefined) this.response = response;
    if (damping !== undefined) this.damping = damping;
    if (reducedMotion()) {
      this.set(target);
      this.onRest(target);
      return this;
    }
    schedule(this);
    return this;
  }

  // Salta para um valor sem animar (usado durante o arrasto, 1:1 com o dedo).
  set(value) {
    active.delete(this);
    this.value = this.target = value;
    this.velocity = 0;
    this.onUpdate(value);
  }

  // Congela no valor que está na tela agora.
  stop() {
    active.delete(this);
    this.target = this.value;
    this.velocity = 0;
  }

  _step(dt) {
    const stiffness = (2 * Math.PI / this.response) ** 2;
    const friction = (4 * Math.PI * this.damping) / this.response;
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const force = -stiffness * (this.value - this.target) - friction * this.velocity;
      this.velocity += force * h;
      this.value += this.velocity * h;
    }
    const settled = Math.abs(this.value - this.target) < this.precision && Math.abs(this.velocity) < this.precision * 20;
    if (settled) {
      active.delete(this);
      this.value = this.target;
      this.velocity = 0;
      this.onUpdate(this.value);
      this.onRest(this.value);
      return;
    }
    this.onUpdate(this.value);
  }
}

// Onde um gesto vai parar se for solto com esta velocidade (px/s). Mesma função do sample da Apple.
export function project(velocity, rate = 0.998) {
  return ((velocity / 1000) * rate) / (1 - rate);
}

// Resistência progressiva além do limite: quanto mais longe, menos o elemento acompanha.
export function rubberband(overshoot, dimension, constant = 0.55) {
  const distance = Math.abs(overshoot);
  return Math.sign(overshoot) * ((distance * dimension * constant) / (dimension + constant * distance));
}

// Guarda os últimos ~100 ms de movimento para medir a velocidade na hora de soltar.
export class VelocityTracker {
  constructor() {
    this.samples = [];
  }
  reset() {
    this.samples = [];
  }
  add(position, time = performance.now()) {
    this.samples.push({ position, time });
    while (this.samples.length > 2 && time - this.samples[0].time > 100) this.samples.shift();
  }
  get velocity() {
    const s = this.samples;
    if (s.length < 2) return 0;
    const first = s[0];
    const lastSample = s[s.length - 1];
    const dt = (lastSample.time - first.time) / 1000;
    return dt > 0 ? (lastSample.position - first.position) / dt : 0;
  }
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
