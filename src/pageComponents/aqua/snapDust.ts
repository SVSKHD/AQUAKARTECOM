// "Thanos snap": paints a small element (a history row) onto a canvas, hides the
// real one, and blows the painting away as dust, left to right. No dependency:
// the painter handles what rows are made of (boxes, single-line text, SVG icons).

const DURATION = 1300;
const STEP = 2; // CSS px between dust grains
const DRIFT_X = 150; // room for the dust to travel (right, up)
const DRIFT_Y = 110;
const MAX_DELAY = 0.62; // share of the run before the last grain lifts off

type Op = () => void;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const visible = (cs: CSSStyleDeclaration) =>
  cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";

const transparent = (c: string) =>
  !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);

const loadSvg = (svg: SVGSVGElement, color: string, w: number, h: number) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    clone.style.color = color; // lucide strokes with currentColor
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  });

// Text cut to fit `max` px with an ellipsis, as text-overflow: ellipsis shows it.
const fit = (ctx: CanvasRenderingContext2D, text: string, max: number) => {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max)
    s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
};

async function paint(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(box.width * dpr);
  canvas.height = Math.ceil(box.height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  const ops: Op[] = [];
  const waits: Promise<unknown>[] = [];

  const walk = (node: Element) => {
    const cs = getComputedStyle(node);
    if (!visible(cs)) return;
    const r = node.getBoundingClientRect();
    const x = r.left - box.left;
    const y = r.top - box.top;

    if (!transparent(cs.backgroundColor)) {
      const radius = Math.min(
        parseFloat(cs.borderTopLeftRadius) || 0,
        r.height / 2,
        r.width / 2,
      );
      ops.push(() => {
        ctx.fillStyle = cs.backgroundColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, r.width, r.height, radius);
        else ctx.rect(x, y, r.width, r.height);
        ctx.fill();
      });
    }

    if (node instanceof SVGSVGElement) {
      const slot: { img: HTMLImageElement | null } = { img: null };
      waits.push(
        loadSvg(node, cs.color, r.width, r.height).then(
          (img) => (slot.img = img),
        ),
      );
      ops.push(
        () => slot.img && ctx.drawImage(slot.img, x, y, r.width, r.height),
      );
      return;
    }

    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.replace(/\s+/g, " ").trim();
        if (!text) continue;
        const range = document.createRange();
        range.selectNodeContents(child);
        const tr = range.getBoundingClientRect();
        const clipRight = cs.overflow === "hidden" ? r.right : box.right;
        ops.push(() => {
          ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          ctx.fillStyle = cs.color;
          ctx.textBaseline = "middle";
          const tx = tr.left - box.left;
          ctx.fillText(
            fit(ctx, text, clipRight - tr.left),
            tx,
            tr.top - box.top + tr.height / 2,
          );
        });
      } else if (child instanceof Element) {
        walk(child);
      }
    }
  };

  walk(el);
  await Promise.all(waits);
  ops.forEach((op) => op());
  return { canvas, ctx, box, dpr };
}

/**
 * Snaps `el` away. `onStart` runs once the element is hidden and the dust is on
 * screen (collapse the row's space from there). Resolves when the dust settles.
 */
export async function snapAway(
  el: HTMLElement,
  onStart?: () => void,
): Promise<void> {
  const painted = reducedMotion() ? null : await paint(el).catch(() => null);
  el.style.visibility = "hidden";
  onStart?.();
  if (!painted) return;

  const { canvas: src, ctx: srcCtx, box, dpr } = painted;
  const pixels = srcCtx.getImageData(0, 0, src.width, src.height).data;

  type Grain = {
    x: number;
    y: number;
    color: string;
    a: number;
    delay: number;
    dx: number;
    dy: number;
    wobble: number;
  };
  const grains: Grain[] = [];
  for (let gy = 0; gy < box.height; gy += STEP) {
    for (let gx = 0; gx < box.width; gx += STEP) {
      const i = (Math.floor(gy * dpr) * src.width + Math.floor(gx * dpr)) * 4;
      const a = pixels[i + 3] / 255;
      if (a < 0.08) continue;
      const angle = -Math.PI / 5 + (Math.random() - 0.5) * 1.3;
      const dist = 40 + Math.random() * 110;
      grains.push({
        x: gx,
        y: gy + DRIFT_Y,
        color: `rgb(${pixels[i]},${pixels[i + 1]},${pixels[i + 2]})`,
        a,
        // Left edge goes first, with a ragged front.
        delay: (gx / box.width) * 0.42 + Math.random() * (MAX_DELAY - 0.42),
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 18,
        wobble: Math.random() * Math.PI * 2,
      });
    }
  }

  const out = document.createElement("canvas");
  const w = box.width + DRIFT_X;
  const h = box.height + DRIFT_Y;
  out.width = Math.ceil(w * dpr);
  out.height = Math.ceil(h * dpr);
  Object.assign(out.style, {
    position: "fixed",
    left: `${box.left}px`,
    top: `${box.top - DRIFT_Y}px`,
    width: `${w}px`,
    height: `${h}px`,
    pointerEvents: "none",
    zIndex: "1000",
  });
  document.body.appendChild(out);
  const ctx = out.getContext("2d");
  if (!ctx) return void out.remove();
  ctx.scale(dpr, dpr);

  const LIFE = 0.55; // share of the run each grain spends flying
  await new Promise<void>((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / DURATION;
      ctx.clearRect(0, 0, w, h);
      for (const g of grains) {
        const p = Math.min(Math.max((t - g.delay) / LIFE, 0), 1);
        if (p >= 1) continue;
        const e = p * p * (3 - 2 * p); // smoothstep: lifts off gently, then drifts
        ctx.globalAlpha = g.a * (1 - p);
        ctx.fillStyle = g.color;
        ctx.fillRect(
          g.x + g.dx * e + Math.sin(g.wobble + p * 7) * 3 * p,
          g.y + g.dy * e,
          p ? STEP * (1 - p * 0.4) : STEP,
          p ? STEP * (1 - p * 0.4) : STEP,
        );
      }
      if (t < MAX_DELAY + LIFE) requestAnimationFrame(frame);
      else {
        out.remove();
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}
