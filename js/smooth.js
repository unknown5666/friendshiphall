/* Friendship Hall — smooth scrolling. Lenis (js/vendor/lenis.min.js) eases wheel and trackpad scrolling.
 * Touch keeps native scrolling and reduced-motion users get none. It holds still while the intro, the mobile
 * menu or the Contact us dialog has the page; those overlays scroll natively ([data-lenis-prevent]).
 * fhe-core.js routes in-page links through window.FHE_LENIS when it exists. */
(() => {
  'use strict';
  if (typeof window.Lenis !== 'function') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const lenis = new window.Lenis({ autoRaf: true, lerp: 0.085 });
  window.FHE_LENIS = lenis;

  const doc = document.documentElement;
  const held = () => ['is-preloading', 'nav-open', 'brief-open'].some((c) => doc.classList.contains(c));
  let stopped = false;
  const sync = () => {
    const hold = held();
    if (hold === stopped) return;
    stopped = hold;
    if (hold) lenis.stop(); else lenis.start();
  };
  new MutationObserver(sync).observe(doc, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
