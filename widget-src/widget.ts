// Avori embeddable widget — vanilla TS, no framework deps.
// Bundled to /public/widget.js via `npm run widget:build`.

type Mode = 'inline' | 'floating' | 'feed';
type ThemeMode = 'auto' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

type TryOnCategory = 'LIPSTICK' | 'LIP_GLOSS' | 'BLUSH' | 'EYESHADOW' | 'EYELINER';
type TryOn = { category: TryOnCategory; tint: string };

type Tag = {
  id: string;
  x: number;
  y: number;
  startTime: number;
  endTime: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    productUrl: string;
    tryOn: TryOn | null;
  };
};

type WidgetVideo = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  tags: Tag[];
};

type Feed = { brand: { id: string; name: string; slug: string } | null; videos: WidgetVideo[] };

const STYLE_ID = 'av-style';
const STYLES = `
.av-root,.av-root *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,system-ui,sans-serif}
.av-root{--av-card-bg:#fff;--av-card-fg:#0a0a0a;--av-card-muted:#666;--av-accent:#7C3AED;--av-accent-deep:#4C1D95;--av-cta-fg:#fff;--av-shadow:0 -8px 32px rgba(0,0,0,.18);--av-bubble-shadow:0 8px 24px rgba(0,0,0,.25)}
.av-root[data-theme="dark"]{--av-card-bg:#16161E;--av-card-fg:#F3F4F6;--av-card-muted:#D1D5DB;--av-accent:#7C3AED;--av-accent-deep:#4C1D95;--av-cta-fg:#fff;--av-shadow:0 -12px 40px rgba(0,0,0,.5);--av-bubble-shadow:0 12px 32px rgba(0,0,0,.5)}
.av-stage{position:relative;width:100%;aspect-ratio:9/16;background:#000;overflow:hidden;border-radius:12px;color:#fff}
.av-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
.av-overlay{position:absolute;inset:0;pointer-events:none}
.av-hot{position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(124,58,237,.85);border:2px solid #fff;box-shadow:0 0 0 4px rgba(124,58,237,.25);transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto;animation:avPulse 1.6s ease-out infinite}
@keyframes avPulse{0%{box-shadow:0 0 0 0 rgba(124,58,237,.5)}100%{box-shadow:0 0 0 14px rgba(124,58,237,0)}}
.av-mute{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.5);color:#fff;border:0;border-radius:9999px;width:32px;height:32px;cursor:pointer;font-size:14px;pointer-events:auto;display:flex;align-items:center;justify-content:center}
.av-meta{position:absolute;left:12px;bottom:14px;right:60px;text-shadow:0 1px 2px rgba(0,0,0,.6);pointer-events:none}
.av-meta .t{font-weight:600;font-size:14px;line-height:1.2}
.av-meta .d{font-size:12px;opacity:.85;margin-top:4px}

.av-card{position:absolute;left:0;right:0;bottom:0;background:var(--av-card-bg);color:var(--av-card-fg);padding:14px;border-radius:14px 14px 0 0;transform:translateY(110%);transition:transform .25s ease;pointer-events:auto;box-shadow:var(--av-shadow)}
.av-card.open{transform:translateY(0)}
.av-card .row{display:flex;gap:12px;align-items:center}
.av-card img.thumb{width:56px;height:56px;border-radius:8px;object-fit:cover}
.av-card .name{font-weight:600;font-size:14px}
.av-card .price{font-size:13px;color:var(--av-card-muted);margin-top:2px}
.av-card .actions{margin-left:auto;display:flex;gap:8px}
.av-card .cta{display:inline-block;background:var(--av-accent);color:var(--av-cta-fg);text-decoration:none;padding:8px 14px;border-radius:8px;font-weight:600;font-size:13px;border:0;cursor:pointer}
.av-card .cta:hover{background:var(--av-accent-deep)}
.av-card .tryon{display:inline-flex;align-items:center;gap:5px;background:transparent;color:var(--av-accent);text-decoration:none;padding:8px 12px;border-radius:8px;font-weight:600;font-size:13px;border:1px solid var(--av-accent);cursor:pointer}
.av-card .tryon:hover{background:var(--av-accent);color:var(--av-cta-fg)}
.av-card .x{position:absolute;top:6px;right:8px;background:none;border:0;color:var(--av-card-muted);font-size:18px;cursor:pointer;line-height:1;padding:4px 8px}

.av-bubble{position:fixed;right:18px;bottom:18px;width:120px;height:200px;border-radius:14px;overflow:hidden;cursor:pointer;box-shadow:var(--av-bubble-shadow);z-index:2147483646;background:#000}
.av-bubble video{width:100%;height:100%;object-fit:cover}
.av-bubble .badge{position:absolute;top:6px;left:6px;background:rgba(0,0,0,.55);color:#fff;font-size:10px;padding:3px 7px;border-radius:9999px;font-weight:600;letter-spacing:.4px;text-transform:uppercase}
.av-bubble .x{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:0;border-radius:9999px;width:22px;height:22px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0}

.av-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:2147483647}
.av-modal .close{position:absolute;top:18px;right:18px;background:rgba(255,255,255,.15);color:#fff;border:0;width:36px;height:36px;border-radius:9999px;cursor:pointer;font-size:18px;z-index:2}
.av-modal .frame{width:min(420px,calc(100vw - 24px));height:min(720px,calc(100vh - 48px));position:relative}

.av-feed{position:fixed;inset:0;background:#000;z-index:2147483647}
.av-feed .scroller{height:100%;overflow-y:scroll;scroll-snap-type:y mandatory;scrollbar-width:none}
.av-feed .scroller::-webkit-scrollbar{display:none}
.av-feed .slide{height:100%;scroll-snap-align:start;position:relative}
.av-feed .close{position:absolute;top:14px;right:14px;background:rgba(0,0,0,.5);color:#fff;border:0;width:36px;height:36px;border-radius:9999px;cursor:pointer;font-size:18px;z-index:5;display:flex;align-items:center;justify-content:center}
.av-feed .av-stage{height:100%;border-radius:0;aspect-ratio:auto}

/* AI Try-on modal */
.av-tryon{position:fixed;inset:0;background:rgba(13,13,18,.92);display:flex;align-items:center;justify-content:center;z-index:2147483647;padding:16px;color:#F3F4F6}
.av-tryon .panel{background:#16161E;border:1px solid #2E2E3C;border-radius:16px;width:min(480px,100%);max-height:96vh;overflow:auto;display:flex;flex-direction:column}
.av-tryon .head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #2E2E3C}
.av-tryon .head h3{margin:0;font-size:15px;font-weight:600}
.av-tryon .head .sub{font-size:12px;color:#A7B2CC;margin-top:2px}
.av-tryon .head button{background:none;border:0;color:#A7B2CC;font-size:20px;cursor:pointer;padding:4px 8px;line-height:1}
.av-tryon .body{padding:16px;display:flex;flex-direction:column;gap:12px;align-items:center}
.av-tryon .stage{position:relative;width:100%;aspect-ratio:3/4;background:#0D0D12;border-radius:12px;overflow:hidden}
.av-tryon video,.av-tryon canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.av-tryon .placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#A7B2CC;font-size:13px;text-align:center;padding:24px}
.av-tryon .toolbar{display:flex;gap:8px;width:100%;flex-wrap:wrap;justify-content:center}
.av-tryon button.action{background:#7C3AED;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.av-tryon button.action:hover{background:#4C1D95}
.av-tryon button.ghost{background:transparent;color:#F3F4F6;border:1px solid #3E3E50;padding:10px 14px;border-radius:8px;font-size:13px;cursor:pointer}
.av-tryon button.ghost:hover{background:#1F1F2A}
.av-tryon .footer{padding:12px 16px;border-top:1px solid #2E2E3C;display:flex;align-items:center;gap:10px;font-size:12px;color:#A7B2CC}
.av-tryon .swatch{width:14px;height:14px;border-radius:4px;border:1px solid rgba(255,255,255,.2)}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function detectTheme(themeAttr: ThemeMode | undefined, hostEl: HTMLElement): ResolvedTheme {
  if (themeAttr === 'light' || themeAttr === 'dark') return themeAttr;
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  let el: HTMLElement | null = hostEl;
  while (el) {
    const bg = getComputedStyle(el).backgroundColor;
    const m = bg.match(/^rgba?\(([^)]+)\)/);
    if (m) {
      const [r, g, b, a = '1'] = m[1].split(',').map((s) => parseFloat(s.trim()));
      if (a > 0.1) {
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5 ? 'dark' : 'light';
      }
    }
    el = el.parentElement;
  }
  return 'light';
}

class WidgetInstance {
  el: HTMLElement;
  brandId: string;
  api: string;
  mode: Mode;
  themeAttr: ThemeMode;
  theme: ResolvedTheme = 'light';
  feed: Feed | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
    this.brandId = el.dataset.brandId || '';
    this.api =
      el.dataset.api ||
      (document.currentScript as HTMLScriptElement | null)?.src.replace(/\/widget\.js.*$/, '') ||
      '';
    this.mode = ((el.dataset.mode as Mode) || 'inline') as Mode;
    this.themeAttr = ((el.dataset.theme as ThemeMode) || 'auto') as ThemeMode;
  }

  async init() {
    if (!this.brandId) {
      console.warn('[avori] missing data-brand-id');
      return;
    }
    ensureStyles();
    this.theme = detectTheme(this.themeAttr, this.el);

    try {
      const res = await fetch(`${this.api}/api/public/brand/${this.brandId}/videos`);
      if (!res.ok) return;
      this.feed = await res.json();
    } catch {
      return;
    }
    if (!this.feed?.videos.length) return;
    this.track('IMPRESSION');

    if (this.mode === 'inline') this.renderInline();
    else if (this.mode === 'floating') this.renderFloating();
    else if (this.mode === 'feed') this.renderFeed();
  }

  themeRoot(node: HTMLElement) {
    node.classList.add('av-root');
    node.dataset.theme = this.theme;
    return node;
  }

  track(
    type: 'IMPRESSION' | 'VIEW' | 'TAG_CLICK' | 'CTA_CLICK',
    extras: { videoId?: string; productId?: string } = {}
  ) {
    try {
      const payload = {
        brandId: this.brandId,
        type,
        domain: location.hostname,
        mode: this.mode,
        ...extras,
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const sent = navigator.sendBeacon?.(`${this.api}/api/public/events`, blob);
      if (!sent) {
        fetch(`${this.api}/api/public/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    } catch {
      /* noop */
    }
  }

  renderInline() {
    this.themeRoot(this.el);
    this.el.appendChild(this.buildStage(this.feed!.videos[0]));
  }

  renderFloating() {
    const v = this.feed!.videos[0];
    const bubble = this.themeRoot(document.createElement('div'));
    bubble.className += ' av-bubble';
    bubble.innerHTML = `
      <video src="${escapeAttr(v.videoUrl)}" muted playsinline loop autoplay></video>
      <span class="badge">Shop</span>
      <button class="x" aria-label="Close">×</button>
    `;
    document.body.appendChild(bubble);
    bubble.querySelector('.x')!.addEventListener('click', (e) => {
      e.stopPropagation();
      bubble.remove();
    });
    bubble.addEventListener('click', () => {
      const modal = this.themeRoot(document.createElement('div'));
      modal.className += ' av-modal';
      modal.innerHTML = `<button class="close" aria-label="Close">×</button><div class="frame"></div>`;
      const frame = modal.querySelector('.frame') as HTMLElement;
      frame.appendChild(this.buildStage(v));
      modal.querySelector('.close')!.addEventListener('click', () => modal.remove());
      document.body.appendChild(modal);
    });
  }

  renderFeed() {
    const overlay = this.themeRoot(document.createElement('div'));
    overlay.className += ' av-feed';
    overlay.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <div class="scroller"></div>
    `;
    const scroller = overlay.querySelector('.scroller') as HTMLElement;
    this.feed!.videos.forEach((v) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.appendChild(this.buildStage(v));
      scroller.appendChild(slide);
    });
    overlay.querySelector('.close')!.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  }

  buildStage(v: WidgetVideo): HTMLElement {
    const stage = document.createElement('div');
    stage.className = 'av-stage';
    stage.innerHTML = `
      <video class="av-video" src="${escapeAttr(v.videoUrl)}" ${
        v.thumbnailUrl ? `poster="${escapeAttr(v.thumbnailUrl)}"` : ''
      } muted playsinline loop preload="metadata"></video>
      <div class="av-overlay"></div>
      <button class="av-mute" aria-label="Toggle sound">🔇</button>
      <div class="av-meta"><div class="t"></div><div class="d"></div></div>
    `;

    const video = stage.querySelector('.av-video') as HTMLVideoElement;
    const overlay = stage.querySelector('.av-overlay') as HTMLElement;
    const mute = stage.querySelector('.av-mute') as HTMLButtonElement;
    (stage.querySelector('.av-meta .t') as HTMLElement).textContent = v.title;
    (stage.querySelector('.av-meta .d') as HTMLElement).textContent = v.description ?? '';

    mute.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      mute.textContent = video.muted ? '🔇' : '🔊';
    });

    let viewed = false;
    video.addEventListener('timeupdate', () => {
      if (!viewed && video.currentTime >= 1) {
        viewed = true;
        this.track('VIEW', { videoId: v.id });
      }
      const t = video.currentTime;
      const visible = new Set<string>();
      v.tags.forEach((tag) => {
        if (t >= tag.startTime && t <= tag.endTime) visible.add(tag.id);
      });
      Array.from(overlay.querySelectorAll<HTMLElement>('.av-hot')).forEach((node) => {
        if (!visible.has(node.dataset.tagId!)) node.remove();
      });
      visible.forEach((id) => {
        if (overlay.querySelector(`[data-tag-id="${cssEscape(id)}"]`)) return;
        const tag = v.tags.find((t) => t.id === id)!;
        const dot = document.createElement('div');
        dot.className = 'av-hot';
        dot.dataset.tagId = id;
        dot.style.left = tag.x + '%';
        dot.style.top = tag.y + '%';
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.track('TAG_CLICK', { videoId: v.id, productId: tag.product.id });
          this.openCard(stage, v, tag);
        });
        overlay.appendChild(dot);
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.5 }
    );
    io.observe(stage);

    return stage;
  }

  openCard(stage: HTMLElement, v: WidgetVideo, tag: Tag) {
    stage.querySelector('.av-card')?.remove();
    const card = document.createElement('div');
    card.className = 'av-card';
    const showTryOn = !!tag.product.tryOn;
    card.innerHTML = `
      <button class="x" aria-label="Close">×</button>
      <div class="row">
        <img class="thumb" src="${escapeAttr(tag.product.imageUrl)}" alt="">
        <div>
          <div class="name"></div>
          <div class="price">$${tag.product.price.toFixed(2)}</div>
        </div>
        <div class="actions">
          ${showTryOn ? `<button class="tryon" type="button">✨ Try on</button>` : ''}
          <a class="cta" target="_blank" rel="noopener" href="${escapeAttr(
            tag.product.productUrl
          )}">Shop</a>
        </div>
      </div>
    `;
    (card.querySelector('.name') as HTMLElement).textContent = tag.product.name;
    card.querySelector('.x')!.addEventListener('click', () => card.classList.remove('open'));
    card.querySelector('.cta')!.addEventListener('click', () => {
      this.track('CTA_CLICK', { videoId: v.id, productId: tag.product.id });
    });
    if (showTryOn) {
      card.querySelector('.tryon')!.addEventListener('click', (e) => {
        e.stopPropagation();
        // Pause the video while user is in try-on so it doesn't compete for attention.
        const video = stage.querySelector('.av-video') as HTMLVideoElement | null;
        video?.pause();
        openTryOn(tag.product, () => video?.play().catch(() => {}));
      });
    }
    stage.appendChild(card);
    requestAnimationFrame(() => card.classList.add('open'));
  }
}

// ---------------------------------------------------------------------------
// AI Try-on
// ---------------------------------------------------------------------------
// MVP implementation: webcam stream → snap to canvas → composite a tinted
// region matching the product category. A real production version should
// swap the static-region overlay for face-landmark detection (e.g. MediaPipe
// FaceLandmarker, TensorFlow.js face-landmarks-detection) so the tint follows
// the user's actual lips / cheeks / eyelids. The hook for that is `applyTint`
// below — replace the rect math with landmark-based polygons.
function openTryOn(
  product: {
    id: string;
    name: string;
    imageUrl: string;
    tryOn: TryOn | null;
  },
  onClose: () => void
) {
  if (!product.tryOn) return;
  const tryOn = product.tryOn;

  ensureStyles();
  const root = document.createElement('div');
  root.className = 'av-tryon av-root';
  root.dataset.theme = 'dark';
  root.innerHTML = `
    <div class="panel">
      <div class="head">
        <div>
          <h3>Try on · ${escapeAttr(product.name)}</h3>
          <div class="sub">Center your face in the frame, then tap Snap.</div>
        </div>
        <button class="close" aria-label="Close">×</button>
      </div>
      <div class="body">
        <div class="stage">
          <video autoplay playsinline muted></video>
          <canvas hidden></canvas>
          <div class="placeholder">Allow camera access to start the try-on.</div>
        </div>
        <div class="toolbar">
          <button class="action snap" type="button">📸 Snap</button>
          <button class="ghost reset" type="button" hidden>Try again</button>
          <button class="ghost save" type="button" hidden>Save photo</button>
        </div>
      </div>
      <div class="footer">
        <span class="swatch" style="background:${tryOn.tint}"></span>
        <span>Applying <strong>${tryOn.tint}</strong> to your <strong>${categoryLabel(
          tryOn.category
        )}</strong>.</span>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const video = root.querySelector('video') as HTMLVideoElement;
  const canvas = root.querySelector('canvas') as HTMLCanvasElement;
  const placeholder = root.querySelector('.placeholder') as HTMLElement;
  const snapBtn = root.querySelector('.snap') as HTMLButtonElement;
  const resetBtn = root.querySelector('.reset') as HTMLButtonElement;
  const saveBtn = root.querySelector('.save') as HTMLButtonElement;
  const closeBtn = root.querySelector('.close') as HTMLButtonElement;

  let stream: MediaStream | null = null;

  const cleanup = () => {
    stream?.getTracks().forEach((t) => t.stop());
    root.remove();
    onClose();
  };
  closeBtn.addEventListener('click', cleanup);

  // Start webcam
  navigator.mediaDevices
    ?.getUserMedia({ video: { facingMode: 'user', width: 720, height: 960 }, audio: false })
    .then((s) => {
      stream = s;
      video.srcObject = s;
      placeholder.style.display = 'none';
    })
    .catch((err) => {
      placeholder.textContent = `Couldn't access camera: ${err?.message ?? 'permission denied'}`;
      snapBtn.disabled = true;
    });

  snapBtn.addEventListener('click', () => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    // Mirror to match what the user sees in the preview
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();
    applyTint(canvas, tryOn);
    canvas.hidden = false;
    video.style.visibility = 'hidden';
    snapBtn.hidden = true;
    resetBtn.hidden = false;
    saveBtn.hidden = false;
  });

  resetBtn.addEventListener('click', () => {
    canvas.hidden = true;
    video.style.visibility = 'visible';
    snapBtn.hidden = false;
    resetBtn.hidden = true;
    saveBtn.hidden = true;
  });

  saveBtn.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `avori-tryon-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  });
}

function categoryLabel(c: TryOnCategory): string {
  return (
    {
      LIPSTICK: 'lips',
      LIP_GLOSS: 'lips',
      BLUSH: 'cheeks',
      EYESHADOW: 'eyelids',
      EYELINER: 'eyelids',
    }[c] ?? 'face'
  );
}

// Composite the product tint onto a region of the canvas determined by the
// category. NOTE: this is a static-region approximation — replace the rect /
// ellipse math with face-landmark detection for true tracking.
function applyTint(canvas: HTMLCanvasElement, tryOn: TryOn) {
  const ctx = canvas.getContext('2d')!;
  const { width: w, height: h } = canvas;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = tryOn.tint;

  if (tryOn.category === 'LIPSTICK' || tryOn.category === 'LIP_GLOSS') {
    // Lower-third center, narrow oval — approximates lips
    const cx = w / 2;
    const cy = h * 0.7;
    drawEllipse(ctx, cx, cy, w * 0.18, h * 0.045);
  } else if (tryOn.category === 'BLUSH') {
    // Two cheek circles
    drawEllipse(ctx, w * 0.32, h * 0.55, w * 0.12, h * 0.08);
    drawEllipse(ctx, w * 0.68, h * 0.55, w * 0.12, h * 0.08);
  } else if (tryOn.category === 'EYESHADOW' || tryOn.category === 'EYELINER') {
    // Upper-mid lids
    drawEllipse(ctx, w * 0.36, h * 0.4, w * 0.1, h * 0.025);
    drawEllipse(ctx, w * 0.64, h * 0.4, w * 0.1, h * 0.025);
  }
  ctx.restore();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number
) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function escapeAttr(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!;
  });
}

function cssEscape(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function boot() {
  const els = document.querySelectorAll<HTMLElement>('.shop-video-widget');
  els.forEach((el) => {
    if (el.dataset.avInit === '1') return;
    el.dataset.avInit = '1';
    new WidgetInstance(el).init();
  });
}

(window as unknown as { __avoriBoot?: () => void }).__avoriBoot = boot;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
