/* Jenis pesanan: Dine-in (nomor meja) atau Take away (ambil di outlet).
   Dipakai di keranjang.html (pilihan) dan pembayaran.html (ringkasan). Disimpan di localStorage. */
(function () {
  'use strict';
  var A = window.Arunika, I = window.I18N;
  if (!A || !I) return;
  var KEY = 'arunika_order_v1', TABLES = 20;
  var L = function (id, en) { return I.lang === 'en' ? en : id; };
  var page = location.pathname.split('/').pop();

  function read() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || '{}'), n = parseInt(o.table, 10);
      return { type: o.type === 'dinein' || o.type === 'takeaway' ? o.type : '', table: n >= 1 && n <= TABLES ? String(n) : '' };
    } catch (e) { return { type: '', table: '' }; }
  }
  var state = read();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('arunika:order'));
  }
  var order = {
    get: function () { return { type: state.type, table: state.table }; },
    set: function (p) { if ('type' in p) state.type = p.type; if ('table' in p) state.table = p.table; if (state.type !== 'dinein') state.table = state.type === 'takeaway' ? '' : state.table; save(); },
    clear: function () { state = { type: '', table: '' }; save(); },
    valid: function () { return state.type === 'takeaway' || (state.type === 'dinein' && !!state.table); },
    label: function () {
      if (state.type === 'dinein') return state.table ? L('Dine-in · Meja ' + state.table, 'Dine-in · Table ' + state.table) : 'Dine-in';
      if (state.type === 'takeaway') return L('Take away · Ambil di outlet', 'Take away · Pick up at outlet');
      return L('Belum dipilih', 'Not selected');
    }
  };
  A.order = order;

  var APPS = [['GoFood', 'https://gofood.co.id'], ['GrabFood', 'https://food.grab.com/id'], ['ShopeeFood', 'https://shopee.co.id']];
  var esc = A.esc;

  /* ---------- keranjang.html: pilihan jenis pesanan ---------- */
  function optBtn(type, icon, title, sub) {
    var on = state.type === type;
    return '<button type="button" role="radio" aria-checked="' + on + '" data-order-type="' + type + '" class="flex-1 p-3.5 rounded-xl text-left flex items-center gap-3 transition-all ' +
      (on ? 'border-2 border-primary bg-surface shadow-sm' : 'border border-outline-variant/40 bg-surface-container hover:bg-surface') + '">' +
      '<span class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ' + (on ? 'bg-primary-container text-white' : 'bg-surface-variant text-secondary') + '"><span class="material-symbols-outlined text-[22px]" aria-hidden="true">' + icon + '</span></span>' +
      '<span class="min-w-0"><span class="block font-label-lg text-sm font-semibold text-secondary">' + esc(title) + '</span><span class="block text-xs text-on-surface-variant">' + esc(sub) + '</span></span></button>';
  }
  function renderChooser(mount) {
    var h = '<section id="jenis-pesanan" aria-labelledby="order-type-title" class="p-5 rounded-2xl border border-surface-variant bg-surface-container-low text-on-surface">' +
      '<h2 id="order-type-title" class="font-headline-sm text-xl font-semibold text-secondary mb-3">' + esc(L('Jenis Pesanan', 'Order Type')) + '</h2>' +
      '<div role="radiogroup" aria-labelledby="order-type-title" class="flex flex-col sm:flex-row gap-3">' +
      optBtn('dinein', 'restaurant', 'Dine-in', L('Makan di tempat', 'Eat in')) +
      optBtn('takeaway', 'takeout_dining', 'Take away', L('Ambil di outlet', 'Pick up at the outlet')) + '</div>';
    if (state.type === 'dinein') {
      h += '<div class="mt-4"><label for="order-table" class="block font-label-md text-xs font-bold text-secondary mb-1.5">' + esc(L('Nomor Meja', 'Table Number')) + '</label>' +
        '<select id="order-table" class="w-full sm:w-64 h-11 px-3 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm"><option value="">' + esc(L('Pilih nomor meja', 'Choose table number')) + '</option>';
      for (var i = 1; i <= TABLES; i++) h += '<option value="' + i + '"' + (state.table === String(i) ? ' selected' : '') + '>' + esc(L('Meja ', 'Table ') + i) + '</option>';
      h += '</select><p id="order-table-hint" class="text-xs mt-1.5 min-h-[1rem] ' + (state.table ? 'text-on-surface-variant' : 'text-error') + '">' +
        esc(state.table ? L('Pesananmu akan diantar ke meja ini. Nomor meja ada di atas meja.', 'Your order will be brought to this table. The number is on the table.') : L('Pilih nomor meja sebelum lanjut ke pembayaran.', 'Choose a table number before paying.')) + '</p></div>';
    } else if (state.type === 'takeaway') {
      h += '<div class="mt-4 p-3.5 rounded-xl bg-surface border border-outline-variant/30 text-sm text-on-surface-variant leading-relaxed">' +
        '<p class="flex items-start gap-2"><span class="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">storefront</span><span>' + L('<strong>Take away hanya bisa diambil di outlet</strong> (Ruko Promenade, Jl. Dr. Ir. H. Soekarno MERR, Rungkut). Kami akan memanggil nomor pesananmu.', '<strong>Take away is pick-up at the outlet only</strong> (Ruko Promenade, Jl. Dr. Ir. H. Soekarno MERR, Rungkut). We will call your order number.') + '</span></p>' +
        '<p class="mt-3 flex items-start gap-2"><span class="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">two_wheeler</span><span>' + esc(L('Mau diantar? Pesan lewat aplikasi:', 'Want delivery? Order through an app:')) + '</span></p>' +
        '<div class="flex flex-wrap gap-2 mt-2 pl-6">' + APPS.map(function (a) { return '<a class="px-3 py-1.5 rounded-full border border-outline-variant text-secondary text-xs font-semibold hover:bg-surface-container" href="' + a[1] + '" target="_blank" rel="noopener noreferrer">' + a[0] + '</a>'; }).join('') + '</div>' +
        '<p class="mt-3 text-xs">' + esc(L('Pembayaran di website tetap bisa lewat QRIS, tunai, atau transfer BRI.', 'Payment on this site is still by QRIS, cash, or BRI transfer.')) + '</p></div>';
    } else {
      h += '<p class="mt-3 text-xs text-on-surface-variant">' + esc(L('Pilih salah satu untuk melanjutkan ke pembayaran.', 'Choose one to continue to payment.')) + '</p>';
    }
    mount.innerHTML = h + '</section>';
  }

  /* ---------- pembayaran.html: ringkasan jenis pesanan ---------- */
  function renderSummary(mount) {
    var ok = order.valid();
    mount.innerHTML = '<section class="p-4 sm:p-5 rounded-2xl border ' + (ok ? 'border-surface-variant bg-surface-container-low' : 'border-error/50 bg-error-container/30') + ' text-on-surface flex items-center justify-between gap-3" aria-labelledby="order-sum-title">' +
      '<div class="flex items-center gap-3 min-w-0"><span class="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-[22px]" aria-hidden="true">' + (state.type === 'takeaway' ? 'takeout_dining' : 'restaurant') + '</span></span>' +
      '<div class="min-w-0"><h2 id="order-sum-title" class="font-label-md text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">' + esc(L('Jenis Pesanan', 'Order Type')) + '</h2>' +
      '<p class="font-label-lg text-sm font-semibold text-secondary truncate">' + esc(order.label()) + '</p>' +
      (ok ? '' : '<p class="text-xs text-error mt-0.5">' + esc(state.type === 'dinein' ? L('Pilih nomor meja dulu.', 'Choose a table number first.') : L('Pilih Dine-in atau Take away dulu.', 'Choose Dine-in or Take away first.')) + '</p>') + '</div></div>' +
      '<a href="keranjang.html#jenis-pesanan" class="shrink-0 px-3 py-2 rounded-lg border border-outline-variant text-secondary text-xs font-semibold hover:bg-surface-container">' + esc(ok ? L('Ubah', 'Change') : L('Pilih', 'Choose')) + '</a></section>';
  }

  function render() {
    var m = document.getElementById('order-type-mount'); if (m) renderChooser(m);
    var s = document.getElementById('order-summary-mount'); if (s) renderSummary(s);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order-type]');
    if (b) { order.set({ type: b.getAttribute('data-order-type') }); return; }
    var a = e.target.closest('a[href]');
    if (!a || /^pembayaran/.test(page) || order.valid()) return;
    if (/(^|\/)pembayaran\.html(\?|#|$)/.test(a.getAttribute('href'))) {
      e.preventDefault();
      if (/^keranjang/.test(page)) {
        A.toast(L('Pilih jenis pesanan dulu (Dine-in / Take away).', 'Choose an order type first (Dine-in / Take away).'), 'info');
        var t = document.getElementById('jenis-pesanan'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else location.href = 'keranjang.html#jenis-pesanan';
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'order-table') order.set({ table: e.target.value });
  });
  window.addEventListener('arunika:order', render);
  window.addEventListener('arunika:lang', render);
  window.addEventListener('storage', function (ev) { if (ev.key === KEY) { state = read(); render(); } });
  render();
  if (location.hash === '#jenis-pesanan') { var t0 = document.getElementById('jenis-pesanan'); if (t0) setTimeout(function () { t0.scrollIntoView({ block: 'center' }); }, 60); }
})();
