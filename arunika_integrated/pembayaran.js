/* Halaman pembayaran demo Arunika: QRIS ilustrasi + simulasi status pembayaran (tanpa transaksi uang sungguhan). */
(function () {
  'use strict';
  var A = window.Arunika, I = window.I18N, card = document.getElementById('payment-card');
  if (!A || !card) return;
  var $ = function (id) { return document.getElementById(id); };
  var L = function (idText, enText) { return I && I.lang === 'en' ? enText : idText; };
  var method = 'qris', confirmed = false, receipt = null, proofFile = null, proofUrl = '';
  var TIMER_SECONDS = 15 * 60, deadline = 0, timerId = null, lastTotal = -1;
  var MAX_BYTES = 5 * 1024 * 1024, OK_EXT = /\.(jpe?g|png|webp)$/i, OK_MIME = /^image\/(jpeg|png|webp)$/i;

  /* ---------- metode ---------- */
  var PANELS = { qris: 'pay-panel-qris', cash: 'pay-panel-cash', tf: 'pay-panel-tf' };
  var STEPS = { qris: 'pay-steps-qris', cash: 'pay-steps-cash', tf: 'pay-steps-tf' };
  var ACTIVE = ['border-2', 'border-primary', 'bg-surface', 'shadow-sm'];
  var IDLE = ['bg-surface-container', 'opacity-70', 'hover:opacity-100', 'border', 'border-outline-variant/20'];

  function setMethod(m) {
    method = m; $('pay-status').textContent = '';
    document.querySelectorAll('.pay-method').forEach(function (b) {
      var on = b.getAttribute('data-pay-method') === m;
      b.setAttribute('aria-pressed', String(on));
      ACTIVE.forEach(function (c) { b.classList.toggle(c, on); });
      IDLE.forEach(function (c) { b.classList.toggle(c, !on); });
      b.querySelector('[data-pay-active]').hidden = !on;
      b.querySelector('[data-pay-idle]').hidden = on;
    });
    Object.keys(PANELS).forEach(function (k) { $(PANELS[k]).hidden = k !== m; $(STEPS[k]).hidden = k !== m; });
    if (m === 'qris' && (!deadline || Date.now() >= deadline)) startTimer();
    render();
  }

  /* ---------- nominal & tombol ---------- */
  function methodLabel(m) { m = m || method; return m === 'qris' ? 'QRIS' : m === 'cash' ? L('Kasir / Tunai', 'Cashier / Cash') : L('Transfer BRI', 'BRI Transfer'); }

  function proofMessage(tt) {
    var m = A.orderMessage({ method: 'QRIS', extra: orderExtra() });
    return L('Halo Tim Arunika Crumbs & Brew, saya sudah membayar via QRIS sebesar ' + A.money(tt.total) + '. Bukti pembayaran saya lampirkan di chat ini.',
             'Hello Arunika Crumbs & Brew team, I have paid ' + A.money(tt.total) + ' via QRIS. I am attaching my payment proof in this chat.') + '\n\n' + m;
  }
  function orderExtra() { return A.order ? [L('Jenis pesanan', 'Order type') + ': ' + A.order.label()] : []; }
  function currentMessage() {
    var tt = A.cart.totals();
    if (method === 'qris') return proofMessage(tt);
    return A.orderMessage({ method: methodLabel(), extra: orderExtra() });
  }

  function sig(m) {
    var o = A.order ? A.order.get() : { type: '', table: '' };
    return (m || method) + '|' + A.cart.get().map(function (l) { return l.id + ':' + l.qty; }).join(',') + '|' + o.type + '|' + o.table;
  }
  function render() {
    var ls = A.cart.get(), tt = A.cart.totals(), empty = !ls.length;
    confirmed = !!(receipt && receipt.sig === sig());
    document.querySelectorAll('[data-pay-total]').forEach(function (e) { e.textContent = A.money(tt.total); });
    $('pay-sub').textContent = A.money(tt.sub); $('pay-tax').textContent = A.money(tt.tax);
    $('pay-sub-label').textContent = L('Subtotal (' + A.cart.count() + ' Item)', 'Subtotal (' + A.cart.count() + ' item' + (A.cart.count() === 1 ? '' : 's') + ')');
    $('pay-empty').hidden = !empty;
    if (tt.total !== lastTotal) { lastTotal = tt.total; if (method === 'qris') startTimer(); }

    var confirmBtn = $('pay-confirm'), wa = $('pay-wa-link');
    var labels = {
      qris: [L('Simulasikan Pembayaran Berhasil', 'Simulate Successful Payment')],
      cash: [L('Konfirmasi Bayar di Kasir', 'Confirm payment at the cashier')],
      tf: [L('Saya Sudah Transfer', 'I Have Transferred')]
    };
    $('pay-confirm-label').textContent = confirmed ? L('Lihat Struk Pembelian', 'View Purchase Receipt') : labels[method][0];
    $('pay-wa-label').textContent = L('Butuh bantuan? Chat WhatsApp', 'Need help? Chat on WhatsApp');
    $('pay-note').textContent = method === 'qris' ? L('Mode demo: QRIS ini hanya ilustrasi dan tidak memproses uang sungguhan.', 'Demo mode: this QRIS is illustrative and does not process real money.')
      : method === 'cash' ? L('Bayar di kasir saat nomor pesananmu dipanggil.', 'Pay at the cashier when your order number is called.')
      : L('Mode demo: rekening ini fiktif dan tidak memproses uang sungguhan.', 'Demo mode: this account is fictional and does not process real money.');

    [confirmBtn, wa].forEach(function (el) {
      el.classList.toggle('opacity-50', empty); el.classList.toggle('pointer-events-none', empty);
      el.setAttribute('aria-disabled', String(empty));
    });
    confirmBtn.disabled = empty;
    if (empty) { wa.removeAttribute('href'); } else { wa.setAttribute('href', A.waUrl(currentMessage())); }
    $('proof-btn').disabled = false;
    if (!$('receipt-overlay').hidden) openReceipt(true);
  }

  /* ---------- timer ---------- */
  function startTimer() {
    deadline = Date.now() + TIMER_SECONDS * 1000; tick();
    clearInterval(timerId); timerId = setInterval(tick, 1000);
  }
  function tick() {
    var left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    $('pay-timer').textContent = p(Math.floor(left / 60)) + ':' + p(left % 60);
    if (!left) { clearInterval(timerId); $('pay-status').textContent = L('Batas waktu habis. Pilih ulang QRIS untuk memulai lagi.', 'Time is up. Re-select QRIS to restart.'); }
  }

  /* ---------- salin nominal ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) {
      try {
        var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.appendChild(ta); ta.select(); var done = document.execCommand('copy'); document.body.removeChild(ta); done ? ok() : fail();
      } catch (e) { fail(e); }
    });
  }
  $('pay-copy').addEventListener('click', function () {
    var tt = A.cart.totals(); if (!tt.total) { A.toast(L('Keranjang masih kosong.', 'Your cart is empty.'), 'info'); return; }
    copyText(String(tt.total)).then(function () { A.toast(L('Nominal tersalin: ', 'Amount copied: ') + A.money(tt.total)); },
      function () { A.toast(L('Gagal menyalin. Catat nominal: ', 'Copy failed. Amount: ') + A.money(tt.total), 'error'); });
  });

  function copyTo(text, okMsg, failMsg) {
    copyText(text).then(function () { A.toast(okMsg + text, 'content_copy'); }, function () { A.toast(failMsg + text, 'error'); });
  }
  $('tf-copy-acc').addEventListener('click', function () {
    var acc = $('tf-account').textContent.replace(/\D/g, '');
    copyText(acc).then(function () { A.toast(L('Nomor rekening tersalin: ', 'Account number copied: ') + $('tf-account').textContent, 'content_copy'); },
      function () { A.toast(L('Gagal menyalin. Catat nomor: ', 'Copy failed. Account: ') + $('tf-account').textContent, 'error'); });
  });
  $('tf-copy-amount').addEventListener('click', function () {
    var tt = A.cart.totals(); if (!tt.total) { A.toast(L('Keranjang masih kosong.', 'Your cart is empty.'), 'info'); return; }
    copyTo(String(tt.total), L('Nominal tersalin: ', 'Amount copied: '), L('Gagal menyalin. Nominal: ', 'Copy failed. Amount: '));
  });

  /* ---------- gambar QRIS resmi + unduh ---------- */
  var qrisImg = $('qris-img'), CANDIDATES = ['images/qris-arunika.svg', 'images/qris-arunika.png', 'images/qris-arunika.jpg', 'images/qris-arunika.jpeg', 'images/qris-arunika.webp'], ci = 0, qrisOk = true;
  qrisImg.addEventListener('error', function () {
    ci++;
    if (ci < CANDIDATES.length) { qrisImg.src = CANDIDATES[ci]; return; }
    qrisOk = false; qrisImg.hidden = true; $('qris-missing').hidden = false;
  });
  qrisImg.addEventListener('load', function () { qrisOk = true; });
  $('qris-download').addEventListener('click', function () {
    if (!qrisOk) { A.toast(L('Gambar QRIS belum tersedia di folder images.', 'QRIS image is not available in the images folder yet.'), 'error'); return; }
    var src = CANDIDATES[ci], ext = (src.match(/\.(\w+)$/) || [, 'png'])[1], name = 'QRIS-Arunika-Crumbs-Brew.' + ext;
    var save = function (href, revoke) {
      var a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      if (revoke) setTimeout(function () { URL.revokeObjectURL(href); }, 1500);
      A.toast(L('Kode QR diunduh.', 'QR code downloaded.'), 'download');
    };
    if (window.fetch && /^https?:/.test(location.protocol)) {
      fetch(src).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) { save(URL.createObjectURL(b), true); }).catch(function () { save(src, false); });
    } else save(src, false);          // dibuka langsung dari file: atribut download tetap bekerja
  });

  /* ---------- upload bukti bayar ---------- */
  function fmtSize(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function clearProof() {
    if (proofUrl) URL.revokeObjectURL(proofUrl);
    proofFile = null; proofUrl = ''; $('proof-input').value = ''; $('proof-box').hidden = true; $('proof-img').removeAttribute('src');
  }
  $('proof-btn').addEventListener('click', function () { $('proof-input').click(); });
  $('proof-input').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0], err = $('proof-error'); err.textContent = '';
    if (!f) return;
    if (!(OK_MIME.test(f.type) || (!f.type && OK_EXT.test(f.name))) || !OK_EXT.test(f.name)) {
      clearProof(); err.textContent = L('Format tidak didukung. Pilih file JPG, JPEG, PNG, atau WEBP.', 'Unsupported format. Choose a JPG, JPEG, PNG, or WEBP file.'); return;
    }
    if (f.size > MAX_BYTES) { clearProof(); err.textContent = L('Ukuran file terlalu besar (maks. 5 MB).', 'File is too large (max 5 MB).'); return; }
    if (proofUrl) URL.revokeObjectURL(proofUrl);
    proofFile = f; proofUrl = URL.createObjectURL(f);
    $('proof-img').src = proofUrl; $('proof-name').textContent = f.name; $('proof-size').textContent = fmtSize(f.size);
    $('proof-box').hidden = false; A.toast(L('Bukti bayar dipilih.', 'Payment proof selected.'), 'image');
  });
  $('proof-remove').addEventListener('click', function () { clearProof(); $('proof-error').textContent = ''; });

  /* ---------- aksi ---------- */
  $('pay-methods').addEventListener('click', function (e) { var b = e.target.closest('.pay-method'); if (b) setMethod(b.getAttribute('data-pay-method')); });
  $('pay-confirm').addEventListener('click', function () {
    if (!A.cart.count()) return;
    if (A.order && !A.order.valid()) {
      $('pay-status').textContent = L('Pilih jenis pesanan (Dine-in / Take away) dan nomor meja dulu sebelum membayar.', 'Choose an order type (Dine-in / Take away) and table number before paying.');
      var sm = $('order-summary-mount'); if (sm) sm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!(receipt && receipt.sig === sig())) receipt = makeReceipt();
    writeReceipt(receipt);
    render();
    $('pay-status').textContent = receipt.status === 'paid'
      ? L('Pembayaran demo berhasil! Pesanan berstatus LUNAS (DEMO). Tidak ada transaksi uang sungguhan.', 'Demo payment successful! Your order is marked PAID (DEMO). No real money was transferred.')
      : L('Tunjukkan struk ke kasir dan bayar ' + A.money(receipt.total) + '.', 'Show the receipt at the cashier and pay ' + A.money(receipt.total) + '.');
    openReceipt();
  });

  /* ---------- struk / bukti pembelian ---------- */
  var RKEY = 'arunika_receipt_v1';
  function readReceipt() { try { return JSON.parse(localStorage.getItem(RKEY) || 'null'); } catch (e) { return null; } }
  function writeReceipt(r) { try { localStorage.setItem(RKEY, JSON.stringify(r)); } catch (e) {} }
  function dropReceipt() { receipt = null; try { localStorage.removeItem(RKEY); } catch (e) {} }
  function makeReceipt() {
    var tt = A.cart.totals(), o = A.order ? A.order.get() : { type: '', table: '' }, d = new Date();
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return {
      no: 'ARN-' + String(d.getFullYear()).slice(2) + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + (1000 + Math.floor(Math.random() * 9000)),
      at: d.toISOString(), method: method, type: o.type, table: o.table,
      status: method === 'cash' ? 'pending' : 'paid',
      items: A.cart.get().map(function (l) { return { name: l.name, qty: l.qty, price: l.price, sum: l.sum }; }),
      sub: tt.sub, tax: tt.tax, total: tt.total, sig: sig()
    };
  }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(I.lang === 'en' ? 'en-GB' : 'id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) + ' WIB'; } catch (e) { return iso; }
  }
  function typeLabel(r) {
    return r.type === 'dinein' ? L('Dine-in · Meja ' + r.table, 'Dine-in · Table ' + r.table) : L('Take away · Ambil di outlet', 'Take away · Pick up at outlet');
  }
  function row(a, b, strong) {
    return '<div style="display:flex;justify-content:space-between;gap:12px;' + (strong ? 'font-weight:700;font-size:15px;' : '') + '"><span>' + a + '</span><span style="white-space:nowrap">' + b + '</span></div>';
  }
  function receiptHtml(r) {
    var e = A.esc, paid = r.status === 'paid', dash = '<div style="border-top:1px dashed #b9a99a;margin:12px 0"></div>';
    var hint = r.type === 'dinein' ? L('Pesananmu akan diantar ke meja ' + r.table + '.', 'Your order will be brought to table ' + r.table + '.') : L('Tunjukkan struk ini saat mengambil pesanan di outlet.', 'Show this receipt when picking up your order at the outlet.');
    if (!paid) hint = L('Tunjukkan struk ini ke kasir dan bayar ' + A.money(r.total) + '. ', 'Show this receipt to the cashier and pay ' + A.money(r.total) + '. ') + hint;
    return '<div class="receipt-sheet" style="background:#fff;color:#2b2118;border-radius:18px;box-shadow:0 24px 60px -12px rgba(0,0,0,.45);padding:24px 22px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.5">' +
      '<div style="text-align:center">' +
      '<div style="width:52px;height:52px;border-radius:50%;background:' + (paid ? '#536124' : '#A2662A') + ';color:#fff;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px"><span class="material-symbols-outlined" style="font-size:30px" aria-hidden="true">' + (paid ? 'check' : 'schedule') + '</span></div>' +
      '<h2 id="receipt-title" style="font-family:inherit;font-size:16px;font-weight:800;margin:0">' + e(paid ? L('Pembayaran Berhasil', 'Payment Successful') : L('Pesanan Berhasil Dibuat', 'Order Placed')) + '</h2>' +
      '<p style="margin:2px 0 0;color:#6b5848">' + e(L('Struk Pembelian', 'Purchase Receipt')) + '</p></div>' + dash +
      '<div style="text-align:center"><div style="font-weight:800;letter-spacing:.04em">ARUNIKA CRUMBS &amp; BREW</div><div style="color:#6b5848;font-size:11px">Ruko Promenade, Jl. Dr. Ir. H. Soekarno (MERR), Rungkut, Surabaya</div></div>' + dash +
      row(e(L('No. Struk', 'Receipt No.')), '<b>' + e(r.no) + '</b>') + row(e(L('Tanggal', 'Date')), e(fmtDate(r.at))) + row(e(L('Jenis Pesanan', 'Order Type')), e(typeLabel(r))) + dash +
      r.items.map(function (it) { return '<div style="margin-bottom:6px"><div>' + e(it.name) + '</div>' + row('&nbsp;&nbsp;' + it.qty + ' x ' + A.money(it.price), A.money(it.sum)) + '</div>'; }).join('') + dash +
      row(e(L('Subtotal', 'Subtotal')), A.money(r.sub)) + row('PB1 (10%)', A.money(r.tax)) + '<div style="height:4px"></div>' + row('TOTAL', A.money(r.total), true) + dash +
      row(e(L('Metode', 'Method')), e(methodLabel(r.method))) +
      row('Status', '<b style="color:' + (paid ? '#536124' : '#A2662A') + '">' + e(paid ? L('LUNAS (DEMO)', 'PAID (DEMO)') : L('BAYAR DI KASIR', 'PAY AT CASHIER')) + '</b>') + dash +
      '<p style="margin:0;text-align:center">' + e(hint) + '</p>' +
      '<p style="margin:8px 0 0;text-align:center;font-weight:700">' + e(L('Terima kasih sudah memesan di Arunika!', 'Thank you for ordering at Arunika!')) + '</p>' +
      '<p style="margin:6px 0 0;text-align:center;color:#8a7767;font-size:11px">' + e(L('Struk simulasi — tidak ada uang sungguhan yang diproses.', 'Simulated receipt — no real money was processed.')) + '</p></div>';
  }
  var BTN = 'width:100%;padding:12px 16px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;';
  function openReceipt(keepFocus) {
    if (!receipt) return;
    var ov = $('receipt-overlay'), e = A.esc;
    ov.innerHTML = '<div style="max-width:380px;margin:0 auto">' + receiptHtml(receipt) +
      '<div class="no-print" style="margin-top:14px;display:flex;flex-direction:column;gap:8px">' +
      '<button type="button" id="rc-print" style="' + BTN + 'background:#536124;color:#fff;border:0"><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">print</span>' + e(L('Cetak / Simpan PDF', 'Print / Save as PDF')) + '</button>' +
      '<button type="button" id="rc-done" style="' + BTN + 'background:#fff;color:#2b2118;border:1px solid #d8c9bb"><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">done_all</span>' + e(L('Selesai & Kembali ke Beranda', 'Done & Back to Home')) + '</button>' +
      '<button type="button" id="rc-close" style="' + BTN + 'background:transparent;color:#fff;border:0">' + e(L('Tutup', 'Close')) + '</button></div></div>';
    ov.hidden = false; document.body.style.overflow = 'hidden';
    if (!keepFocus) { var c = $('rc-print'); if (c) c.focus(); }
  }
  function closeReceipt() { $('receipt-overlay').hidden = true; document.body.style.overflow = ''; $('pay-confirm').focus(); }
  $('receipt-overlay').addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (b && b.id === 'rc-print') window.print();
    else if (b && b.id === 'rc-close') closeReceipt();
    else if (b && b.id === 'rc-done') { A.cart.clear(); if (A.order) A.order.clear(); dropReceipt(); document.body.style.overflow = ''; location.href = 'index.html'; }
    else if (ev.target === this) closeReceipt();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !$('receipt-overlay').hidden) closeReceipt(); });
  window.addEventListener('arunika:order', render);

  $('pay-wa-link').addEventListener('click', function (e) {
    if (!A.cart.count()) { e.preventDefault(); return; }
    // Di ponsel yang mendukung berbagi file, lampirkan bukti bayar langsung.
    if (method === 'qris' && proofFile && navigator.canShare && navigator.share && navigator.canShare({ files: [proofFile] })) {
      e.preventDefault();
      navigator.share({ files: [proofFile], text: currentMessage() }).catch(function (err) {
        if (err && err.name !== 'AbortError') window.open(A.waUrl(currentMessage()), '_blank', 'noopener');
      });
      return;
    }
    if (method === 'qris') return;
  });
  window.addEventListener('arunika:cart', render);
  window.addEventListener('arunika:lang', render);
  /* I18N.apply menimpa teks yang memuat nominal ({total}); render ulang setelahnya agar nominal & label tetap benar. */
  document.addEventListener('DOMContentLoaded', render);
  function syncTitle() { document.title = L('Pembayaran - Arunika Crumbs & Brew', 'Payment - Arunika Crumbs & Brew'); }
  window.addEventListener('arunika:lang', syncTitle); syncTitle();
  window.addEventListener('beforeunload', function () { if (proofUrl) URL.revokeObjectURL(proofUrl); });

  receipt = readReceipt();
  var startM = 'qris';
  if (receipt && receipt.method && PANELS[receipt.method]) { method = receipt.method; if (receipt.sig === sig()) startM = receipt.method; else dropReceipt(); } else if (receipt) dropReceipt();
  setMethod(startM);
})();
