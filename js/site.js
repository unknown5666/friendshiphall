/* Friendship Hall — Cinematic Editorial. Page behaviour (everything shared lives in fhe-core.js):
 *  1. Cable rail      on wide screens a hairline gold cable grows down the left margin as you read, ending in a
 *                     small hook; a vertical folio beside it names the chapter on screen.
 *  2. Lit prologue    wraps the prologue statement's words so CSS can light them in turn as it scrolls past.
 *  3. Contact us      the lift-slate dialog: any [data-enquire] link opens it; the brief is sent as a pre-filled
 *                     WhatsApp chat or email (there is no server). Styles: css/site.css §23.
 */
(() => {
  'use strict';

  const rail = document.querySelector('[data-rail]');
  if (!rail) return;

  const doc = document.documentElement;
  const label = rail.querySelector('[data-rail-label]');
  const folios = Array.from(document.querySelectorAll('[data-folio]'));
  const wide = matchMedia('(min-width: 1100px)');

  let ticking = false;
  let active = false;
  let io = null;

  const update = () => {
    ticking = false;
    const max = doc.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    rail.style.setProperty('--p', p.toFixed(4));
  };
  const request = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };

  const start = () => {
    if (active) return;
    active = true;
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request, { passive: true });
    update();
    if (label && 'IntersectionObserver' in window) {
      // a hairline band across the middle of the viewport: whichever chapter crosses it is "current"
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && en.target.dataset.folio) label.textContent = en.target.dataset.folio;
        });
      }, { rootMargin: '-50% 0px -49.9% 0px', threshold: 0 });
      folios.forEach((el) => io.observe(el));
    }
  };

  const stop = () => {
    if (!active) return;
    active = false;
    removeEventListener('scroll', request);
    removeEventListener('resize', request);
    if (io) { io.disconnect(); io = null; }
  };

  const sync = () => (wide.matches ? start() : stop());
  wide.addEventListener('change', sync);
  sync();
})();

/* 2. Lit prologue: one span per word, each with its share of the scroll range (--k, 0..1). Only where CSS can
 * drive it from scroll; elsewhere the statement is left untouched and fully lit. */
(() => {
  'use strict';
  const el = document.querySelector('.prologue__statement');
  if (!el || !(window.CSS && CSS.supports('animation-timeline: view()'))) return;
  const words = [];
  const walk = (node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 1) { walk(n); return; }
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const w = document.createElement('span');
        w.className = 'w';
        w.textContent = part;
        words.push(w);
        frag.append(w);
      });
      n.replaceWith(frag);
    });
  };
  walk(el);
  const last = Math.max(1, words.length - 1);
  words.forEach((w, i) => w.style.setProperty('--k', (i / last).toFixed(3)));
  el.classList.add('is-split');
})();

/* 3. Contact us: the lift slate. A full-screen <dialog>; the slate on the left mirrors the form as you fill it and
 * claps shut when the brief goes. Sending opens WhatsApp (Sales) or the visitor's email app with the brief written
 * out, so nothing is stored here. Without <dialog> support the [data-enquire] links keep their own href. */
