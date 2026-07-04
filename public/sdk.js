/*!
 * Avori SDK v1.0.0 (dependency-free, ~3KB)
 *
 * <script src="https://app.avori.com/sdk.js" async></script>
 * <script>
 *   window.avoriReady = function (Avori) {
 *     Avori.init({ brandId: "YOUR_BRAND_ID" });
 *     Avori.widget({ mode: "floating" });                  // shoppable video
 *     Avori.reviews("product_id").then(render);            // reviews JSON
 *     Avori.openQuiz("find-your-shade");                   // hosted quiz modal
 *     Avori.openShadeAnalyzer();                           // hosted analyzer modal
 *     Avori.track("CTA_CLICK", { productId: "..." });      // analytics event
 *   };
 * </script>
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var BASE = '';
  try {
    BASE = new URL(script && script.src ? script.src : location.href).origin;
  } catch (e) {
    BASE = '';
  }

  var state = { brandId: null };

  function req(path, options) {
    return fetch(BASE + path, options).then(function (res) {
      if (!res.ok) throw new Error('Avori request failed (' + res.status + ')');
      return res.json();
    });
  }

  function need() {
    if (!state.brandId) throw new Error('Call Avori.init({ brandId }) first');
    return state.brandId;
  }

  function modal(src, label) {
    var overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', label);
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;background:rgba(13,13,13,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
    var frame = document.createElement('iframe');
    frame.src = src;
    frame.allow = 'camera';
    frame.style.cssText =
      'width:min(480px,100%);height:min(760px,94vh);border:0;border-radius:16px;background:#fff;box-shadow:0 24px 64px rgba(13,13,13,.35);';
    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '&times;';
    close.style.cssText =
      'position:absolute;top:14px;right:16px;width:36px;height:36px;border:0;border-radius:999px;background:#fff;color:#0d0d0d;font-size:22px;line-height:1;cursor:pointer;';
    function destroy() {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    }
    function onKey(e) {
      if (e.key === 'Escape') destroy();
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) destroy();
    });
    close.addEventListener('click', destroy);
    document.addEventListener('keydown', onKey);
    overlay.appendChild(frame);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    return destroy;
  }

  var Avori = {
    version: '1.0.0',
    base: BASE,

    init: function (opts) {
      if (!opts || !opts.brandId) throw new Error('Avori.init requires { brandId }');
      state.brandId = String(opts.brandId);
      return Avori;
    },

    /** Mount the shoppable video widget. opts: { mode, productId, target } */
    widget: function (opts) {
      opts = opts || {};
      var host = opts.target || document.body;
      var div = document.createElement('div');
      div.className = 'shop-video-widget';
      div.setAttribute('data-brand-id', need());
      div.setAttribute('data-mode', opts.mode || 'floating');
      if (opts.productId) div.setAttribute('data-product-id', opts.productId);
      host.appendChild(div);
      if (!document.querySelector('script[data-avori-widget]')) {
        var s = document.createElement('script');
        s.src = BASE + '/widget.js';
        s.async = true;
        s.setAttribute('data-avori-widget', '1');
        document.head.appendChild(s);
      }
      return div;
    },

    /** Approved reviews + rating breakdown for a product. */
    reviews: function (productId) {
      return req('/api/public/brand/' + need() + '/reviews?productId=' + encodeURIComponent(productId));
    },

    /** Shoppable social feed. */
    socialFeed: function () {
      return req('/api/public/brand/' + need() + '/social');
    },

    /** Curated UGC gallery. Pass a productId to narrow to one product. */
    ugc: function (productId) {
      var q = productId ? '?productId=' + encodeURIComponent(productId) : '';
      return req('/api/public/brand/' + need() + '/ugc' + q);
    },

    /** Open a hosted quiz in a modal. Returns a close() function. */
    openQuiz: function (slug) {
      return modal(BASE + '/q/' + need() + '/' + encodeURIComponent(slug), 'Product quiz');
    },

    /** Open the hosted AI shade analyzer in a modal. Returns close(). */
    openShadeAnalyzer: function () {
      return modal(BASE + '/s/' + need(), 'Shade analyzer');
    },

    /** Fire an analytics event (IMPRESSION, VIEW, TAG_CLICK, CTA_CLICK...). */
    track: function (type, data) {
      data = data || {};
      var body = { brandId: need(), type: type };
      if (data.productId) body.productId = data.productId;
      if (data.videoId) body.videoId = data.videoId;
      return fetch(BASE + '/api/public/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(function () {});
    },
  };

  window.Avori = Avori;
  if (typeof window.avoriReady === 'function') {
    try {
      window.avoriReady(Avori);
    } catch (e) {
      console.error('[avori] avoriReady failed', e);
    }
  }
})();
