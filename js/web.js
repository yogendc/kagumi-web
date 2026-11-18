/* KAGUMI Transport — website perusahaan (Beranda, Tentang Kami, Produk & Layanan, Hubungi Kami, Cek Resi).
   Isi halaman diambil dari Apps Script yang sama dengan aplikasi internal (aksi publik getPublicProfile),
   dikelola Super Admin lewat menu "Kelola Website". Aksi publik lain: lacakResi & kirimPertanyaan. */
(function () {
  'use strict';
  var CFG = window.KAGUMI_WEB || {};
  var GAS_URL = String(CFG.GAS_URL || '').trim();
  var DEF = {
 "heroJudul": "Mitra logistik untuk barang, armada, dan kendaraan Anda.",
 "heroTeks": "Kami melayani jasa pengiriman barang, sewa truk beserta pengemudi, serta pengiriman mobil dan alat berat antarkota. Setiap kiriman memiliki surat jalan atau resi bernomor yang bisa Anda lacak sendiri.",
 "profilSingkat": "KAGUMI Cargo & Auto Logistics adalah perusahaan jasa transportasi dan logistik yang melayani pelanggan perorangan maupun perusahaan. Kami mengutamakan ketepatan waktu, keamanan muatan, dan administrasi yang tertib, mulai dari pemesanan sampai tagihan.",
 "visi": "Menjadi perusahaan transportasi dan logistik yang dipercaya pelanggan karena tepat waktu, aman, dan transparan.",
 "misi": [
  "Menyediakan armada yang terawat dan pengemudi yang berpengalaman.",
  "Memberikan informasi status kiriman yang jelas dan mudah diakses pelanggan.",
  "Menjaga administrasi yang tertib: surat jalan, tanda terima, dan invoice yang akurat.",
  "Membangun kemitraan jangka panjang dengan pelanggan dan rekanan ekspedisi."
 ],
 "bidangUsaha": [
  "Jasa pengiriman barang",
  "Transportasi dan trucking",
  "Pengiriman mobil dan alat berat"
 ],
 "keunggulan": [
  {
   "judul": "Dokumen resmi & bernomor",
   "teks": "Surat jalan, resi, dan invoice tercetak rapi dengan tanda tangan petugas ber-QR."
  },
  {
   "judul": "Status bisa dilacak",
   "teks": "Pelanggan dapat mengecek status kiriman kapan saja lewat website ini."
  },
  {
   "judul": "Armada lengkap",
   "teks": "Pickup, engkel, CDD, fuso, tronton, hingga car carrier untuk berbagai kebutuhan muatan."
  },
  {
   "judul": "Pembayaran fleksibel",
   "teks": "Lunas, termin, atau invoice surat kembali untuk pelanggan tetap."
  }
 ],
 "sejarah": "KAGUMI Cargo & Auto Logistics berawal dari usaha sewa truk untuk kebutuhan muatan lokal. Seiring bertambahnya kepercayaan pelanggan, layanan kami berkembang ke pengiriman mobil antarkota dan pengiriman paket melalui jalur darat, laut, dan kereta.\n\nHingga kini kami terus menambah armada, memperluas jaringan rekanan ekspedisi, dan membenahi sistem administrasi agar setiap kiriman tercatat dan dapat dipantau.",
 "profil": "KAGUMI Cargo & Auto Logistics bergerak di bidang jasa transportasi darat dan logistik. Kami melayani pengiriman barang per koli maupun muatan penuh, sewa truk beserta pengemudi, serta pengiriman mobil dan alat berat.\n\nSetiap order dikelola dengan sistem administrasi terpadu: surat jalan bernomor, inspeksi kendaraan sebelum berangkat, tanda terima saat barang diserahkan, dan invoice yang tercatat rapi.",
 "legalitas": [
  {
   "nama": "Akta Pendirian Perusahaan",
   "nomor": ""
  },
  {
   "nama": "SK Kemenkumham",
   "nomor": ""
  },
  {
   "nama": "Nomor Induk Berusaha (NIB)",
   "nomor": ""
  },
  {
   "nama": "NPWP Perusahaan",
   "nomor": ""
  }
 ],
 "layanan": [
  {
   "kunci": "barang",
   "judul": "Jasa pengiriman barang",
   "teks": "Pengiriman barang per koli atau partai besar ke berbagai kota melalui jalur darat, laut, dan kereta. Ongkos dihitung dari berat (kg) atau volume (m³) sesuai kota tujuan.",
   "poin": [
    "Resi bernomor dengan rincian koli",
    "Ongkos bisa ditanggung pengirim atau penerima",
    "Status kiriman bisa dilacak online"
   ]
  },
  {
   "kunci": "trucking",
   "judul": "Transportasi dan trucking",
   "teks": "Sewa truk beserta pengemudi untuk muatan proyek, pabrik, distribusi, maupun pindahan. Tersedia pickup, engkel, CDD, fuso, dan tronton, bak terbuka maupun box.",
   "poin": [
    "Surat jalan bernomor dan segel muatan",
    "PIC muat dan bongkar tercatat",
    "Termin pembayaran untuk pelanggan tetap"
   ]
  },
  {
   "kunci": "mobil",
   "judul": "Pengiriman mobil dan alat berat",
   "teks": "Pengiriman mobil dan alat berat antarkota dengan car carrier, towing, atau trailer. Pilihan layanan door to door, door to port, dan port to port.",
   "poin": [
    "Inspeksi kondisi dan foto sebelum berangkat",
    "Tanda terima saat unit diserahkan",
    "Status unit bisa dilacak online"
   ]
  }
 ],
 "kontak": {
  "wa": "",
  "jamKerja": "Senin – Sabtu, 08.00 – 17.00 WIB",
  "maps": ""
 }
};
  var PAGE = document.body.getAttribute('data-page');
  if (PAGE === 'portofolio') { location.replace('galeri.html' + location.hash); return; } // alamat lama
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* mode privat */ } }
  };
  var ICON_LAY = { barang: 'i-box', trucking: 'i-truck', mobil: 'i-car' };

  // ── API (POST text/plain → tanpa preflight CORS) ──
  function api(action, args, timeoutMs) {
    if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(GAS_URL) && !/^http:\/\/localhost/.test(GAS_URL)) {
      return Promise.reject(new Error('Alamat server belum diatur.'));
    }
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, timeoutMs || 30000);
    return fetch(GAS_URL, {
      method: 'POST', redirect: 'follow', signal: ctrl ? ctrl.signal : undefined,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, args: args || [] })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (res) {
      clearTimeout(t);
      if (!res || typeof res.success !== 'boolean') throw new Error('Jawaban server tidak dikenali.');
      return res;
    }, function (e) {
      clearTimeout(t);
      var err = new Error('Tidak dapat terhubung ke server. Periksa koneksi internet, lalu coba lagi.');
      err.jaringan = true; err.asli = e;
      throw err;
    });
  }

  // ── Data profil & isi ──
  var P = store.get('kgmWeb2') || {};
  function W() { return P.web || DEF; }
  // Website selalu memakai nama merek (Nama aplikasi di Pengaturan). Nama badan usaha (PT) hanya untuk kop surat.
  function nama() { return P.appName || 'KAGUMI Cargo & Auto Logistics'; }
  function nomorWA() {
    var raw = String((W().kontak || {}).wa || CFG.WA || '').replace(/\D/g, '');
    if (!raw) {
      // Telepon kantor dipakai hanya bila nomor seluler (08… / 628…); telepon rumah tidak bisa WhatsApp.
      raw = String(P.companyPhone || '').replace(/\D/g, '');
      if (!/^(08|628)/.test(raw)) return '';
    }
    if (raw.indexOf('62') === 0) return raw;
    if (raw.charAt(0) === '0') return '62' + raw.slice(1);
    return raw;
  }
  function waTampil(n) { return n ? '+' + n.slice(0, 2) + ' ' + n.slice(2).replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3') : ''; }
  function teksWA(jenis, extra) {
    var n = nama();
    if (jenis === 'penawaran') return 'Halo ' + n + ', saya ingin meminta penawaran pengiriman. Rute: … Jenis muatan: … Jadwal: …';
    if (jenis === 'resi') return 'Halo ' + n + ', saya ingin menanyakan status kiriman dengan nomor resi/surat jalan: …';
    if (jenis === 'layanan') return 'Halo ' + n + ', saya tertarik dengan layanan ' + extra + '. Mohon info lebih lanjut.';
    return 'Halo ' + n + ', saya ingin bertanya tentang layanan Anda.';
  }
  function linkWA(jenis, extra) { var n = nomorWA(); return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(teksWA(jenis, extra)) : ''; }
  function paragraf(s) {
    return String(s || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function tglPanjang(s) {
    var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? (+m[3]) + ' ' + BULAN_P[+m[2] - 1] + ' ' + m[1] : esc(s);
  }
  var BULAN_P = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function mapsQuery() { return String((W().kontak || {}).maps || P.companyAddress || '').trim(); }

  // Penyaji isi per penanda data-w
  var R = {
    heroJudul: function (w) { return esc(w.heroJudul); },
    heroTeks: function (w) { return esc(w.heroTeks); },
    visi: function (w) { return esc(w.visi); },
    profilSingkat: function (w) { return paragraf(w.profilSingkat); },
    sejarah: function (w) { return paragraf(w.sejarah); },
    profil: function (w) { return paragraf(w.profil); },
    misi: function (w) { return w.misi.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join(''); },
    bidangUsaha: function (w) { return w.bidangUsaha.map(function (b) { return '<li><svg><use href="#i-check"/></svg><span>' + esc(b) + '</span></li>'; }).join(''); },
    bidangUsahaDot: function (w) { return esc(w.bidangUsaha.join(' · ')); },
    bidangUsahaInline: function (w) { return esc(w.bidangUsaha.join(', ')) + '.'; },
    keunggulan: function (w) {
      var ic = ['i-doc', 'i-clock', 'i-truck', 'i-star', 'i-shield', 'i-target', 'i-flag', 'i-check'];
      return w.keunggulan.map(function (k, i) {
        return '<div class="why-item"><span><svg><use href="#' + ic[i % ic.length] + '"/></svg></span><div><h3>' + esc(k.judul) + '</h3><p>' + esc(k.teks) + '</p></div></div>';
      }).join('');
    },
    layananRingkas: function (w) {
      return w.layanan.map(function (l) {
        return '<a class="svc" href="layanan.html#' + esc(l.kunci) + '"><div class="svc-photo" data-foto-img="' + esc(l.kunci) + '" hidden></div><span class="svc-ico"><svg><use href="#' + ICON_LAY[l.kunci] + '"/></svg></span><h3>' + esc(l.judul) +
          '</h3><p>' + esc(l.teks) + '</p><span class="link-arrow">Selengkapnya<svg><use href="#i-arrow"/></svg></span></a>';
      }).join('');
    },
    layananNav: function (w) { return w.layanan.map(function (l) { return '<a href="#' + esc(l.kunci) + '">' + esc(l.judul) + '</a>'; }).join(''); },
    layananDetail: function (w) {
      return w.layanan.map(function (l, i) {
        var wa = linkWA('layanan', l.judul);
        return '<section class="sec' + (i % 2 ? ' sec-alt' : '') + '" id="' + esc(l.kunci) + '"><div class="wrap svc-detail">' +
          '<div class="svc-art" data-foto-img="' + esc(l.kunci) + '"><svg><use href="#' + ICON_LAY[l.kunci] + '"/></svg><span>0' + (i + 1) + '</span></div>' +
          '<div><h2>' + esc(l.judul) + '</h2><div class="prose">' + paragraf(l.teks) + '</div>' +
          (l.poin.length ? '<ul class="biz-list">' + l.poin.map(function (p) { return '<li><svg><use href="#i-check"/></svg><span>' + esc(p) + '</span></li>'; }).join('') + '</ul>' : '') +
          '<div class="hero-cta">' + (wa ? '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + esc(wa) + '"><svg><use href="#i-wa"/></svg><span>Tanya via WhatsApp</span></a>' : '') +
          '<a class="btn btn-ghost" href="kontak.html?layanan=' + encodeURIComponent(l.judul) + '#qForm">Kirim pertanyaan</a></div></div></div></section>';
      }).join('');
    },
    layananOpsi: function (w, el) {
      var pilih = el.value || decodeURIComponent((location.search.match(/[?&]layanan=([^&]+)/) || [])[1] || '');
      return '<option value="">Pilih layanan…</option>' + w.layanan.map(function (l) { return l.judul; }).concat(['Lainnya'])
        .map(function (j) { return '<option' + (j === pilih ? ' selected' : '') + '>' + esc(j) + '</option>'; }).join('');
    },
    legalitas: function (w) {
      var ada = w.legalitas.filter(function (l) { return l.nomor; });
      if (!ada.length) return '<p class="muted">Dokumen legalitas perusahaan dapat diminta melalui <a href="kontak.html">kontak kami</a>.</p>';
      return '<ul class="legal">' + ada.map(function (l) {
        return '<li><svg><use href="#i-doc"/></svg><div><b>' + esc(l.nama) + '</b><span>' + esc(l.nomor) + '</span></div></li>';
      }).join('') + '</ul>';
    },
    fakta: function (w) {
      var f = [['Bidang usaha', w.bidangUsaha.join(', ')], ['Kantor', P.companyAddress], ['Jam kerja', (w.kontak || {}).jamKerja]];
      return f.filter(function (x) { return x[1]; }).map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
    },
    portoFilter: function () {
      var list = P.portofolio || [], kat = [];
      list.forEach(function (x) { if (x.kategori && kat.indexOf(x.kategori) < 0) kat.push(x.kategori); });
      if (kat.length < 2) return '';
      return [''].concat(kat).map(function (k) {
        var n = k ? list.filter(function (x) { return x.kategori === k; }).length : list.length;
        return '<a href="#" role="button" data-pk="' + esc(k) + '"' + (portoKat === k ? ' aria-current="true"' : '') + '>' + (k ? esc(k) : 'Semua') + ' <span class="porto-n">' + n + '</span></a>';
      }).join('');
    },
    portoGrid: function () {
      var list = (P.portofolio || []).filter(function (x) { return !portoKat || x.kategori === portoKat; });
      if (!(P.portofolio || []).length) return '<div class="porto-empty"><svg><use href="#i-truck"/></svg><h3>Galeri segera hadir</h3><p class="muted">Dokumentasi pekerjaan kami sedang disiapkan. Sementara itu, lihat <a href="layanan.html">layanan kami</a> atau <a href="kontak.html">hubungi tim kami</a>.</p></div>';
      return list.map(kartuPorto).join('');
    },
    portoBeranda: function () {
      var list = (P.portofolio || []).slice(0, 6);
      var sec = $('[data-section="porto"]'); if (sec) sec.hidden = !list.length;
      return list.map(kartuPorto).join('');
    },
    berita: function () {
      var list = P.berita || [];
      var sec = $('[data-section="berita"]'); if (sec) sec.hidden = !list.length;
      var more = $('#newsMore'); if (more) more.hidden = list.length <= 3 || newsAll;
      return list.map(function (b, i) {
        return '<button type="button" class="news' + (i >= 3 && !newsAll ? ' is-extra' : '') + '" data-news="' + i + '"><time>' + tglPanjang(b.tanggal) + '</time><h3>' + esc(b.judul) +
          '</h3><p>' + esc(String(b.isi).slice(0, 160)) + (String(b.isi).length > 160 ? '…' : '') + '</p><span class="link-arrow">Baca<svg><use href="#i-arrow"/></svg></span></button>';
      }).join('');
    }
  };
  var newsAll = false, portoKat = '';
  function kartuPorto(x) {
    var meta = [x.lokasi, tglPanjang(x.tanggal)].filter(String).join(' · ');
    var tag = PAGE === 'galeri' ? 'button type="button" data-porto-open="' + esc(x.id) + '"' : 'a href="galeri.html#p-' + esc(x.id) + '"';
    return '<' + tag + ' class="porto-card" id="p-' + esc(x.id) + '"><span class="porto-ph" data-porto-img="' + esc(x.id) + '"></span><span class="porto-body"><span class="porto-kat">' + esc(x.kategori || 'Galeri') + '</span><b>' + esc(x.judul) + '</b>' +
      (meta ? '<small>' + meta + '</small>' : '') + '</span></' + (PAGE === 'galeri' ? 'button' : 'a') + '>';
  }
  // Foto portofolio: tautan gambar Google Drive bila publik; bila gagal, lewat server (getPortoFoto)
  var PORTO_SIAP = {};
  function fotoPorto(x, cb) {
    var key = x.id + ':' + x.v;
    if (PORTO_SIAP[key]) { cb(PORTO_SIAP[key]); return; }
    var lewatServer = function () {
      api('getPortoFoto', [x.id], 30000).then(function (r) { if (r.success) { PORTO_SIAP[key] = r.data; cb(r.data); } }).catch(function () { /* tanpa foto */ });
    };
    if (!x.url) { lewatServer(); return; }
    var img = new Image();
    img.onload = function () { PORTO_SIAP[key] = x.url; cb(x.url); };
    img.onerror = lewatServer;
    img.src = x.url;
  }
  function terapkanPorto() {
    $$('[data-porto-img]').forEach(function (el) {
      if (el.firstChild) return;
      var x = (P.portofolio || []).filter(function (p) { return p.id === el.getAttribute('data-porto-img'); })[0];
      if (!x) return;
      fotoPorto(x, function (src) { if (!el.firstChild) el.innerHTML = '<img alt="' + esc(x.judul) + '" loading="lazy" src="' + esc(src) + '">'; });
    });
  }
  function bukaPorto(id) {
    var x = (P.portofolio || []).filter(function (p) { return p.id === id; })[0], d = $('#portoDlg');
    if (!x || !d) return;
    $('#portoDlgKat').textContent = x.kategori || 'Galeri';
    $('#portoDlgTitle').textContent = x.judul;
    $('#portoDlgMeta').innerHTML = [esc(x.lokasi), tglPanjang(x.tanggal)].filter(String).join(' · ');
    $('#portoDlgBody').innerHTML = x.deskripsi ? paragraf(x.deskripsi) : '';
    var box = $('#portoDlgImg'); box.innerHTML = '';
    fotoPorto(x, function (src) { box.innerHTML = '<img alt="' + esc(x.judul) + '" src="' + esc(src) + '">'; });
    if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
  }

  function terapkan() {
    var w = W();
    var n = nama();
    $$('[data-p="companyName"]').forEach(function (el) { el.textContent = n; });
    // Judul tab memakai nama merek (Nama aplikasi di Pengaturan), bukan nama badan usaha
    var merek = P.appName || n;
    var judul = document.title.replace(/KAGUMI Cargo & Auto Logistics|KAGUMI Transport/g, merek);
    if (judul !== document.title) document.title = judul;
    var wa = nomorWA();
    var nilai = { companyAddress: P.companyAddress, companyPhone: P.companyPhone, companyEmail: P.companyEmail, waTampil: waTampil(wa), jamKerja: (w.kontak || {}).jamKerja };
    Object.keys(nilai).forEach(function (k) {
      $$('[data-p="' + k + '"]').forEach(function (el) { el.textContent = nilai[k] || ''; });
    });
    var ada = { companyAddress: !!P.companyAddress, companyPhone: !!P.companyPhone, companyEmail: !!P.companyEmail, wa: !!wa, jamKerja: !!nilai.jamKerja };
    $$('[data-row]').forEach(function (el) { el.hidden = !ada[el.getAttribute('data-row')]; });
    $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + String(P.companyPhone || '').replace(/[^\d+]/g, ''); });
    $$('[data-mail]').forEach(function (a) { a.href = 'mailto:' + (P.companyEmail || ''); });
    $$('[data-wa]').forEach(function (a) {
      var href = linkWA(a.getAttribute('data-wa-text') || 'umum');
      if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; }
      else if (!a.classList.contains('btn') && !a.classList.contains('wa-float')) { a.href = 'kontak.html'; a.removeAttribute('target'); }
      if (a.hasAttribute('hidden') || a.classList.contains('btn') || a.classList.contains('wa-float')) a.hidden = !href;
    });
    if (/^#[0-9a-f]{6}$/i.test(P.themeColor || '')) {
      var r = document.documentElement.style;
      r.setProperty('--primary', P.themeColor);
      r.setProperty('--primary-ink', 'color-mix(in srgb, ' + P.themeColor + ' 78%, #000)');
      r.setProperty('--primary-soft', 'color-mix(in srgb, ' + P.themeColor + ' 10%, #fff)');
      var m = $('meta[name="theme-color"]'); if (m) m.content = P.themeColor;
    }
    // Logo: logo khusus website (Kelola Website) → bila kosong, logo aplikasi (Pengaturan → Branding)
    // Urutan: logo khusus website → logo dokumen (melebar) dari Pengaturan → logo kecil aplikasi
    var lw = w.logo || {}, dok = /^data:image\//.test(P.logoDok || '') ? P.logoDok : '';
    if (!lw.data && dok) lw = { data: dok, nama: false };
    var logo = /^data:image\//.test(lw.data || '') ? lw.data : (/^data:image\/|^https:\/\//.test(P.logo || '') ? P.logo : '');
    $$('[data-logo]').forEach(function (el) {
      if (!logo) return;
      el.innerHTML = '<img alt="' + esc(n) + '" src="' + esc(logo) + '">';
      el.classList.add('has-img');
      el.classList.toggle('is-wide', !!lw.data);
    });
    $$('.brand').forEach(function (b) { b.classList.toggle('no-name', !!(logo && lw.data && lw.nama === false)); });
    // Tagline di bawah logo besar (Pengaturan → Branding)
    $$('[data-logo]').forEach(function (el) {
      var t = el.parentNode.querySelector('.brand-tagline');
      var tampil = !!(P.taglineLogo && el.classList.contains('is-wide'));
      if (tampil && !t) { t = document.createElement('span'); t.className = 'brand-tagline'; el.insertAdjacentElement('afterend', t); }
      if (t) { t.hidden = !tampil; t.textContent = P.taglineLogo || ''; }
      el.parentNode.classList.toggle('has-tagline', tampil);
    });
    // Ikon tab: utamakan logo persegi aplikasi (logo website biasanya melebar)
    var ikon = /^data:image\/|^https:\/\//.test(P.logo || '') ? P.logo : logo;
    if (ikon) {
      document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(function (l) { l.href = ikon; });
      try { localStorage.setItem('kgmWebIkon', ikon.length < 120000 ? ikon : ''); } catch (e) { /* abaikan */ }
    }
    $$('[data-w]').forEach(function (el) {
      var f = R[el.getAttribute('data-w')];
      if (f) el.innerHTML = f(w, el);
    });
    var q = mapsQuery();
    $$('[data-map]').forEach(function (el) {
      if (!q) { el.hidden = true; return; }
      el.hidden = false;
      var src = 'https://maps.google.com/maps?q=' + encodeURIComponent(q) + '&z=16&output=embed';
      var f = el.querySelector('iframe');
      if (!f || f.getAttribute('src') !== src) el.innerHTML = '<iframe title="Peta lokasi kantor" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + esc(src) + '"></iframe>';
    });
    $$('[data-maps-link]').forEach(function (a) { a.hidden = !q; a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); });
    terapkanFoto();
    terapkanPorto();
  }

  // ── Foto (latar halaman & foto layanan) ──
  // Utamakan tautan gambar Google Drive (cepat). Bila gagal dibuka, ambil lewat server (getWebFoto) lalu simpan di browser.
  var FOTO_SIAP = {};
  function ambilFoto(slot, f, cb) {
    var key = slot + ':' + f.v;
    if (FOTO_SIAP[key] !== undefined) { if (FOTO_SIAP[key]) cb(FOTO_SIAP[key]); return; }
    var simpan = store.get('kgmFoto_' + slot);
    if (simpan && simpan.v === f.v && simpan.d) { FOTO_SIAP[key] = simpan.d; cb(simpan.d); return; }
    FOTO_SIAP[key] = '';
    var lewatServer = function () {
      api('getWebFoto', [slot], 30000).then(function (r) {
        if (!r.success) return;
        FOTO_SIAP[key] = r.data; store.set('kgmFoto_' + slot, { v: f.v, d: r.data }); cb(r.data);
      }).catch(function () { /* tanpa foto: latar warna tetap tampil */ });
    };
    if (!f.url) { lewatServer(); return; }
    var img = new Image();
    img.onload = function () { FOTO_SIAP[key] = f.url; cb(f.url); };
    img.onerror = lewatServer;
    img.src = f.url;
  }
  function terapkanFoto() {
    var foto = W().foto || {};
    $$('[data-foto]').forEach(function (el) {
      var f = foto[el.getAttribute('data-foto')];
      if (!f) { el.classList.remove('has-photo'); return; }
      ambilFoto(el.getAttribute('data-foto'), f, function (src) {
        el.style.setProperty('--foto', 'url("' + src.replace(/"/g, '%22') + '")');
        el.classList.add('has-photo');
      });
    });
    $$('[data-foto-img]').forEach(function (el) {
      var slot = el.getAttribute('data-foto-img'), f = foto[slot];
      if (!f) return;
      ambilFoto(slot, f, function (src) {
        el.insertAdjacentHTML('afterbegin', '<img alt="" loading="lazy" src="' + esc(src) + '">');
        el.classList.add('has-img'); el.hidden = false;
      });
    });
  }

  // ── Menu & navigasi ──
  $$('[data-nav]').forEach(function (a) { if (a.getAttribute('data-nav') === PAGE) a.setAttribute('aria-current', 'page'); });
  var menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', function () {
    var buka = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', buka);
    menuBtn.setAttribute('aria-expanded', String(buka));
    menuBtn.setAttribute('aria-label', buka ? 'Tutup menu' : 'Buka menu');
  });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { document.body.classList.remove('menu-open'); }); });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ── Informasi terbaru (dialog) ──
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-news]');
    if (b) {
      var item = (P.berita || [])[+b.getAttribute('data-news')]; if (!item) return;
      $('#newsDlgDate').textContent = tglPanjang(item.tanggal).replace(/&[^;]+;/g, '');
      $('#newsDlgTitle').textContent = item.judul;
      $('#newsDlgBody').innerHTML = paragraf(item.isi);
      var d = $('#newsDlg');
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
      return;
    }
    if (e.target.id === 'newsMore') { newsAll = true; terapkan(); }
    var pk = e.target.closest && e.target.closest('[data-pk]');
    if (pk) { e.preventDefault(); portoKat = pk.getAttribute('data-pk'); terapkan(); return; }
    var po = e.target.closest && e.target.closest('[data-porto-open]');
    if (po) { bukaPorto(po.getAttribute('data-porto-open')); try { history.replaceState(null, '', '#p-' + po.getAttribute('data-porto-open')); } catch (e2) { /* abaikan */ } return; }
    if (e.target.id === 'portoDlg') e.target.close();
    if (e.target.id === 'newsDlg') e.target.close(); // klik di luar kotak
  });

  // ── Cek resi ──
  var LANGKAH = ['Dijadwalkan', 'Dikirim', 'Diterima'];
  var KET = { Dijadwalkan: 'Order diterima & dijadwalkan', Dikirim: 'Dalam perjalanan', Diterima: 'Sudah diterima', Dibatalkan: 'Dibatalkan' };
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  function fmtWaktu(s) {
    var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!m) return esc(s);
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    var out = HARI[d.getUTCDay()] + ', ' + (+m[3]) + ' ' + BULAN[+m[2] - 1] + ' ' + m[1];
    return m[4] ? out + ' · ' + m[4] + '.' + m[5] + ' WIB' : out;
  }
  function langkah(cls, st, waktu, batal) {
    var ikon = cls.indexOf('done') >= 0 ? '<svg><use href="#i-' + (batal ? 'x' : 'check') + '"/></svg>' : '';
    var w = waktu ? '<time>' + fmtWaktu(waktu) + '</time>' : (cls === 'todo' ? '<span class="wait">Menunggu</span>' : '');
    return '<li class="step ' + cls + '"><span class="dot">' + ikon + '</span><div><b>' + esc(st) + '</b>' + w + '</div></li>';
  }
  function renderHasil(d) {
    var riwayat = Array.isArray(d.riwayat) ? d.riwayat : [];
    var waktuDari = {};
    riwayat.forEach(function (x) { waktuDari[x.status] = x.waktu; });
    var batal = d.status === 'Dibatalkan';
    var idx = LANGKAH.indexOf(d.status);
    var html = '<div class="t-top"><div class="t-no"><small>No. resi / surat jalan</small>' + esc(d.noResi) + '</div>' +
      '<span class="badge ' + (batal ? 'is-cancel' : d.status === 'Diterima' ? 'is-done' : '') + '">' + esc(KET[d.status] || d.status) + '</span></div><ol class="steps">';
    if (batal) {
      riwayat.filter(function (x) { return x.status !== 'Dibatalkan'; }).forEach(function (x) { html += langkah('done', x.status, x.waktu); });
      html += langkah('done cancel now', 'Dibatalkan', waktuDari.Dibatalkan, true);
    } else {
      LANGKAH.forEach(function (st, i) {
        html += langkah(i < idx ? 'done' : i === idx ? 'done now' : 'todo', st, i <= idx ? (waktuDari[st] || '') : '');
      });
    }
    html += '</ol>';
    if (d.diperbarui) html += '<p class="t-upd">Terakhir diperbarui ' + fmtWaktu(d.diperbarui) + '</p>';
    var box = $('#tResult');
    box.innerHTML = html;
    box.hidden = false;
  }
  function pesan(id, teks) { var m = $(id); m.textContent = teks || ''; m.hidden = !teks; }
  var tf = $('#trackForm');
  if (tf) {
    tf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var noEl = $('#tNo'), hpEl = $('#tHp'), btn = $('#tBtn');
      var no = noEl.value.trim().toUpperCase().replace(/\s+/g, '');
      var hp = hpEl.value.replace(/\D/g, '');
      noEl.value = no; hpEl.value = hp;
      noEl.setAttribute('aria-invalid', String(!no));
      hpEl.setAttribute('aria-invalid', String(hp.length !== 4));
      if (!no) { pesan('#tMsg', 'Isi nomor resi atau surat jalan.'); noEl.focus(); return; }
      if (hp.length !== 4) { pesan('#tMsg', 'Isi 4 digit terakhir no. HP (angka saja).'); hpEl.focus(); return; }
      pesan('#tMsg', ''); $('#tResult').hidden = true;
      btn.disabled = true; btn.querySelector('span').textContent = 'Mencari…';
      api('lacakResi', [no, hp]).then(function (res) {
        if (!res.success) {
          if (/Aksi tidak dikenal/.test(res.message)) {
            console.warn('Server belum mendukung lacakResi — perbarui Kode.gs dan buat Versi baru penerapan.');
            throw new Error('Layanan cek resi sedang tidak tersedia. Silakan hubungi kami lewat WhatsApp.');
          }
          throw new Error(res.message);
        }
        renderHasil(res.data);
        try { history.replaceState(null, '', '?resi=' + encodeURIComponent(no) + '#lacak'); } catch (e) { /* abaikan */ }
      }).catch(function (e) {
        pesan('#tMsg', e.message || 'Terjadi kesalahan. Coba lagi.');
      }).then(function () {
        btn.disabled = false; btn.querySelector('span').textContent = 'Lacak';
      });
    });
    $('#tHp').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
    // Tautan langsung: lacak.html?resi=PKT-261111-1 → nomor terisi, tinggal isi 4 digit HP.
    var q = (location.search.match(/[?&]resi=([^&]+)/) || [])[1];
    if (q) {
      try { $('#tNo').value = decodeURIComponent(q).toUpperCase().slice(0, 30); } catch (e) { /* abaikan */ }
      setTimeout(function () { $('#lacak').scrollIntoView({ block: 'start' }); $('#tHp').focus({ preventScroll: true }); }, 50);
    }
  }

  // ── Formulir pertanyaan ──
  var qf = $('#qForm');
  if (qf) {
    qf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var data = {};
      $$('input,select,textarea', qf).forEach(function (el) { if (el.name) data[el.name] = el.value.trim(); });
      var salah = '';
      if (!data.Nama) salah = 'Nama wajib diisi.';
      else if (data.NoHP.replace(/\D/g, '').length < 9) salah = 'Isi no. HP / WhatsApp yang aktif.';
      else if (data.Email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.Email)) salah = 'Format email tidak valid.';
      else if (data.Pesan.length < 10) salah = 'Tulis pertanyaan minimal 10 karakter.';
      if (salah) { pesan('#qMsg', salah); return; }
      pesan('#qMsg', '');
      var btn = $('#qBtn'); btn.disabled = true; btn.querySelector('span').textContent = 'Mengirim…';
      var waLanjut = function () {
        var n = nomorWA(); if (!n) return '';
        return 'https://wa.me/' + n + '?text=' + encodeURIComponent('Halo ' + nama() + ', saya ' + data.Nama + (data.Perusahaan ? ' dari ' + data.Perusahaan : '') +
          '. ' + (data.Layanan ? 'Layanan: ' + data.Layanan + '. ' : '') + data.Pesan);
      };
      api('kirimPertanyaan', [data]).then(function (res) {
        if (!res.success) throw new Error(/Aksi tidak dikenal/.test(res.message) ? 'Formulir sedang tidak tersedia. Silakan hubungi kami lewat WhatsApp.' : res.message);
        qf.hidden = true; $('#qDone').hidden = false;
        var w = $('#qWa'), href = waLanjut(); w.hidden = !href; if (href) w.href = href;
        $('#qDone').scrollIntoView({ block: 'center', behavior: 'smooth' });
      }).catch(function (e) {
        pesan('#qMsg', e.message);
        var href = waLanjut();
        if (href && e.jaringan) $('#qMsg').innerHTML = esc(e.message) + ' <a href="' + esc(href) + '" target="_blank" rel="noopener">Kirim lewat WhatsApp</a>';
      }).then(function () { btn.disabled = false; btn.querySelector('span').textContent = 'Kirim pertanyaan'; });
    });
    $('#qAgain').addEventListener('click', function () {
      $$('textarea', qf).forEach(function (t) { t.value = ''; });
      qf.hidden = false; $('#qDone').hidden = true;
    });
  }

  // ── Keluhan: ajukan & cek status ──
  var kf = $('#kForm');
  if (kf) {
    var KLH_ST = { 'Diterima': '', 'Sedang ditangani': '', 'Menunggu konfirmasi Anda': '', 'Selesai': 'is-done', 'Dibatalkan': 'is-cancel' };
    var resiQ = (location.search.match(/[?&]resi=([^&]+)/) || [])[1];
    if (resiQ) try { $('#kResi').value = decodeURIComponent(resiQ).toUpperCase(); } catch (e) { /* abaikan */ }
    kf.querySelector('[name=HP4]').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
    kf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = {};
      $$('input,select,textarea', kf).forEach(function (el) { if (el.name) d[el.name] = el.value.trim(); });
      d.NoResi = d.NoResi.toUpperCase().replace(/\s+/g, ''); kf.querySelector('[name=NoResi]').value = d.NoResi;
      var salah = !d.NoResi ? 'Isi nomor resi atau surat jalan.' : d.HP4.length !== 4 ? 'Isi 4 digit terakhir no. HP yang tercantum di dokumen.'
        : !d.NamaPelapor ? 'Isi nama Anda.' : d.HPPelapor.replace(/\D/g, '').length < 9 ? 'Isi no. HP / WhatsApp yang aktif.'
        : d.EmailPelapor && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.EmailPelapor) ? 'Format email tidak valid.'
        : !d.Kategori ? 'Pilih jenis keluhan.' : d.Deskripsi.length < 10 ? 'Ceritakan keluhan minimal 10 karakter.' : '';
      if (salah) { pesan('#kMsg', salah); return; }
      pesan('#kMsg', '');
      var btn = $('#kBtn'); btn.disabled = true; btn.querySelector('span').textContent = 'Mengirim…';
      api('kirimKeluhan', [d]).then(function (res) {
        if (!res.success) throw new Error(/Aksi tidak dikenal/.test(res.message) ? 'Formulir keluhan sedang tidak tersedia. Silakan hubungi kami lewat WhatsApp.' : res.message);
        var no = res.data.noKeluhan;
        kf.hidden = true; $('#kDone').hidden = false; $('#kNo').textContent = no;
        $('#sNo').value = no; $('#sHp').value = d.HPPelapor.replace(/\D/g, '').slice(-4);
        var n = nomorWA(), w = $('#kWa');
        w.hidden = !n;
        if (n) w.href = 'https://wa.me/' + n + '?text=' + encodeURIComponent('Halo ' + nama() + ', saya ' + d.NamaPelapor + ' sudah mengajukan keluhan no. ' + no + ' untuk resi ' + d.NoResi + ' (' + d.Kategori + ').');
        $('#kDone').scrollIntoView({ block: 'center', behavior: 'smooth' });
      }).catch(function (e) { pesan('#kMsg', e.message); })
        .then(function () { btn.disabled = false; btn.querySelector('span').textContent = 'Kirim keluhan'; });
    });
    $('#sHp').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
    $('#sForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var no = $('#sNo').value.trim().toUpperCase().replace(/\s+/g, ''), hp = $('#sHp').value.replace(/\D/g, '');
      $('#sNo').value = no;
      if (!no || hp.length !== 4) { pesan('#sMsg', 'Isi nomor keluhan dan 4 digit terakhir no. HP pelapor.'); return; }
      pesan('#sMsg', ''); $('#sResult').hidden = true;
      var btn = $('#sBtn'); btn.disabled = true; btn.querySelector('span').textContent = 'Mencari…';
      api('cekKeluhan', [no, hp]).then(function (res) {
        if (!res.success) throw new Error(/Aksi tidak dikenal/.test(res.message) ? 'Layanan cek keluhan sedang tidak tersedia.' : res.message);
        var d = res.data;
        var html = '<div class="t-top"><div class="t-no"><small>No. keluhan · ' + esc(d.kategori) + '</small>' + esc(d.noKeluhan) + '</div><span class="badge ' + (KLH_ST[d.status] || '') + '">' + esc(d.status) + '</span></div>' +
          (d.noResi ? '<p class="t-upd">Resi / surat jalan ' + esc(d.noResi) + ' · diajukan ' + fmtWaktu(d.dibuat) + '</p>' : '') +
          (d.solusi ? '<div class="klh-sol"><b>Penyelesaian</b><p>' + esc(d.solusi) + '</p></div>' : '') +
          '<ol class="steps">' + d.riwayat.slice().reverse().map(function (r, i) {
            return '<li class="step done' + (i === 0 ? ' now' : '') + '"><span class="dot"><svg><use href="#i-check"/></svg></span><div><b>' + esc(r.jenis) + '</b><time>' + fmtWaktu(r.waktu) + '</time>' +
              (r.isi ? '<p class="step-isi">' + esc(r.isi).replace(/\n/g, '<br>') + '</p>' : '') + '</div></li>';
          }).join('') + '</ol>';
        $('#sResult').innerHTML = html; $('#sResult').hidden = false;
        try { history.replaceState(null, '', '?klh=' + encodeURIComponent(no) + '#status'); } catch (e) { /* abaikan */ }
      }).catch(function (e) { pesan('#sMsg', e.message); })
        .then(function () { btn.disabled = false; btn.querySelector('span').textContent = 'Cek status'; });
    });
    var klhQ = (location.search.match(/[?&]klh=([^&]+)/) || [])[1];
    if (klhQ) { try { $('#sNo').value = decodeURIComponent(klhQ).toUpperCase(); } catch (e) { /* abaikan */ } setTimeout(function () { $('#status').scrollIntoView(); $('#sHp').focus({ preventScroll: true }); }, 50); }
  }

  // ── Mulai: tampilkan isi tersimpan/bawaan, lalu segarkan dari server ──
  terapkan();
  function keHash() { if (location.hash && PAGE !== 'lacak') { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); } }
  keHash();
  api('getPublicProfile', [], 25000).then(function (res) {
    if (!res.success) return;
    P = res.data || {};
    store.set('kgmWeb2', P);
    terapkan();
    if (PAGE === 'layanan') keHash();
    if (PAGE === 'galeri' && /^#p-/.test(location.hash)) bukaPorto(location.hash.slice(3));
  }).catch(function () { /* isi bawaan tetap tampil */ });
})();
