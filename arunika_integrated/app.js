/* Arunika — skrip bersama semua halaman: tema, keranjang (localStorage), toast,
   render menu dari menu-data.js (Beranda, Menu), badge keranjang. */
(function () {
  'use strict';
  var DATA = window.ARUNIKA_MENU || { categories: [], items: [] };
  var BY_ID = {}, BY_NAME = {};
  DATA.items.forEach(function (i) { BY_ID[i.id] = i; BY_NAME[i.name.toLowerCase()] = i; });
  var t = function (k, p, fb) { return window.I18N ? window.I18N.t(k, p, fb) : (fb != null ? fb : k); };
  var lang = function () { return (window.I18N && window.I18N.lang) || 'id'; };
  var money = function (n) { return 'Rp' + Math.round(n || 0).toLocaleString('id-ID'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var isFav = function (it) { return !!(it && it.home); };
  var starBadge = function () { return t('home.fav_badge'); };
  var descOf = function (it) { return t('menu.desc.' + it.id, null, it.desc); };
  var catLabel = function (c) { return c.label[lang()] || c.label.id; };

  /* ---------- Tema (mode gelap) ---------- */
  var THEME_KEY = 'arunika_theme';
  function applyTheme(mode) {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    var btns = document.querySelectorAll('[data-theme-toggle]');
    btns.forEach(function (b) {
      var dark = mode === 'dark';
      var ic = b.querySelector('.material-symbols-outlined'); if (ic) ic.textContent = dark ? 'light_mode' : 'dark_mode';
      b.setAttribute('aria-label', t(dark ? 'nav.theme_light' : 'nav.theme_dark'));
      b.setAttribute('aria-pressed', String(dark));
    });
  }
  function currentTheme() { return document.documentElement.classList.contains('dark') ? 'dark' : 'light'; }
  function initTheme() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
        applyTheme(next);
      });
    });
    applyTheme(currentTheme());
  }

  /* ---------- Keranjang ---------- */
  var CART_KEY = 'arunika_cart_v1';
  function readCart() {
    try {
      var a = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); if (!Array.isArray(a)) return [];
      var merged = {};
      a.forEach(function (x) {
        var it = BY_ID[x && x.id] || BY_NAME[String((x && x.name) || '').toLowerCase()]; if (!it) return;
        var q = Math.max(0, Math.floor(Number(x.qty) || 0)); if (q) merged[it.id] = (merged[it.id] || 0) + q;
      });
      return Object.keys(merged).map(function (id) { return { id: id, qty: merged[id] }; });
    } catch (e) { return []; }
  }
  var state = readCart();
  function lines() { return state.map(function (s) { var it = BY_ID[s.id]; return Object.assign({}, it, { qty: s.qty, sum: it.price * s.qty }); }); }
  function persist() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state)); } catch (e) {}
    emit();
  }
  function emit(bump) {
    renderBadges(bump);
    window.dispatchEvent(new CustomEvent('arunika:cart', { detail: { items: lines() } }));
  }
  var cart = {
    get: lines,
    count: function () { return state.reduce(function (a, s) { return a + s.qty; }, 0); },
    total: function () { return lines().reduce(function (a, l) { return a + l.sum; }, 0); },
    qty: function (id) { var s = state.filter(function (x) { return x.id === id; })[0]; return s ? s.qty : 0; },
    set: function (id, q) {
      if (!BY_ID[id]) return; q = Math.max(0, Math.floor(q));
      var found = false;   // pertahankan urutan produk di keranjang
      state = state.map(function (x) { if (x.id === id) { found = true; return { id: id, qty: q }; } return x; })
                   .filter(function (x) { return x.qty > 0; });
      if (q && !found) state.push({ id: id, qty: q });
      persist();
    },
    add: function (id, n) { cart.set(id, cart.qty(id) + (n || 1)); emit(true); },
    dec: function (id) { cart.set(id, cart.qty(id) - 1); },
    remove: function (id) { cart.set(id, 0); },
    clear: function () { state = []; persist(); },
    totals: function () { var sub = cart.total(), tax = Math.round(sub * 0.1); return { sub: sub, tax: tax, total: sub + tax }; }
  };
  function renderBadges(bump) {
    var n = cart.count();
    document.querySelectorAll('[data-cart-badge]').forEach(function (b) {
      b.textContent = n > 99 ? '99+' : String(n); b.hidden = n === 0;
      if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
    document.querySelectorAll('[data-cart-link]').forEach(function (a) { a.setAttribute('aria-label', t('cart.aria', { n: n })); });
  }

  /* ---------- Toast ---------- */
  var toastEl, toastTimer;
  function toast(msg, icon) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'arunika-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">' + (icon || 'check_circle') + '</span><span>' + esc(msg) + '</span>';
    void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  function flash(btn) {
    if (btn.dataset.flashing) return;
    btn.dataset.flashing = '1';
    var html = btn.innerHTML;
    btn.classList.add('is-added');
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px]" aria-hidden="true">check</span> ' + esc(t('btn.added'));
    setTimeout(function () { btn.classList.remove('is-added'); btn.innerHTML = html; delete btn.dataset.flashing; }, 1100);
  }

  /* Klik "tambah": tombol [data-add] atau tombol "+ Tambah" lama di halaman kategori menu */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]'), it;
    if (btn) { it = BY_ID[btn.getAttribute('data-add')]; }
    else {
      var b = e.target.closest('button');
      if (!b || b.closest('[data-no-legacy-add]') || !/^\s*\+?\s*(tambah|add)\s*$/i.test(b.textContent)) return;
      var node = b, h3 = null;
      for (var i = 0; i < 5 && node && !h3; i++) { node = node.parentElement; h3 = node && node.querySelector('h3'); }
      it = h3 && BY_NAME[h3.textContent.trim().toLowerCase()]; btn = b;
    }
    if (!it) return;
    cart.add(it.id);
    toast(t('toast.added', { name: it.name }));
    flash(btn);
  });

  /* ---------- Render: Beranda (Menu Favorit) ---------- */
  function renderFavorites() {
    var host = document.getElementById('fav-grid'); if (!host) return;
    host.innerHTML = DATA.items.filter(isFav).map(function (it, idx) {
      return '<article class="fav-card w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(25%-0.75rem)] p-4 md:p-5 rounded-2xl bg-surface-container-low border border-surface-variant/40 shadow-[0_4px_20px_-2px_rgba(120,87,68,0.06)] hover:shadow-[0_8px_24px_-4px_rgba(120,87,68,0.12)] transition-all flex flex-col gap-3 h-full' + '">' +
        '<div class="relative w-full aspect-square rounded-xl overflow-hidden shrink-0 bg-surface-container">' +
        '<img alt="' + esc(it.name) + '" class="w-full h-full object-cover" loading="lazy" src="' + esc(it.img) + '"/>' +
        '<span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#A2662A] text-white font-label-md text-[10px] font-semibold leading-none shadow-sm">★ ' + esc(t('home.fav_badge')) + '</span></div>' +
        '<div class="flex flex-col flex-1 min-w-0">' +
        '<h3 class="font-headline-sm text-base md:text-lg text-secondary leading-snug"><span class="text-[#A2662A] mr-1" aria-hidden="true">★</span>' + esc(it.name) + '</h3>' +
        '<p class="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1 line-clamp-2">' + esc(descOf(it)) + '</p>' +
        '<div class="flex flex-col items-stretch gap-2 mt-auto pt-3">' +
        '<span class="font-price-lg text-base md:text-lg text-secondary">' + money(it.price) + '</span>' +
        '<button type="button" data-add="' + it.id + '" aria-label="' + esc(t('btn.add_named', { name: it.name })) + '" class="h-9 px-3 w-full justify-center rounded-full bg-primary-container text-white font-label-md text-xs font-semibold inline-flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all">' +
        '<span class="material-symbols-outlined text-[16px]" aria-hidden="true">add_shopping_cart</span>' + esc(t('btn.add_cart')) + '</button></div></div></article>';
    }).join('');
  }

  /* ---------- Render: halaman Menu (kopi) + keranjang samping ---------- */
  var menuState = { q: '', fav: false };
  var SUB_DOT = ['bg-[#536124]', 'bg-caramel', 'bg-coffee-dark'];
  function renderMenuPage() {
    var host = document.getElementById('menu-catalog'); if (!host) return;
    var cat = host.getAttribute('data-cat') || 'coffee';
    var q = menuState.q.toLowerCase();
    var favN = DATA.items.filter(function (i) { return i.cat === cat && isFav(i); }).length;
    var fc = document.getElementById('favFilterCount'); if (fc) fc.textContent = favN ? '(' + favN + ')' : '';
    var items = DATA.items.filter(function (i) { return i.cat === cat && (!q || i.name.toLowerCase().indexOf(q) > -1) && (!menuState.fav || isFav(i)); });
    var subs = []; items.forEach(function (i) { if (subs.indexOf(i.sub) < 0) subs.push(i.sub); });
    if (!items.length) { host.innerHTML = '<p class="py-10 text-center text-on-surface-variant font-body-md">' + esc(t('menu.empty')) + '</p>'; return; }
    host.innerHTML = subs.map(function (sub, si) {
      var list = items.filter(function (i) { return i.sub === sub; });
      return '<section class="menu-category-section space-y-4" aria-labelledby="sub-' + si + '"><div class="flex items-baseline justify-between border-b border-[#785744]/10 pb-2"><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full ' + SUB_DOT[si % 3] + '"></span><h2 id="sub-' + si + '" class="font-headline-sm text-xl md:text-2xl font-bold text-coffee-dark">' + esc(sub) + '</h2></div>' +
        '<span class="font-label-md text-xs tracking-wider text-on-surface-variant/80 font-semibold">' + esc(t('menu.n_options', { n: list.length })) + '</span></div>' +
        '<div class="menu-grid">' + list.map(menuCard).join('') + '</div></section>';
    }).join('');
  }
  function menuCard(it) {
    return '<article class="menu-item-card bg-surface-container-low hover:bg-surface-container p-3.5 rounded-xl flex gap-3.5 items-center shadow-[0_4px_20px_-2px_rgba(120,87,68,0.06),0_2px_6px_-1px_rgba(120,87,68,0.04)] border border-[#785744]/10 transition-all hover:-translate-y-0.5 active:scale-[0.99]">' +
      '<div class="relative w-20 h-20 md:w-22 md:h-22 shrink-0 rounded-lg overflow-hidden bg-surface-container"><img alt="' + esc(it.name) + '" class="w-full h-full object-cover" loading="lazy" src="' + esc(it.img) + '"/>' +
      (isFav(it) ? '<span class="absolute top-1 left-1 w-5 h-5 inline-flex items-center justify-center rounded-full bg-[#A2662A] text-white text-[11px] leading-none shadow-sm" title="' + esc(starBadge()) + '" aria-label="' + esc(starBadge()) + '">★</span>' : '') + '</div>' +
      '<div class="flex flex-col flex-1 min-w-0 justify-between py-0.5 h-full"><div>' +
      '<h3 class="font-headline-sm text-[16px] md:text-[17px] font-semibold text-coffee-dark leading-snug truncate">' + (isFav(it) ? '<span class="text-[#A2662A] mr-1" role="img" aria-label="' + esc(starBadge()) + '">★</span>' : '') + esc(it.name) + '</h3>' +
      '<p class="font-body-sm text-[12px] md:text-[13px] text-on-surface-variant leading-snug line-clamp-2 mt-0.5">' + esc(descOf(it)) + '</p></div>' +
      '<div class="flex items-center justify-between pt-2 mt-auto"><span class="font-price-lg text-lg md:text-xl font-bold text-coffee-dark tabular-nums">' + money(it.price) + '</span>' +
      '<button type="button" data-add="' + it.id + '" aria-label="' + esc(t('btn.add_named', { name: it.name })) + '" class="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-primary-container text-primary-container hover:text-white font-label-md text-xs font-semibold inline-flex items-center gap-1 active:scale-95 transition-all"><span class="material-symbols-outlined text-[15px]" aria-hidden="true">add</span>' + esc(t('btn.add')) + '</button></div></div></article>';
  }
  function syncFavBtn(f) {
    if (!f) return;
    f.setAttribute('aria-pressed', String(menuState.fav));
    f.classList.toggle('bg-[#A2662A]', menuState.fav); f.classList.toggle('text-white', menuState.fav);
    f.classList.toggle('bg-[#A2662A]/10', !menuState.fav); f.classList.toggle('text-[#A2662A]', !menuState.fav);
  }
  function initMenuPage() {
    var host = document.getElementById('menu-catalog'); if (!host) return;
    var s = document.getElementById('menuSearchInput'), f = document.getElementById('favFilterBtn');
    if (/favorit/i.test(location.hash)) { menuState.fav = true; syncFavBtn(f); }
    if (s) s.addEventListener('input', function () { menuState.q = s.value.trim(); renderMenuPage(); });
    if (f) f.addEventListener('click', function () {
      menuState.fav = !menuState.fav; syncFavBtn(f);
      try { history.replaceState(null, '', menuState.fav ? '#favorit' : location.pathname + location.search); } catch (e) {}
      renderMenuPage();
    });
    renderMenuPage();
  }
  function renderSideCart() {
    var host = document.getElementById('cart-lines'); if (!host) return;
    var ls = cart.get(), sub = cart.total(), tax = Math.round(sub * 0.1);
    var pill = document.getElementById('cart-count-pill'); if (pill) pill.textContent = t('cart.n_items', { n: cart.count() });
    host.innerHTML = ls.length ? ls.map(function (l) {
      return '<div class="pt-3 flex items-start justify-between gap-3" data-no-legacy-add><div class="flex-1 min-w-0"><h4 class="font-headline-sm text-sm font-semibold text-coffee-dark">' + esc(l.name) + '</h4>' +
        '<div class="flex items-center gap-1.5 mt-2"><button type="button" class="qty-btn" data-cart-dec="' + l.id + '" aria-label="' + esc(t('cart.dec', { name: l.name })) + '">−</button>' +
        '<span class="min-w-[1.5rem] text-center text-sm font-semibold text-coffee-dark" aria-live="polite">' + l.qty + '</span>' +
        '<button type="button" class="qty-btn" data-cart-inc="' + l.id + '" aria-label="' + esc(t('cart.inc', { name: l.name })) + '">+</button></div></div>' +
        '<span class="font-price-lg text-sm font-bold text-coffee-dark tabular-nums">' + money(l.sum) + '</span></div>';
    }).join('') : '<p class="pt-3 text-sm text-on-surface-variant">' + esc(t('cart.empty_short')) + '</p>';
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    set('cart-subtotal', money(sub)); set('cart-tax', money(tax)); set('cart-total', money(sub + tax));
    var go = document.getElementById('cart-checkout');
    if (go) { go.setAttribute('aria-disabled', String(!ls.length)); go.classList.toggle('opacity-50', !ls.length); go.classList.toggle('pointer-events-none', !ls.length); }
  }
  document.addEventListener('click', function (e) {
    var i = e.target.closest('[data-cart-inc]'), d = e.target.closest('[data-cart-dec]');
    if (i) cart.add(i.getAttribute('data-cart-inc')); else if (d) cart.dec(d.getAttribute('data-cart-dec'));
  });

  /* Halaman kategori statis: samakan harga & deskripsi dengan menu-data.js */
  function hydrateStatic() {
    if (document.getElementById('menu-catalog')) return;
    document.querySelectorAll('h3').forEach(function (h) {
      var it = BY_NAME[h.textContent.trim().toLowerCase()]; if (!it) return;
      var card = h.parentElement; for (var i = 0; i < 4 && card && !/Rp\s?\d/.test(card.textContent); i++) card = card.parentElement;
      if (!card) return;
      var p = h.nextElementSibling; if (p && p.tagName === 'P') p.textContent = descOf(it);
      var pr = Array.prototype.filter.call(card.querySelectorAll('span'), function (s) { return /^\s*Rp\s?[\d.]+\s*$/.test(s.textContent) && !s.children.length; })[0];
      if (pr) pr.textContent = money(it.price);
    });
  }

  function syncLegacy() {
    var n = cart.count(), txt = t('cart.n_items', { n: n }) + ' · ' + money(cart.total());
    document.querySelectorAll('[data-cart-summary]').forEach(function (e) { e.textContent = txt; });
    document.querySelectorAll('[data-cart-count]').forEach(function (e) { e.textContent = n; });
  }
  function renderAll() { syncLegacy(); renderFavorites(); renderMenuPage(); renderSideCart(); hydrateStatic(); renderBadges(); applyTheme(currentTheme()); }
  window.addEventListener('arunika:lang', renderAll);
  window.addEventListener('arunika:cart', function () { renderSideCart(); syncLegacy(); });
  window.addEventListener('storage', function (e) { if (e.key === CART_KEY) { state = readCart(); emit(); } });

  /* ---------- WhatsApp (satu sumber nomor: 085175474311 -> 6285175474311) ---------- */
  var WA_NUMBER = '6285175474311';
  function waUrl(text) { return 'https://wa.me/' + WA_NUMBER + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function orderMessage(opt) {
    var ls = cart.get(); if (!ls.length) return '';
    var tt = cart.totals(), out = [t('wa.order_hello'), '', t('wa.order_items')];
    ls.forEach(function (l, i) { out.push((i + 1) + '. ' + l.qty + 'x ' + l.name + ' — ' + money(l.sum)); });
    out.push('', t('wa.order_subtotal') + ': ' + money(tt.sub), t('wa.order_tax') + ': ' + money(tt.tax), t('wa.order_total') + ': ' + money(tt.total));
    if (opt && opt.method) out.push(t('wa.order_method') + ': ' + opt.method);
    if (opt && opt.extra) opt.extra.forEach(function (x) { out.push(x); });
    out.push('', t('wa.order_close'));
    return out.join('\n');
  }

  window.Arunika = { WA: WA_NUMBER, waUrl: waUrl, orderMessage: orderMessage, cart: cart, menu: DATA, byId: BY_ID, money: money, toast: toast, esc: esc, descOf: descOf, catLabel: catLabel };
  /* ---------- Status buka/tutup (WIB, 08.00–22.00) ---------- */
  function isOpenNow() {
    var h = 0, m = 0;
    try {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      p.forEach(function (x) { if (x.type === 'hour') h = +x.value; if (x.type === 'minute') m = +x.value; });
    } catch (e) { var d = new Date(); h = d.getHours(); m = d.getMinutes(); }
    var mins = h * 60 + m; return mins >= 8 * 60 && mins < 22 * 60;
  }
  function updateOpenStatus() {
    var open = isOpenNow();
    document.querySelectorAll('[data-open-status]').forEach(function (el) {
      el.textContent = t(open ? 'nav.open' : 'nav.closed');
      var dot = el.previousElementSibling;
      if (dot) { dot.classList.toggle('bg-primary-container', open); dot.classList.toggle('animate-pulse', open); dot.classList.toggle('bg-outline', !open); }
    });
  }
  function init() { initTheme(); initMenuPage(); renderAll(); updateOpenStatus(); setInterval(updateOpenStatus, 60000); window.addEventListener('arunika:lang', updateOpenStatus); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Panel keranjang desktop (halaman menu): buka/tutup lewat tombol, Esc menutup */
(function () {
  function panel() { return document.getElementById('desktop-cart'); }
  function setOpen(open) {
    var p = panel(), b = document.getElementById('cart-toggle'); if (!p || !b) return;
    p.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open));
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('#cart-toggle')) { var p = panel(); setOpen(!(p && p.classList.contains('is-open'))); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
})();
