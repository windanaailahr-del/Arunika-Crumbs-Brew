/* Integrasi lintas halaman:
   1) Panel "Keranjang aktif" di keranjang.html & pembayaran.html (memakai Arunika.cart di app.js).
   2) Semua tautan WhatsApp (wa.me) otomatis berisi pesan yang relevan:
      isi keranjang bila ada pesanan, ringkasan reservasi di halaman Reservasi, atau salam umum. */
(function () {
  'use strict';
  if (!window.Arunika || !window.I18N) return;
  var A = window.Arunika, t = function (k, p) { return window.I18N.t(k, p); };
  var page = location.pathname.split('/').pop();

  /* ---------- 1. Keranjang aktif ---------- */
  if (/^(keranjang|pembayaran)/.test(page)) {
    var mount = document.getElementById('live-cart-mount');
    var panel = document.createElement('section');
    panel.id = 'arunika-live-cart';
    panel.setAttribute('aria-labelledby', 'live-cart-title');
    panel.className = (mount ? 'w-full' : 'max-w-[1100px] mx-auto my-4') + ' p-5 rounded-2xl border border-surface-variant bg-surface-container-low text-on-surface';
    var render = function () {
      var ls = A.cart.get(), tt = A.cart.totals(), onCartPage = /^keranjang/.test(page);
      panel.innerHTML = '<h2 id="live-cart-title" class="font-headline-sm text-xl font-semibold text-secondary mb-3">' + A.esc(t('cart.title')) + '</h2>' +
        (ls.length ? ls.map(function (l) {
          return '<div class="flex items-center justify-between gap-3 py-2.5 border-b border-surface-variant/60"><div class="min-w-0"><p class="font-label-lg text-sm font-semibold truncate">' + A.esc(l.name) + '</p>' +
            '<div class="flex items-center gap-1.5 mt-1.5"><button type="button" class="qty-btn" data-cart-dec="' + l.id + '" aria-label="' + A.esc(t('cart.dec', { name: l.name })) + '">−</button><span class="min-w-[1.5rem] text-center text-sm font-semibold">' + l.qty + '</span><button type="button" class="qty-btn" data-cart-inc="' + l.id + '" aria-label="' + A.esc(t('cart.inc', { name: l.name })) + '">+</button></div></div>' +
            '<div class="flex items-center gap-3"><b class="tabular-nums">' + A.money(l.sum) + '</b>' +
            '<button type="button" data-cart-remove="' + l.id + '" class="qty-btn" title="' + A.esc(t('cart.remove', { name: l.name })) + '" aria-label="' + A.esc(t('cart.remove', { name: l.name })) + '"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span></button></div></div>';
        }).join('') +
          '<div class="pt-3 space-y-1 text-sm text-on-surface-variant"><div class="flex justify-between"><span>' + A.esc(t('cart.subtotal')) + '</span><span class="tabular-nums" data-cart-sub>' + A.money(tt.sub) + '</span></div><div class="flex justify-between"><span>PB1 (10%)</span><span class="tabular-nums">' + A.money(tt.tax) + '</span></div><div class="flex justify-between text-base font-bold text-on-surface"><span>' + A.esc(t('cart.total')) + '</span><span class="tabular-nums" data-cart-total>' + A.money(tt.total) + '</span></div></div>'
          : '<p class="text-sm text-on-surface-variant">' + A.esc(t('cart.empty')) + '</p>') +
        '<div class="flex flex-wrap gap-2 mt-4"><a href="menu.html" class="px-4 py-2.5 rounded-lg bg-primary-container text-surface text-sm font-medium">' + A.esc(t('cart.add_more')) + '</a>' +
        (onCartPage && ls.length ? '<a href="pembayaran.html" class="px-4 py-2.5 rounded-lg bg-primary-container text-surface text-sm font-medium">' + A.esc(t('menu.lanjut_ke_pembayaran')) + '</a>' : '') +
        '<a href="reservasi.html" class="px-4 py-2.5 rounded-lg border border-outline-variant text-secondary text-sm font-medium">' + A.esc(t('cart.to_reserve')) + '</a>' +
        (ls.length ? '<button type="button" id="arunika-clear-cart" class="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm">' + A.esc(t('cart.clear')) + '</button>' : '') + '</div>';
      var c = panel.querySelector('#arunika-clear-cart'); if (c) c.addEventListener('click', function () { A.cart.clear(); });
      var n = document.getElementById('cart-item-count');
      if (n) n.textContent = A.cart.count() + ' ' + (window.I18N.lang === 'en' ? 'item(s) selected' : 'Item Terpilih');
    };
    panel.addEventListener('click', function (e) { var r = e.target.closest('[data-cart-remove]'); if (r) A.cart.remove(r.getAttribute('data-cart-remove')); });
    render();
    if (mount) mount.appendChild(panel); else (document.querySelector('main') || document.body).prepend(panel);
    window.addEventListener('arunika:cart', render); window.addEventListener('arunika:lang', render);
  }

  /* ---------- 2. Tautan WhatsApp kontekstual ---------- */
  function contextMessage() {
    var r = window.ArunikaReservasi && window.ArunikaReservasi.message();
    if (r) return r;
    return A.orderMessage() || t('wa.generic');
  }
  function refreshWaLinks() {
    var msg = null;
    document.querySelectorAll('a[href*="wa.me/' + A.WA + '"]').forEach(function (a) {
      if (a.hasAttribute('data-wa-manual') || a.id === 'btn-submit-whatsapp') return;
      var h = a.getAttribute('href');
      if (h.indexOf('?text=') > -1 && !a.hasAttribute('data-wa-auto')) return;   // pesan khusus (mis. paket layanan) dibiarkan
      a.setAttribute('data-wa-auto', '');
      if (msg === null) msg = contextMessage();
      a.setAttribute('href', A.waUrl(msg));
      a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer');
    });
  }
  window.addEventListener('arunika:cart', refreshWaLinks);
  window.addEventListener('arunika:lang', refreshWaLinks);
  window.addEventListener('arunika:wa-context', refreshWaLinks);
  refreshWaLinks();
})();