(() => {
  'use strict';
  const dialog = document.querySelector('[data-brief]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const WA_SALES = '971529026105';
  const EMAIL = 'fhcrane@gmail.com';

  const doc = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => dialog.querySelector(s);
  const form = $('[data-brief-form]');
  const f = form.elements;
  const stage = $('[data-brief-stage]');
  const panel = $('.brief__panel');
  const slate = $('[data-slate]');
  const home = $('[data-slate-home]');
  const dock = $('[data-slate-dock]');
  const title = $('#brief-title');
  const kicker = $('[data-brief-kicker]');
  const dial = $('[data-dial]');
  const capOut = $('[data-cap-out]');
  const capHint = $('[data-cap-class]');
  const done = $('[data-brief-done]');
  const doneTitle = $('[data-done-title]');
  const doneText = $('[data-done-text]');
  const doneLink = $('[data-done-link]');
  const slot = (k) => slate.querySelector(`[data-slate="${k}"]`);

  /* ---- capacity: the slider runs 0..1000 on the same log scale as the fleet chapter (25 → 700 t), snapped to
     common crane sizes; the work line comes from the fleet chapter's classes */
  const SIZES = [25, 30, 35, 40, 50, 55, 60, 70, 80, 90, 100, 120, 130, 150, 160, 200, 220, 250, 300, 350, 400, 450, 500, 700];
  const CLASSES = [
    [65, '', 'City picks, HVAC & signage, plant maintenance'],
    [140, '', 'Precast, steel erection, tower-crane assembly'],
    [350, '', 'Bridge girders, heavy modules, tandem lifts'],
    [600, '', 'Heavy industrial, refinery & power, superlift work'],
    [Infinity, 'Flagship', 'Vessels, heavy plant, long-radius lifts'],
  ];
  const ADVISE = 'An engineer sizes the crane from your load and radius.';
  const tonnes = () => {
    const t = 25 * Math.pow(28, +f.capacity.value / 1000);
    return SIZES.reduce((a, b) => (Math.abs(Math.log(b / t)) < Math.abs(Math.log(a / t)) ? b : a));
  };
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const dateText = (v) => {
    const [y, m, d] = (v || '').split('-').map(Number);
    return y && m && d ? dateFmt.format(new Date(y, m - 1, d)) : '';
  };
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  f.date.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  /* ---- the slate: write a value in, with a little ink-in when it changes */
  let quiet = true;
  const write = (el, text, empty = false) => {
    el.classList.toggle('is-empty', empty);
    if (el.textContent === text) return;
    el.textContent = text;
    if (quiet || reduced) return;
    el.classList.remove('is-ink');
    void el.offsetWidth; // restart the animation
    el.classList.add('is-ink');
  };

  const sync = () => {
    const t = tonnes();
    const advise = f.advise.checked;
    f.capacity.disabled = advise;
    f.capacity.style.setProperty('--v', (+f.capacity.value / 1000).toFixed(4));
    f.capacity.setAttribute('aria-valuetext', `${t} tonnes`);
    dial.classList.toggle('is-advise', advise);
    slate.classList.toggle('is-advise', advise);
    capOut.textContent = `${t} T`;
    if (advise) {
      slot('t').textContent = 'To advise';
      capHint.textContent = ADVISE;
      write(slot('class'), ADVISE);
    } else {
      const [, label, use] = CLASSES.find(([max]) => t <= max);
      slot('t').textContent = String(t);
      capHint.textContent = `${label ? `${label}. ` : ''}Typical work: ${lower(use)}.`;
      write(slot('class'), label ? `${label}: ${lower(use)}` : use);
    }
    write(slot('service'), f.service.value);
    write(slot('site'), f.site.value || '—', !f.site.value);
    const when = dateText(f.date.value);
    write(slot('date'), when || '—', !when);
    const client = f.company.value.trim() || f.name.value.trim();
    write(slot('client'), client || '—', !client);
  };

  /* ---- checks: only after the first send attempt, then live as fields are corrected */
  const RULES = {
    name: (v) => (v.trim() ? '' : 'Add your name so we know who to ask for.'),
    phone: (v) => {
      if (!v.trim()) return 'Add a phone number so we can call you back.';
      return v.replace(/\D/g, '').length >= 7 ? '' : 'Check the number: it needs at least 7 digits.';
    },
    email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Check the email address, or leave it blank.'),
  };
  let tried = false;
  const check = (name) => {
    const input = f[name];
    const msg = RULES[name](input.value);
    const err = $(`[data-error-for="${input.id}"]`);
    if (err) err.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !msg;
  };

  form.addEventListener('input', (e) => {
    sync();
    if (tried && e.target.name in RULES) check(e.target.name);
  });
  form.addEventListener('change', sync);

  /* ---- the message */
  const compose = () => {
    const t = tonnes();
    const crane = f.advise.checked ? 'Not sure, please advise' : `${t} T`;
    const lines = ['Lift brief from the Friendship Hall website', '', `Service: ${f.service.value}`, `Crane: ${crane}`];
    if (f.sector.value) lines.push(`Sector: ${f.sector.value}`);
    if (f.site.value) lines.push(`Site: ${f.site.value}`);
    if (f.date.value) lines.push(`Start: ${dateText(f.date.value)}`);
    if (f.notes.value.trim()) lines.push('', f.notes.value.trim());
    lines.push('', `Name: ${f.name.value.trim()}`);
    if (f.company.value.trim()) lines.push(`Company: ${f.company.value.trim()}`);
    lines.push(`Phone: ${f.phone.value.trim()}`);
    if (f.email.value.trim()) lines.push(`Email: ${f.email.value.trim()}`);
    const subject = ['Lift enquiry', f.service.value, f.advise.checked ? '' : `${t} T`, f.site.value].filter(Boolean).join(' · ');
    return { lines, subject };
  };

  const clap = () => {
    slate.classList.remove('is-clapped');
    void slate.offsetWidth;
    slate.classList.add('is-clapped');
  };
  const toTop = () => {
    const behavior = reduced ? 'auto' : 'smooth';
    stage.scrollTo({ top: 0, behavior });
    panel.scrollTo({ top: 0, behavior });
  };

  let via = 'whatsapp';
  form.addEventListener('click', (e) => {
    const b = e.target.closest('button[type="submit"]');
    if (b) via = b.value;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    tried = true;
    const bad = Object.keys(RULES).filter((n) => !check(n));
    if (bad.length) { f[bad[0]].focus(); return; }

    const channel = (e.submitter && e.submitter.value) || via;
    const { lines, subject } = compose();
    let url;
    if (channel === 'email') {
      url = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\r\n'))}`;
      location.href = url;
    } else {
      url = `https://wa.me/${WA_SALES}?text=${encodeURIComponent(lines.join('\n'))}`;
      const w = window.open(url, '_blank');
      if (w) w.opener = null;
    }

    const email = channel === 'email';
    doneTitle.textContent = email ? 'Your email app is open with the brief.' : 'WhatsApp is open with your brief.';
    doneText.textContent = email
      ? 'Press send in your email app and our sales team will reply.'
      : 'Press send in WhatsApp and our sales team will reply.';
    doneLink.href = url;
    doneLink.target = email ? '_self' : '_blank';
    dialog.classList.add('is-done');
    done.hidden = false;
    toTop();
    clap();
    doneTitle.focus({ preventScroll: true });
  });

  const edit = () => {
    dialog.classList.remove('is-done');
    done.hidden = true;
    slate.classList.remove('is-clapped');
  };

  /* ---- slate placement: the scene column from 960px, above the send buttons on smaller screens */
  const wide = matchMedia('(min-width: 960px)');
  const place = () => {
    const target = wide.matches ? home : dock;
    if (slate.parentElement !== target) target.append(slate);
  };
  wide.addEventListener('change', place);
  place();

  /* ---- open / close: a curtain drops (clip-path), then lifts away before the dialog actually closes */
  let returnTo = null;
  let closing = 0;
  const open = (sector) => {
    if (dialog.open) return;
    returnTo = document.activeElement;
    f.sector.value = sector || '';
    kicker.textContent = sector ? `Contact us · ${sector}` : 'Contact us · 24/7';
    document.dispatchEvent(new CustomEvent('fhe:navigate', { detail: { hash: '#brief' } })); // closes the mobile menu
    doc.classList.add('brief-open');
    place();
    stage.scrollTop = 0;
    panel.scrollTop = 0;
    dialog.showModal();
    title.focus({ preventScroll: true });
    requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is-open')));
  };
  const close = () => {
    if (!dialog.open || closing) return;
    dialog.classList.remove('is-open');
    closing = setTimeout(() => dialog.close(), reduced ? 0 : 820);
  };
  dialog.addEventListener('close', () => {
    clearTimeout(closing);
    closing = 0;
    dialog.classList.remove('is-open');
    doc.classList.remove('brief-open');
    edit();
    if (returnTo && document.contains(returnTo)) returnTo.focus({ preventScroll: true });
  });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); }); // Escape: animate out
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-brief-close]')) close();
    else if (e.target.closest('[data-brief-edit]')) { edit(); title.focus({ preventScroll: true }); }
  });

  // capture phase: runs before fhe-core's in-page link handler, which then sees defaultPrevented and stands down
  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const trigger = e.target.closest('[data-enquire]');
    if (!trigger) return;
    e.preventDefault();
    open(trigger.dataset.enquire);
  }, true);

  sync();
  quiet = false;
})();
