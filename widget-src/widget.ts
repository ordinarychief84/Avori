// Avori embeddable widget — vanilla TS, no framework deps.
// Bundled to /public/widget.js via `npm run widget:build`.

type Mode = 'inline' | 'floating' | 'feed';

type Tag = {
  id: string;
  x: number;
  y: number;
  startTime: number;
  endTime: number;
  product: { id: string; name: string; price: number; imageUrl: string; productUrl: string };
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

const STYLES = `
.av-root,.av-root *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,system-ui,sans-serif}
.av-stage{position:relative;width:100%;aspect-ratio:9/16;background:#000;overflow:hidden;border-radius:12px;color:#fff}
.av-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
.av-overlay{position:absolute;inset:0;pointer-events:none}
.av-hot{position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(124,58,237,.85);border:2px solid #fff;box-shadow:0 0 0 4px rgba(124,58,237,.25);transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto;animation:avPulse 1.6s ease-out infinite}
@keyframes avPulse{0%{box-shadow:0 0 0 0 rgba(124,58,237,.5)}100%{box-shadow:0 0 0 14px rgba(124,58,237,0)}}
.av-mute{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.5);color:#fff;border:0;border-radius:9999px;width:32px;height:32px;cursor:pointer;font-size:14px;pointer-events:auto}
.av-meta{position:absolute;left:12px;bottom:14px;right:60px;text-shadow:0 1px 2px rgba(0,0,0,.6);pointer-events:none}
.av-meta .t{font-weight:600;font-size:14px;line-height:1.2}
.av-meta .d{font-size:12px;opacity:.85;margin-top:4px}

.av-card{position:absolute;left:0;right:0;bottom:0;background:#fff;color:#0a0a0a;padding:14px;border-radius:14px 14px 0 0;transform:translateY(110%);transition:transform .25s ease;pointer-events:auto;box-shadow:0 -8px 32px rgba(0,0,0,.25)}
.av-card.open{transform:translateY(0)}
.av-card .row{display:flex;gap:12px;align-items:center}
.av-card img{width:56px;height:56px;border-radius:8px;object-fit:cover}
.av-card .name{font-weight:600;font-size:14px}
.av-card .price{font-size:13px;color:#444;margin-top:2px}
.av-card .cta{display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-weight:600;font-size:13px;margin-left:auto}
.av-card .x{position:absolute;top:6px;right:8px;background:none;border:0;color:#666;font-size:18px;cursor:pointer}

.av-bubble{position:fixed;right:18px;bottom:18px;width:120px;height:200px;border-radius:14px;overflow:hidden;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:2147483646;background:#000}
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
.av-feed .close{position:absolute;top:14px;right:14px;background:rgba(0,0,0,.5);color:#fff;border:0;width:36px;height:36px;border-radius:9999px;cursor:pointer;font-size:18px;z-index:5}
.av-feed .av-stage{height:100%;border-radius:0;aspect-ratio:auto}
`;

class WidgetInstance {
  el: HTMLElement;
  brandId: string;
  api: string;
  mode: Mode;
  feed: Feed | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
    this.brandId = el.dataset.brandId || '';
    this.api =
      el.dataset.api ||
      (document.currentScript as HTMLScriptElement | null)?.src.replace(/\/widget\.js.*$/, '') ||
      '';
    this.mode = ((el.dataset.mode as Mode) || 'inline') as Mode;
  }

  async init() {
    if (!this.brandId) {
      console.warn('[avori] missing data-brand-id');
      return;
    }
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

  track(type: 'IMPRESSION' | 'VIEW' | 'TAG_CLICK' | 'CTA_CLICK', extras: { videoId?: string; productId?: string } = {}) {
    try {
      const payload = {
        brandId: this.brandId,
        type,
        domain: location.hostname,
        mode: this.mode,
        ...extras,
      };
      navigator.sendBeacon?.(
        `${this.api}/api/public/events`,
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      ) ||
        fetch(`${this.api}/api/public/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
    } catch {
      /* noop */
    }
  }

  renderInline() {
    const stage = this.buildStage(this.feed!.videos[0]);
    this.el.classList.add('av-root');
    this.el.appendChild(stage);
  }

  renderFloating() {
    const v = this.feed!.videos[0];
    const bubble = document.createElement('div');
    bubble.className = 'av-bubble av-root';
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
      const modal = document.createElement('div');
      modal.className = 'av-modal av-root';
      modal.innerHTML = `<button class="close" aria-label="Close">×</button><div class="frame"></div>`;
      const frame = modal.querySelector('.frame') as HTMLElement;
      frame.appendChild(this.buildStage(v));
      modal.querySelector('.close')!.addEventListener('click', () => modal.remove());
      document.body.appendChild(modal);
    });
  }

  renderFeed() {
    const overlay = document.createElement('div');
    overlay.className = 'av-feed av-root';
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
    const styleId = 'av-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

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
    card.innerHTML = `
      <button class="x" aria-label="Close">×</button>
      <div class="row">
        <img src="${escapeAttr(tag.product.imageUrl)}" alt="">
        <div>
          <div class="name"></div>
          <div class="price">$${tag.product.price.toFixed(2)}</div>
        </div>
        <a class="cta" target="_blank" rel="noopener" href="${escapeAttr(tag.product.productUrl)}">Shop</a>
      </div>
    `;
    (card.querySelector('.name') as HTMLElement).textContent = tag.product.name;
    card.querySelector('.x')!.addEventListener('click', () => card.classList.remove('open'));
    card.querySelector('.cta')!.addEventListener('click', () => {
      this.track('CTA_CLICK', { videoId: v.id, productId: tag.product.id });
    });
    stage.appendChild(card);
    requestAnimationFrame(() => card.classList.add('open'));
  }
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
