/* Reservasi: nama, WhatsApp, tanggal (popover kalender), jam (popover roda 24 jam), tamu + pre-order menu + pratinjau & tautan WhatsApp. */
(function () {
  'use strict';
  var A = window.Arunika, I = window.I18N;
  if (!A || !document.getElementById('reservation-form')) return;
  var t = function (k, p) { return I.t(k, p); };
  var $ = function (id) { return document.getElementById(id); };
  var WA = A.WA || '6285175474311', OPEN = 8 * 60, CLOSE = 22 * 60, MAX_DAYS = 90;
  var WH = 40, touched = false, calView = null, wheelLock = 0;
  var S = { name: '', phone: '', date: '', time: '', guests: '' }, poCat = 'coffee', hm = { h: 8, m: 0 };

  /* ---- util tanggal/jam (waktu lokal, bukan UTC) ---- */
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var fromIso = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var plus = function (n) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
  var nowMin = function () { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  var isToday = function () { return S.date === iso(new Date()); };
  var sep = function () { return I.lang === 'en' ? ':' : '.'; };
  var fmt = function (hhmm) { return hhmm.replace(':', sep()); };            // 24 jam, satu format di mana pun
  var toMin = function (hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; };
  var loc = function () { return I.lang === 'en' ? 'en-GB' : 'id-ID'; };

  function timeProblem(hhmm) {
    var m = toMin(hhmm);
    if (m < OPEN || m >= CLOSE) return 'res.err_time_range';
    if (isToday() && m <= nowMin()) return 'res.err_time_past';
    return '';
  }

  /* ---- tanggal: kalender langsung tampil ---- */
  function renderCal() {
    var first = new Date(calView.getFullYear(), calView.getMonth(), 1), start = plus(0), end = plus(MAX_DAYS);
    $('cal-title').textContent = first.toLocaleDateString(loc(), { month: 'long', year: 'numeric' });
    var wd = ''; for (var k = 0; k < 7; k++) { var dd = new Date(2024, 0, 1 + k); wd += '<div class="cal-wd">' + dd.toLocaleDateString(loc(), { weekday: 'short' }) + '</div>'; }   // 1 Jan 2024 = Senin
    $('cal-weekdays').innerHTML = wd;
    var lead = (first.getDay() + 6) % 7, days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(), html = '', i;
    for (i = 0; i < lead; i++) html += '<span></span>';
    for (i = 1; i <= days; i++) {
      var d = new Date(first.getFullYear(), first.getMonth(), i), v = iso(d), off = d < start || d > end;
      html += '<button type="button" class="cal-day' + (v === iso(start) ? ' is-today' : '') + '" data-date="' + v + '" aria-pressed="' + (S.date === v) + '"' + (off ? ' disabled' : '') +
        ' aria-label="' + d.toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '">' + i + '</button>';
    }
    $('cal-days').innerHTML = html;
    $('cal-prev').disabled = first <= new Date(start.getFullYear(), start.getMonth(), 1);
    $('cal-next').disabled = new Date(first.getFullYear(), first.getMonth() + 1, 1) > end;
    $('date-picked').textContent = S.date ? t('res.picked_date', { d: dateLabel() }) : t('res.pick_date_hint');
    paintDateBtn();
  }
  function paintDateBtn() {
    var el = $('date-btn-text'); el.removeAttribute('data-i18n');
    el.textContent = S.date ? dateLabel() : t('res.date_ph'); el.classList.toggle('text-on-surface-variant', !S.date); el.classList.toggle('text-on-surface', !!S.date);
  }
  function paintTimeBtn() {
    var el = $('time-btn-text'); el.removeAttribute('data-i18n');
    el.textContent = touched ? fmt(readWheels()) + ' WIB' : t('res.time_ph'); el.classList.toggle('text-on-surface-variant', !touched); el.classList.toggle('text-on-surface', touched);
  }
  function setDate(v) {
    $('date-error').textContent = '';
    if (v && v < iso(plus(0))) { $('date-error').textContent = t('res.err_date_past'); v = ''; }
    S.date = v; if (v) calView = fromIso(v);
    renderCal(); revalidateTime(true); update(); if (v) closePop('date-pop');
  }

  /* ---- jam: roda ala alarm, 00-23 jam & 00-59 menit ---- */
  function buildWheel(id, n) {
    var h = ''; for (var i = 0; i < n; i++) h += '<div class="wheel-item" role="option" data-i="' + i + '">' + pad(i) + '</div>';
    $(id).innerHTML = h;
  }
  function wheelIdx(id, n) { return Math.max(0, Math.min(n - 1, Math.round($(id).scrollTop / WH))); }
  function paintWheel(id, n) {
    var idx = wheelIdx(id, n);
    $(id).querySelectorAll('.wheel-item').forEach(function (e, i) { e.classList.toggle('is-sel', i === idx); e.setAttribute('aria-selected', String(i === idx)); });
  }
  function setWheel(id, i, smooth) { wheelLock++; $(id).scrollTo({ top: i * WH, behavior: smooth ? 'smooth' : 'auto' }); setTimeout(function () { wheelLock = Math.max(0, wheelLock - 1); paintWheel(id, id === 'wheel-h' ? 24 : 60); }, smooth ? 350 : 30); }
  function readWheels() {
    if (!$('time-pop').hidden) hm = { h: wheelIdx('wheel-h', 24), m: wheelIdx('wheel-m', 60) };   // roda tersembunyi = scroll 0, jadi pakai nilai tersimpan
    return pad(hm.h) + ':' + pad(hm.m);
  }
  function applyWheels() {
    var v = readWheels(), p = timeProblem(v), er = $('time-error'); er.textContent = '';
    $('time-readout').textContent = t('res.time_chosen', { t: fmt(v) });
    if (p) { S.time = ''; er.textContent = t(p); } else S.time = v;
    paintTimeBtn(); update();
  }
  function onWheel(id, n) {
    var timer; $(id).addEventListener('scroll', function () {
      paintWheel(id, n); if (wheelLock) return;
      clearTimeout(timer); timer = setTimeout(function () { touched = true; applyWheels(); }, 120);
    });
    $(id).addEventListener('click', function (e) { var it = e.target.closest('.wheel-item'); if (it) { touched = true; setWheel(id, +it.getAttribute('data-i'), true); setTimeout(applyWheels, 380); } });
    $(id).addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return; e.preventDefault();
      var i = wheelIdx(id, n) + (e.key === 'ArrowDown' ? 1 : -1); i = (i + n) % n; touched = true; setWheel(id, i, true); setTimeout(applyWheels, 380);
    });
  }
  function renderTime() {
    var closedToday = isToday() && nowMin() >= CLOSE - 1;
    $('time-hint').textContent = closedToday ? t('res.closed_today') : '';
    $('time-readout').textContent = touched ? t('res.time_chosen', { t: fmt(readWheels()) }) : t('res.time_none');
    paintTimeBtn();
  }
  function revalidateTime() {
    if (!touched) { renderTime(); return; }
    var v = readWheels(), p = timeProblem(v); $('time-error').textContent = p ? t(p) : '';
    S.time = p ? '' : v; renderTime();
    $('time-readout').textContent = t('res.time_chosen', { t: fmt(v) });
  }

  /* ---- tamu: kolom angka bebas, minimal 1 ---- */
  function guestLabel(v) { return v === '1' ? t('res.g_1') : t('res.g_n', { n: v }); }
  function parseGuests(raw) {
    var s = String(raw).trim(); if (!s) return { empty: true };
    if (!/^\d+$/.test(s)) return { err: 'res.err_guests_format' };
    var n = parseInt(s, 10); if (n < 1) return { err: 'res.err_guests_min' };
    return { n: n };
  }
  function setGuests(raw, finalize) {
    var r = parseGuests(raw), err = $('guest-error'); err.textContent = '';
    if (r.empty) { S.guests = ''; }
    else if (r.err) { S.guests = ''; err.textContent = t(r.err); }
    else { S.guests = String(r.n); if (finalize) $('guest-input').value = S.guests; }
    update();
  }

  /* ---- nama & nomor WhatsApp ---- */
  function setName(raw, finalize) {
    var v = raw.replace(/\s+/g, ' ').trim(), er = $('name-error'); er.textContent = '';
    if (!v) S.name = '';
    else if (v.length < 2 || !/[A-Za-z\u00C0-\u024F]/.test(v)) { S.name = ''; if (finalize) er.textContent = t('res.err_name'); }
    else S.name = v;
    update();
  }
  function setPhone(raw, finalize) {
    var v = raw.replace(/[\s\-().]/g, ''), er = $('phone-error'); er.textContent = '';
    if (!v) S.phone = '';
    else if (/^(\+?62|0)8\d{7,12}$/.test(v)) S.phone = raw.trim();
    else { S.phone = ''; if (finalize) er.textContent = t('res.err_phone'); }
    update();
  }

  /* ---- popover tanggal & jam ---- */
  var POPS = { 'date-pop': 'date-btn', 'time-pop': 'time-btn' };
  function openPop(id) {
    Object.keys(POPS).forEach(function (k) { if (k !== id) closePop(k); });
    $(id).hidden = false; $(POPS[id]).setAttribute('aria-expanded', 'true');
    if (id === 'time-pop') { setWheel('wheel-h', hm.h, false); setWheel('wheel-m', hm.m, false); }
    if (id === 'date-pop') renderCal();
  }
  function closePop(id) { var p = $(id); if (!p || p.hidden) return; p.hidden = true; $(POPS[id]).setAttribute('aria-expanded', 'false'); }
  function togglePop(id) { if ($(id).hidden) openPop(id); else closePop(id); }

  /* ---- draft: data form tetap ada saat pindah halaman (menu pre-order sudah tersimpan di keranjang) ---- */
  var DRAFT_KEY = 'arunika_reservasi_draft_v1', DRAFT_TTL = 24 * 3600 * 1000, restoring = true;
  function saveDraft() {
    if (restoring) return;
    try {
      var d = { at: Date.now(), name: $('name-input').value, phone: $('phone-input').value, guests: $('guest-input').value, date: S.date, h: touched ? hm.h : null, m: touched ? hm.m : null };
      if (!d.name && !d.phone && !d.guests && !d.date && d.h === null) localStorage.removeItem(DRAFT_KEY); else localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) {}
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} restoring = true; }   // setelah terkirim, berhenti menyimpan
  function restoreDraft() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) {}
    if (d && (!d.at || Date.now() - d.at > DRAFT_TTL)) { clearDraft(); d = null; }
    if (d) {
      if (d.name) { $('name-input').value = d.name; setName(d.name, true); }
      if (d.phone) { $('phone-input').value = d.phone; setPhone(d.phone, true); }
      if (d.guests) { $('guest-input').value = d.guests; setGuests(d.guests, true); }
      if (d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && d.date >= iso(plus(0)) && d.date <= iso(plus(MAX_DAYS))) setDate(d.date);
      if (typeof d.h === 'number' && typeof d.m === 'number' && d.h >= 0 && d.h < 24 && d.m >= 0 && d.m < 60) { hm = { h: d.h, m: d.m }; touched = true; applyWheels(); }
    }
    restoring = false; saveDraft();
  }

  /* ---- pesan WhatsApp ---- */
  function dateLabel() {
    if (!S.date) return t('wa.unset');
    var d = fromIso(S.date), off = Math.round((d - plus(0)) / 864e5), rel = off === 0 ? t('res.today') : off === 1 ? t('res.tomorrow') : off === 2 ? t('res.dayafter') : '';
    var full = d.toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return rel ? rel + ', ' + full : full;
  }
  function buildMessage() {
    var out = [t('wa.hello'),
      '• ' + t('wa.name') + ': ' + (S.name || t('wa.unset')),
      '• ' + t('wa.phone') + ': ' + (S.phone || t('wa.unset')),
      '• ' + t('wa.date') + ': ' + dateLabel(),
      '• ' + t('wa.time') + ': ' + (S.time ? fmt(S.time) + ' WIB' : t('wa.unset')),
      '• ' + t('wa.guests') + ': ' + (S.guests ? guestLabel(S.guests) : t('wa.unset'))];
    var ls = A.cart.get();
    if (ls.length) {
      out.push('', t('wa.menu_title'));
      ls.forEach(function (l) { out.push('• ' + l.qty + 'x ' + l.name + ' — ' + A.money(l.sum)); });
      out.push(t('wa.total') + ': ' + A.money(A.cart.total()) + ' ' + t('wa.tax_note'));
    }
    out.push('', t('wa.closing'));
    return out.join('\n');
  }
  function update() {
    var msg = buildMessage(), ok = !!(S.name && S.phone && S.date && S.time && S.guests), a = $('btn-submit-whatsapp');
    $('wa-preview-text').textContent = msg;
    saveDraft();
    var d = new Date(); $('wa-time').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (ok) { a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg); a.removeAttribute('aria-disabled'); a.removeAttribute('tabindex'); }
    else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.setAttribute('tabindex', '-1'); }
    var miss = []; if (!S.name) miss.push(t('res.need_name')); if (!S.phone) miss.push(t('res.need_phone')); if (!S.date) miss.push(t('res.need_date')); if (!S.time) miss.push(t('res.need_time')); if (!S.guests) miss.push(t('res.need_guests'));
    $('wa-hint').textContent = ok ? t('res.ready') : t('res.need', { list: miss.join(', ') });
    window.dispatchEvent(new CustomEvent('arunika:wa-context'));
  }
  window.ArunikaReservasi = { message: function () { return S.name && S.phone && S.date && S.time && S.guests ? buildMessage() : ''; } };

  /* ---- pre-order ---- */
  function poCats() { return A.menu.categories.filter(function (c) { return c.preorder; }); }
  function renderPoTabs() {
    $('po-tabs').innerHTML = poCats().map(function (c) {
      var sel = c.id === poCat;
      return '<button type="button" role="tab" id="po-tab-' + c.id + '" aria-selected="' + sel + '" aria-controls="po-list" tabindex="' + (sel ? 0 : -1) + '" data-po-cat="' + c.id + '" class="tab-btn whitespace-nowrap px-4 py-2 rounded-full bg-surface-container text-on-surface-variant font-label-md text-sm hover:bg-surface-variant transition-colors">' + A.esc(A.catLabel(c)) + '</button>';
    }).join('');
  }
  function renderPoList() {
    var list = $('po-list'); list.setAttribute('aria-labelledby', 'po-tab-' + poCat);
    list.innerHTML = A.menu.items.filter(function (i) { return i.cat === poCat; }).map(function (it) {
      return '<li class="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-surface-variant/40">' +
        '<img alt="" class="w-12 h-12 rounded-lg object-cover shrink-0 bg-surface-container" loading="lazy" src="' + A.esc(it.img) + '"/>' +
        '<div class="min-w-0 flex-1"><p class="font-label-lg text-sm font-semibold text-secondary truncate">' + A.esc(it.name) + '</p><p class="text-xs text-on-surface-variant tabular-nums">' + A.money(it.price) + '</p></div>' +
        '<div class="flex items-center gap-1.5" role="group" aria-label="' + A.esc(it.name) + '">' +
        '<button type="button" class="qty-btn" data-po-dec="' + it.id + '" aria-label="' + A.esc(t('cart.dec', { name: it.name })) + '">−</button>' +
        '<span class="min-w-[1.5rem] text-center text-sm font-semibold text-secondary tabular-nums" data-po-qty="' + it.id + '" aria-live="polite">0</span>' +
        '<button type="button" class="qty-btn" data-po-inc="' + it.id + '" aria-label="' + A.esc(t('cart.inc', { name: it.name })) + '">+</button></div></li>';
    }).join('');
    syncPo();
  }
  function syncPo() {
    document.querySelectorAll('[data-po-qty]').forEach(function (e) {
      var q = A.cart.qty(e.getAttribute('data-po-qty')); e.textContent = q;
      var dec = document.querySelector('[data-po-dec="' + e.getAttribute('data-po-qty') + '"]'); if (dec) dec.disabled = q === 0;
    });
    var n = A.cart.count();
    $('po-summary').textContent = n ? t('res.po_summary', { n: n, total: A.money(A.cart.total()) }) : t('res.po_empty');
    $('po-clear').hidden = !n;
  }

  /* ---- event ---- */
  $('date-btn').addEventListener('click', function () { togglePop('date-pop'); });
  $('time-btn').addEventListener('click', function () { togglePop('time-pop'); });
  $('time-done').addEventListener('click', function () { touched = true; applyWheels(); closePop('time-pop'); $('time-btn').focus(); });
  document.addEventListener('click', function (e) { Object.keys(POPS).forEach(function (k) { if (!$(k).hidden && !e.target.closest('#' + k) && !e.target.closest('#' + POPS[k])) closePop(k); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') Object.keys(POPS).forEach(function (k) { if (!$(k).hidden) { closePop(k); $(POPS[k]).focus(); } }); });
  var ni = $('name-input'), pi = $('phone-input');
  ni.addEventListener('input', function () { setName(ni.value, false); }); ni.addEventListener('blur', function () { setName(ni.value, true); });
  pi.addEventListener('keydown', function (e) { if (e.key.length === 1 && !/[0-9+\-\s().]/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); });
  pi.addEventListener('input', function () { setPhone(pi.value, false); }); pi.addEventListener('blur', function () { setPhone(pi.value, true); });
  $('cal-days').addEventListener('click', function (e) { var b = e.target.closest('.cal-day'); if (b && !b.disabled) setDate(b.getAttribute('data-date')); });
  $('cal-prev').addEventListener('click', function () { calView = new Date(calView.getFullYear(), calView.getMonth() - 1, 1); renderCal(); });
  $('cal-next').addEventListener('click', function () { calView = new Date(calView.getFullYear(), calView.getMonth() + 1, 1); renderCal(); });
  onWheel('wheel-h', 24); onWheel('wheel-m', 60);
  var gi = $('guest-input');
  gi.addEventListener('keydown', function (e) { if (/^[eE+\-.,]$/.test(e.key)) e.preventDefault(); if (e.key === 'Enter') { e.preventDefault(); gi.blur(); } });
  gi.addEventListener('input', function () { setGuests(gi.value, false); });
  gi.addEventListener('blur', function () { setGuests(gi.value, true); });
  $('po-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-po-cat]'); if (b) { poCat = b.getAttribute('data-po-cat'); renderPoTabs(); renderPoList(); $('po-tab-' + poCat).focus(); } });
  $('po-tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var cs = poCats(), i = cs.findIndex(function (c) { return c.id === poCat; });
    poCat = cs[(i + (e.key === 'ArrowRight' ? 1 : cs.length - 1)) % cs.length].id; renderPoTabs(); renderPoList(); $('po-tab-' + poCat).focus();
  });
  $('po-list').addEventListener('click', function (e) {
    var i = e.target.closest('[data-po-inc]'), d = e.target.closest('[data-po-dec]');
    if (i) A.cart.add(i.getAttribute('data-po-inc')); else if (d) A.cart.dec(d.getAttribute('data-po-dec'));
  });
  $('po-clear').addEventListener('click', function () { A.cart.clear(); A.toast(t('toast.cleared'), 'delete'); });
  $('btn-submit-whatsapp').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; } clearDraft(); });
  window.addEventListener('arunika:cart', function () { syncPo(); update(); });
  window.addEventListener('arunika:lang', function () { renderCal(); renderTime(); paintDateBtn(); paintTimeBtn(); if (touched) $('time-readout').textContent = t('res.time_chosen', { t: fmt(readWheels()) }); renderPoTabs(); renderPoList(); if (S.guests) $('guest-error').textContent = ''; update(); });
  setInterval(function () { revalidateTime(false); update(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { revalidateTime(false); update(); } });
  $('reservation-form').addEventListener('submit', function (e) { e.preventDefault(); });

  calView = plus(0); calView.setDate(1);
  buildWheel('wheel-h', 24); buildWheel('wheel-m', 60);
  renderCal(); renderTime(); renderPoTabs(); renderPoList(); update();
  restoreDraft();
})();
