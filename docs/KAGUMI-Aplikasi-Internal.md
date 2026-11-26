# KAGUMI Aplikasi Internal — Dokumentasi Teknis

> Versi aplikasi: **4.6.14** (API_VERSI backend `4.6`) · Diperbarui: 26 November 2026
> Pemilik: PT. Karya Guna Usaha Mandiri (brand **KAGUMI Cargo & Auto Logistics**)
> Panduan pemakaian untuk karyawan: `Panduan-Aplikasi-Internal-KAGUMI.pdf` (satu folder dengan file ini).

Dokumen ini ditujukan untuk siapa pun yang **merawat atau merevisi** aplikasi, baik manusia maupun AI asisten. Baca seluruhnya sebelum mengubah kode.

---

## 1. Gambaran sistem

| Komponen | Akun Google | Frontend (Vercel) | Repo GitHub | Folder lokal (`D:\Bapak Y O G I\vercel to Github\`) |
|---|---|---|---|---|
| **Aplikasi Internal** (dokumen ini) | kagumi.me — proyek Apps Script "Kagumi Transport" | `kagumiinternal.vercel.app` (alias lama `kagumitransport.vercel.app`) | `yogendc/kagumitransport` | `1. Kagumi Trasnport` |
| **Website publik** | kagumi.me (backend sama dengan Internal) | `kagumicargo.vercel.app` | `yogendc/kagumi-web` | `1.1 Kagumi Web` |
| **SOP + Absensi** (server gabungan) | kagumi.hrf — proyek Apps Script SOP | SOP: `kagumi-sop-d4ax.vercel.app` · Absensi: `absensi-kagumi.vercel.app` | `kagumi-sop`, `yogendc/Absensi.kagumi` | `1.2 Kagumi SOP & Absensi\SOP`, `...\Absensi` |

Pemisahan data:
- **kagumi.me** menyimpan transaksi: order, invoice, keuangan, CRM, keluhan, website.
- **kagumi.hrf** menyimpan SOP dan absensi/karyawan.
- Kedua server **tidak berbagi database**. Keduanya hanya berbagi satu kunci HMAC untuk login sekali (bagian 7).

Proyek Apps Script lama **"Kagumi Absensi"** (Absensi + Payroll terpisah) **tidak dipakai lagi** sejak Absensi pindah ke server SOP. Simpan sebagai arsip, jangan dihapus.

```
Browser karyawan ──fetch JSON──▶ Apps Script kagumi.me (/exec) ──▶ Google Sheets + Drive (kagumi.me)
      │                                     │
      │  klik "Absensi"/"SOP"               └─ linkSop / linkAbsensi: buat token HMAC
      ▼
absensi-kagumi / kagumi-sop (Vercel) ──fetch──▶ Apps Script kagumi.hrf (/exec) ──▶ Sheets + Drive (kagumi.hrf)
Pelanggan ──▶ kagumicargo.vercel.app ──fetch (aksi publik)──▶ Apps Script kagumi.me
```

---

## 2. Teknologi & struktur kode

- **Backend**: Google Apps Script, satu file `Kode.gs`, dipublikasikan sebagai Web App (`/exec`). Database berupa Google Sheets (dibuat otomatis), dan file disimpan di Google Drive.
- **Frontend**: HTML/CSS/JS statis (tanpa framework, tanpa bundler npm), di-hosting Vercel lewat GitHub.
- Ikon: Bootstrap Icons (CDN). Font: Google Fonts.

### Frontend aplikasi Internal (yang di-push ke repo)
```
index.html
css/style.css
js/app.js          ← hasil gabungan app1–app7 (lihat di bawah)
js/config.js       ← BERISI URL /exec. TIDAK ikut zip update; jangan ditimpa.
favicon.png, favicon.ico, apple-touch-icon.png
docs/              ← panduan PDF + file .md ini (tidak ikut terbit, lihat .vercelignore)
.vercelignore
```

### Sumber pengembangan (sebelum digabung)
`js/app.js` dibangun dari beberapa file sumber dengan skrip `build_api.py`:

| File | Isi utama |
|---|---|
| `app1.js` | State `S`, API helper (`api()`, retry "sedang sibuk", timeout), login, sidebar, routing, lencana (`updateBadges`), peran (`isSales`, `isCS`, `isSupir`, `pagesTerbatas`), tombol SOP/Absensi |
| `app2.js` | Form order (sewa/kirim/paket), master data, rekap, invoice, keuangan, laporan, pengaturan, dokumen cetak (`docSuratJalan`, `docInvoice`, `openPrint`) |
| `app3.js` | Pertanyaan masuk, Kelola Website, Galeri (watermark `tandaAir`) |
| `app4.js` | CRM (perusahaan + usulan, leads, update status ber-SOP, aktivitas, bukti screenshot) |
| `app5.js` | Keluhan pelanggan (draf, cari resi, tindak lanjut, SLA) |
| `app6.js` | Kinerja CS, Daftar Harga, Surat Menyurat |
| `app7.js` | Notifikasi WA/Email, Kontak & Blast, Kuota & Arsip, barcode `KgmBar`, Asuransi, Integrasi SOP/Absensi |

Aturan build:
- Penanda akhir CSS `:root{--kgm-css-end:1}` **harus tetap paling akhir** di stylesheet.
- Naikkan `VER` di `build_api.py` setiap rilis (dipakai sebagai `?v=` untuk membuang cache browser).

---

## 3. Peran & hak akses

Konstanta di `Kode.gs`:

```js
ROLE_SA='SUPER_ADMIN', ROLE_ADMIN='ADMIN', ROLE_SALES='SALES', ROLE_CS='CS', ROLE_SUPIR='SUPIR'
ROLES_STAF  = [SA, ADMIN]              // bawaan aksi operasional
ROLES_CRM   = [SA, ADMIN, SALES]
ROLES_CS    = [SA, ADMIN, CS]
ROLES_SURAT = [SA, ADMIN, CS]          // Sales tidak membuat surat
ROLES_SEMUA = [SA, ADMIN, SALES, CS]
ROLES_LOGIN = ROLES_SEMUA + SUPIR      // Supir hanya absen + SOP, tanpa data transaksi
```

Aturan bisnis yang **dijaga di server** (frontend hanya menyembunyikan):
- Konfirmasi order / terbit surat jalan: SA & Admin.
- Harga beli ekspedisi rekanan: SA saja (`ekspedisiUntuk_`). Admin hanya melihat nama/PIC/WA/layanan.
- Sales:
  - Hanya mengubah lead miliknya sendiri (`bolehUbahLead_`).
  - Perubahan data perusahaan CRM menjadi **usulan** (`UsulanData`) yang ditinjau SA/Admin (`tinjauUsulanPt`). Kolom Catatan boleh diubah langsung.
- Pindah tahap lead ke `Dihubungi/Negosiasi/Deal/Gagal` oleh Sales **wajib screenshot**. Status langsung berlaku. SA memeriksa lewat `cekPerubahanTahap` (sesuai/tolak); bila ditolak, tahap dikembalikan.
- Website, Notifikasi WA/Email, Kontak/Blast, Keuangan, Laporan, Pengaturan, Kuota/Arsip, Integrasi: SA saja.
- Supir: `getBootstrap` hanya mengembalikan `me` + `settings`.

---

## 4. Database (Google Sheets)

Sheet dibuat otomatis dari konstanta `SCHEMA`. **Kolom baru selalu ditambahkan di akhir**; sheet lama dimigrasi otomatis. Jangan mengubah urutan atau menghapus kolom.

| Sheet | Isi |
|---|---|
| `Pengguna` | Akun internal, peran, status, `KodeCetak` (2 angka, SA/Admin), `BebasLokasi` (`'true'` = boleh di luar area kantor, 4.6.4) |
| `Pelanggan`, `Penerima`, `Kendaraan`, `Pengemudi`, `Ekspedisi` | Data master |
| `Order_Sewa`, `Order_Kirim`, `Order_Paket` | Order per layanan (`ORDER_BASE` + kolom khusus). Kirim/Paket punya kolom asuransi: `Asuransi, AsJenis, AsNilai, AsStatus, AsPerusahaan, AsPolis, AsPremi, AsKeputusan, AsFile, PernyataanFile`. Ketiganya diakhiri `KodeLacak` (4.6.4) |
| `Inspeksi` | Inspeksi body kendaraan (foto di Drive) |
| `Invoice`, `Finance`, `Rekening_Bank` | Tagihan, buku kas, rekening |
| `CRM_Company`, `CRM_Leads`, `CRM_Activity`, `Target_Sales` | CRM (aktivitas punya `BuktiFoto, TahapDari, TahapKe, StatusCek, CekOleh, CekPada, CekAlasan`) |
| `CRM_Kontak`, `CRM_Interaksi`, `BlastWA`, `AntrianNotif` | Kontak, blast, antrean notifikasi |
| `Keluhan`, `Keluhan_Log` | Keluhan + riwayat (`OlehEmail, OlehNama, OlehPeran`) |
| `Pertanyaan` | Form "Hubungi Kami" website |
| `Harga`, `Surat` | Daftar harga, surat menyurat |
| `Berita`, `Galeri` | Konten website |
| `Pengaturan`, `Log_Aktivitas` | Setelan aplikasi, log audit |

### Penomoran
- **Surat jalan / resi** (`nomorDokBaru_`): `KGM-` + `P|S|K` + `-` + `YY` + `MM` + `kodeCetak_` penerbit (2 digit) + `kodeCabang_` (1 digit, 1–9, per akun di kolom `KodeCabang` Pengguna; kosong = 1) + `-` + urut 4 digit (per layanan, reset tiap tahun, counter di properti `NO_{L}`). Contoh `KGM-P-2611012-0001`. Pencarian publik (cek resi, keluhan) cukup memakai **6 digit terakhir** nomor (`120001`) + kode lacak; hasilnya harus tepat satu order (`cariOrderEnamDigit_`). Order lama tetap memakai format lama `KGM-P00012011126` dan tetap bisa dicari dengan nomor lengkap.
- **Kode lacak** (4.6.4, `kodeLacakBaru_`): 6 karakter acak dari `HURUF_KODE_LACAK` (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, tanpa I/L/O/0/1), dibuat saat order dikonfirmasi. Order lama diisi `isiKodeLacakLama_()` (getBootstrap SA/Admin & dailyCheck). **Tidak dicetak** di dokumen.
- **Keluhan**: `KLH-YYMMDD-n`. Nomor diambil **setelah** validasi lolos, supaya nomor tidak terlewat.
- **Surat**: nomor terbit saat dikonfirmasi (`SRT_COUNTER`).

### Google Drive
Folder induk `KAGUMI` berisi: PDF dokumen, `Website/Galeri` (`FOLDER_PORTO`), foto inspeksi (`FOLDER_INSP`), bukti CRM (`FOLDER_BUKTI_CRM`), dokumen asuransi (`FOLDER_ASURANSI`), arsip (`FOLDER_ARSIP`). ID folder disimpan di Script Properties.

---

## 5. API

- Semua panggilan: `POST /exec` dengan body teks JSON `{ "action": "<nama>", "args": [...] }`. Balasan: `{ success, data, message, auth }`.
- Aksi harus terdaftar di **`daftarAksi_()`** (whitelist). Aksi di luar daftar ditolak.
- Setiap aksi non-publik memanggil `sesi_(token, ROLES_x)` sebagai argumen pertama. Bila daftar peran tidak disebut, bawaannya `ROLES_STAF`.
- Penulisan data dibungkus `denganKunci_()` (LockService). `_PROP_MEMO` di-reset setelah kunci didapat.

**Aksi publik** (`AKSI_PUBLIK`, dipakai website): `getPublicProfile, lacakResi, kirimPertanyaan, getWebFoto, getPortoFoto, kirimKeluhan, cekKeluhan`.
- 4.6.4: `lacakResi(noResi, kode)`, `kirimKeluhan({…, KodeLacak})`, dan `cekKeluhan(noKeluhan, kode)` memakai **kode lacak** order (bukan lagi 4 digit HP yang tercetak di surat jalan). Pembanding `samaAman_`, normalisasi `normalKode_`. Pesan gagal sama untuk "nomor tidak ada" dan "kode salah". Maks. 5 salah per nomor / 15 menit.
- `kirimUlangKode(noResi)` (publik): mengirim kode **hanya** ke WA/email yang tercatat di order (pelanggan, penerima, pengirim paket) lewat antrean, event `KODE_LACAK`. Jawaban selalu sama (`PESAN_KIRIM_KODE`). Batas 1×/nomor/10 menit (`KUK_<no>`), 40×/10 menit global. Bila WA belum aktif → pesan "belum tersedia" (dicek sebelum mencari nomor).
- `kirimKodeLacak(token, layanan, id, mode)` (staf): `mode` = `lihat` (SA/Admin), `kirim` (SA/Admin/CS, CS tidak menerima kode di respons), `ganti` (SA/Admin; kode lama langsung mati). Semua tercatat di log.
- `getBootstrap` **tidak** mengirim `KodeLacak` (diganti `KodeAda`), dan `saveCache()` membuangnya, jadi kode tidak tersimpan di localStorage.
- Nama petugas tidak pernah dikirim ke publik.
- 4.6.3: selain batas per nomor (5×/15 menit), ada **batas gagal global** `PUB_GAGAL_MAKS` = 300 per 10 menit (`cekGagalPublik_` / `catatGagalPublik_`) untuk menahan penebakan yang disebar ke banyak nomor.

### Batas lokasi akses / geofence (4.6.4)
- Konfigurasi di properti `GEO_AKSES` (JSON `{aktif, peran[], lokasi[{nama,lat,lng,radius}], maxAkurasi, menit}`), diatur lewat `getAksesLokasi` / `simpanAksesLokasi` (SA). Peran yang boleh dibatasi: `GEO_PERAN_BOLEH` (Admin, CS, Sales, Supir). **SA tidak pernah dibatasi.** Pengecualian per pengguna: kolom `BebasLokasi`.
- `geoWajib_(user)` → `loginPassword(email, pass, lok)` wajib lokasi di dalam radius (`nilaiLokasi_`: kode `TANPA` / `AKURASI` / `LUAR` / `OK`). Kata sandi dicek lebih dulu; penolakan lokasi tidak menambah hitungan gagal login.
- `sesi_()` melempar `GeoError_` (respons `{success:false, lokasi:true, data}`) bila cache `GEO_<email>_<token.i>` tidak ada. Cache diisi saat login & `perbaruiLokasi(token, lok)`, berlaku `menit` (bawaan 10). Kunci per **token**, jadi perangkat lain tidak ikut lolos.
- Frontend: `api()` menangkap `lokasi:true` → `cekLokasiSekarang()` (ambil posisi `maximumAge:0` → `perbaruiLokasi`) → ulangi sekali; gagal → `geoKunci()` (overlay, `body.geo-locked` menyembunyikan `#appView`). `geoMulai()` mengecek tiap `menit-2` menit & saat tab kembali aktif. Akun terbatas hanya menyimpan `{me, settings}` di localStorage.
- Penolakan dicatat `catatTolakGeo_` ("Akses ditolak: lokasi", maks. 1×/30 menit/pengguna).
- Keterbatasan: lokasi dari browser bisa dipalsukan; ini pencegah, bukan pengaman mutlak.

### Logout (4.6.4)
- `logout(token)` menaruh `OUT_<email>_<i>` di cache (sisa umur token, maks. 6 jam) yang dicek `bacaToken_`, jadi token yang sudah keluar langsung tidak berlaku.

### Keamanan penulisan sheet (4.6.3)
- Semua penulisan data memakai **`tulisAman_(range, nilai)`** (dipakai `simpanBaris_`, `catatLog_`, `tulisPengaturan_`, antrean notifikasi, arsip). Teks yang diawali `= + - @` (kecuali angka murni seperti `-250000`) ditulis dengan format teks `@` di kolom itu, sehingga tidak dijalankan sebagai rumus (formula injection, mis. `=IMPORTXML(...)` dari formulir website).
- **Jangan** memakai `appendRow` / `setValues` langsung untuk data dari pengguna; selalu lewat `tulisAman_` atau `simpanBaris_`.
- `getBootstrap` & `saveMaster` selalu mengirim **NoKTP tersamar** (juga ke Super Admin) supaya NIK tidak tersimpan di localStorage. NIK lengkap hanya lewat `revealKTP` (SA). `saveMaster` mempertahankan NIK lama bila isian berisi `*`.
- `cekIntegrasiSOP` tidak lagi mencetak tautan bertoken ke log.

Kelompok aksi lain:
- **Order & dokumen**: `saveOrder, updateOrderStatus, deleteDraft, markPrinted, exportPdf, updateAsuransi, uploadDokAsuransi, getDokAsuransi, saveInspeksi, uploadFotoInspeksi, getFotoThumb`
- **Tagihan & keuangan**: `markInvoicePaid, sendInvoiceEmail, logReminder, saveFinance, deleteFinance`
- **Master & pengguna**: `saveMaster, deleteMaster, revealKTP, updateEkspedisi, saveUser, setUserStatus, deleteUser, resetUserPassword, changePassword`
- **CRM**: `saveCrmCompany, deleteCrmCompany, tinjauUsulanPt, saveCrmLead, deleteCrmLead, saveCrmActivity, deleteCrmActivity, cekPerubahanTahap, getBuktiCrm, leadDariPertanyaan, saveTargetSales`
- **CS**: `saveKeluhan` (mendukung `Draf` & `Final`), `tindakKeluhan, cariOrderKeluhan` (cocok persis → sebagian/nama, mengembalikan `pilihan`), `setPertanyaan`
- **Surat & harga**: `saveSurat, deleteSurat, ajukanSurat, putuskanSurat, arsipSurat, suratPdf, saveHarga, deleteHarga`
- **Website**: `saveWebsite, saveBerita, deleteBerita, savePortofolio, deletePortofolio, uploadFotoWeb, hapusFotoWeb, saveWebLogo`
- **WA/Email**: `getNotifPanel, saveNotifSetting, setFonnteToken, cekFonnte, ujiKirimWA, prosesAntrianSekarang, ulangAntrianGagal, getKontak, saveKontak, deleteKontak, getInteraksi, saveInteraksi, cekNomorWA, previewBlast, mulaiBlast, hentikanBlast`
- **Sistem**: `getLoginContext, loginPassword, logout, getBootstrap, saveSettings, getLogs, getSystemStatus, runBackupNow, installTriggersFromApp, testEmail, getKuota, setJenisAkun, pratinjauArsip, jalankanArsip`
- **Integrasi**: `linkSop, linkAbsensi, getIntegrasi, simpanIntegrasi` (argumen ke-5 `opsi {apiUrl, sinkron}` untuk Absensi), `sinkronAbsensiSemua`

---

## 6. Script Properties (rahasia & konfigurasi)

Rahasia **hanya** disimpan di Script Properties. Jangan pernah ditulis di kode, dikirim ke browser, atau dicetak ke log. Frontend hanya menerima versi samar (`abcd••••xyz`).

| Properti | Isi |
|---|---|
| `SESSION_SECRET` | Kunci tanda tangan sesi login Internal (dibuat otomatis) |
| `FONNTE_TOKEN` | Token WhatsApp Fonnte (diisi dari menu Notifikasi WA). Cara pasang: panduan PDF Bab 22 / `Cara-Pasang-WhatsApp-Fonnte-KAGUMI.pdf` |
| `GEO_AKSES` | Batas lokasi akses (JSON), diisi dari Pengaturan → Batas lokasi akses |
| `SOP_SESSION_SECRET`, `SOP_FRONTEND_URL` | Integrasi SOP (diisi dari Pengaturan → Integrasi) |
| `ABSENSI_SESSION_SECRET`, `ABSENSI_FRONTEND_URL` | Integrasi Absensi. Rahasianya **sama** dengan SOP, karena servernya satu |
| `ABSENSI_API_URL`, `ABSENSI_SINKRON` | URL `/exec` server SOP/Absensi dan saklar kirim akun otomatis (`'true'`/`'false'`) |
| `SPREADSHEET_ID`, `FOLDER_*` | ID database & folder Drive |
| `NO_P`, `NO_S`, `NO_K`, `KLH_COUNTER`, `SRT_COUNTER`, dll. | Penghitung nomor (`SJ_COUNTER`/`PKT_COUNTER` sisa format lama) |

Catatan: halaman Script Properties di editor menjadi **hanya-baca bila sudah lebih dari 50 properti**. Karena itu integrasi diisi lewat tab **Pengaturan → Integrasi SOP & Absensi** (`simpanIntegrasi`: SA saja; URL wajib https; rahasia minimal 16 karakter; rahasia kosong berarti tetap memakai yang lama).

---

## 7. Login sekali ke SOP & Absensi (kontrak token)

`linkSop` / `linkAbsensi` membuat URL bertoken **hanya** untuk sesi yang sudah terverifikasi. Email dan peran diambil dari sesi, **tidak pernah** dari body request.

```
token = P + "." + SIG
P   = base64url( UTF-8 JSON {e, n, j, r, x} ), tanpa "="
SIG = base64url( HMAC-SHA256( P, SECRET ) ), tanpa "="
e = email (huruf kecil) · n = nama · j = jabatan · r = peran · x = kedaluwarsa (milidetik epoch, +12 jam)
URL = base + "/#token=" + encodeURIComponent(token)     (atau "?token=" bila base = script.google.com)
```

- **SOP**: peran dipetakan menjadi `SUPER_ADMIN` (SA) atau `KARYAWAN`.
- **Absensi**: peran mentah dikirim, tapi server gabungan mengambil peran & ID Karyawan dari **Data Karyawan** berdasarkan email. Karyawan harus didaftarkan HRD dengan email yang sama.
- Token dikirim lewat **hash** (tidak tercatat di log Vercel) dan langsung dihapus dari address bar oleh aplikasi tujuan.
- Frontend membuka tab kosong lebih dulu (anti popup-blocker), lalu mengisi URL. URL bertoken **tidak boleh** disimpan di localStorage atau log.

Gejala "Sesi tidak valid" di SOP/Absensi berarti rahasia tidak cocok. Salin ulang hasil `lihatRahasiaUntukAppUtama` dari proyek SOP (hanya bagian setelah `=`).

### Sinkron akun Internal → Data Karyawan Absensi (server-ke-server)

Bila `ABSENSI_SINKRON='true'`, backend Internal mengirim paket lewat `UrlFetchApp` ke `ABSENSI_API_URL`. Pengiriman dilakukan **di luar kunci** dan **tidak pernah menggagalkan penyimpanan akun**. Teks hasilnya dikembalikan sebagai `data.absensi`.

```
POST ABSENSI_API_URL   body: {"action":"sinkronKaryawanApp","data":{"p":P,"s":SIG}}
P   = base64url(JSON {aud:'sinkron-karyawan', id:uuid, x: now+5 menit, items:[...]}), tanpa "="
SIG = base64url(HMAC-SHA256(P, ABSENSI_SESSION_SECRET)), tanpa "="
items:
  {op:'upsert', email, nama, jabatan, divisi, telepon, peranApp, lapangan, aktif}   ← saveUser / sinkronAbsensiSemua
  {op:'status', email, aktif}                                                       ← setUserStatus, deleteUser (aktif:false), saveUser bila status berubah
  {op:'gantiEmail', lama, email}                                                    ← saveUser bila email berubah
```

Aturan di server penerima (`sinkronKaryawanApp_` di Code.gs SOP):
- Verifikasi HMAC; `aud` wajib `sinkron-karyawan`; `x` harus ≤ 15 menit ke depan; `id` hanya bisa dipakai sekali (CacheService, anti putar-ulang).
- Paket ber-`aud` **ditolak** sebagai token login (`verifikasiToken_`).
- `upsert` untuk email baru: membuat baris **tanpa ID Karyawan & tanpa kata sandi**. Peran `SUPER_ADMIN` bila `peranApp` SA; selain itu `KARYAWAN`. `Lapangan` = Sales/Supir.
- `upsert` untuk email yang sudah ada: **hanya mengisi kolom yang kosong** (Nama, Jabatan, Divisi, Telepon). ID, jadwal, peran, dan status tidak disentuh.
- `status` tidak menonaktifkan Super Admin aktif terakhir. Baris **tidak pernah dihapus**.
- Akun tanpa `Hash` tidak bisa login langsung ke SOP/Absensi; masuknya hanya lewat Internal (token).
- Data Karyawan menampilkan filter **Perlu ID** + banner jumlah akun aktif tanpa ID.

### Aturan di server SOP/Absensi (kagumi.hrf) yang perlu diketahui
- Absensi: email Internal harus sama dengan email di Data Karyawan, dan karyawan harus punya **ID Karyawan** agar bisa absen. Karyawan tidak bisa dihapus, hanya dinonaktifkan.
- Status kehadiran **IZIN/SAKIT/ALPA** dan keputusan izin/sakit yang sudah diproses hanya bisa diubah **SUPER_ADMIN** (`STATUS_KUNCI_SA` di `absKoreksi_` & `absProsesIzin_`). HRD hanya melihat.
- `API_URL` frontend Absensi dan SOP sama-sama menunjuk ke URL `/exec` server gabungan.
- Server 1.0.1 (4.6.3): `cekAkunAktif_` di `route_` — setiap permintaan bertoken dicek ke sheet Pengguna (cache 2 menit, kunci ikut versi `ABS`). Akun nonaktif ditolak walau token belum kedaluwarsa; token login langsung (`s:'sop'`) wajib punya baris aktif dan perannya mengikuti sheet. Kunci idempotensi `reqId` kini per pengguna. `log_` memakai `aman_`.
- Frontend Absensi: `App.logout` menghapus semua kunci `kgabs:v1:u:*` (cache per pengguna).

---

## 8. Pemicu otomatis (triggers)

Dibuat dengan menjalankan `installTriggers()` sekali di editor, atau dari Pengaturan → Sistem:

| Fungsi | Jadwal | Tugas |
|---|---|---|
| `prosesAntrianNotif` | setiap 1 menit | Kirim antrean WA/email, blast ber-batch |
| `dailyCheck` | setiap hari jam 06.00 WIB | Cek invoice jatuh tempo (≤ 3 hari), masa KIR/pajak/SIM, catat kuota & kapasitas Drive, email ringkasan ke admin (bila `emailDigest` aktif) |
| `weeklyBackup` | Minggu malam | Salinan spreadsheet ke folder cadangan Drive (`FOLDER_BACKUP`) |

---

## 9. Fitur per modul (ringkas)

- **Order**: draf → konfirmasi (kunci data) → cetak tanpa/dengan nominal, tanda terima (kirim), surat pernyataan tanpa asuransi (kirim/paket).
  - Metode bayar: `COD, DP, Invoice Surat Kembali, Lunas, Termin` (paket: `Lunas, Termin, Invoice Surat Kembali`).
  - Total = Harga + Pajak + Penyesuaian + Premi (bila berasuransi).
- **Asuransi**: wajib dipilih (kirim/paket).
  - Bila berasuransi: Jenis/Status/Perusahaan/Nilai wajib diisi. Polis boleh "menyusul".
  - Bila tanpa asuransi: kalimat `teksTanpaAsuransiSJ` tercetak di SJ/resi/TT.
  - `updateAsuransi` tetap bisa dipakai setelah order terkunci dan ikut menyinkronkan invoice.
- **Invoice**: terbit otomatis untuk non-Lunas. `markInvoicePaid` mencatat ke `Finance`.
- **Keluhan**: SLA per prioritas.
  - Draf boleh tanpa detail, tapi **no. resi wajib**. Nomor terbit saat draf disimpan.
  - Draf hanya bisa dibatalkan atau dilengkapi (`Final`).
  - Penerima dan pelaku tercatat otomatis dari sesi (`OlehNama`, `OlehPeran`).
  - Lencana menghitung Draf + Baru + Diproses + Menunggu Pelanggan.
- **CRM**: tahap `Lead Baru → Dihubungi → Berminat → Penawaran Dikirim → Negosiasi → Deal / Gagal`. Bukti screenshot dikompres di browser (maks. 700 KB).
- **Galeri website**: watermark alamat website ditambahkan di browser sebelum unggah. Tanggal opsional.
- **Kuota**: email harian, waktu pemicu, UrlFetch, kapasitas Drive (`infoDrive_`), jumlah sel Sheets (batas 10 juta). Arsip data lama tersedia.

---

## 10. Cara deploy revisi

**Backend (Apps Script kagumi.me, proyek "Kagumi Transport")**
1. Ganti isi `Kode.gs` → Simpan.
2. **Terapkan → Kelola penerapan → ✏️ Edit → Versi: Versi baru → Terapkan.** Jangan membuat penerapan baru, supaya URL `/exec` tetap sama.
3. Bila ada trigger baru, jalankan `installTriggers` sekali.
4. Bila muncul "Anda tidak memiliki izin untuk memanggil UrlFetchApp.fetch" (kirim akun ke Absensi / WhatsApp Fonnte), jalankan `izinkanAksesInternet` sekali dari editor lalu **Izinkan**.

**Frontend (repo `kagumitransport`)**
1. Ekstrak zip update langsung ke folder `1. Kagumi Trasnport`, lalu timpa file lama. `js/config.js` tidak ikut zip.
2. Jalankan:
   ```
   cd "D:\Bapak Y O G I\vercel to Github\1. Kagumi Trasnport"
   git add .
   git commit -m "pesan revisi"
   git push
   ```
3. Vercel deploy otomatis (±1 menit). Lalu buka aplikasi dan tekan **Ctrl+Shift+R**.

**Isi zip update** (mulai 4.6.1): `index.html`, `css/`, `js/app.js`, ikon, `.vercelignore`, dan folder **`docs/`** berisi panduan PDF + file `.md` ini. Folder `docs/` tersimpan di repo tapi **tidak diterbitkan** di Vercel (diatur `.vercelignore`).

Tips PowerShell: bila huruf pertama perintah hilang saat ditempel (`it add`, `d "folder"`), ketik ulang huruf itu sebelum Enter.

---

## 11. Aturan untuk revisi berikutnya

1. Pelajari pola yang ada sebelum menulis: `sesi_`, `denganKunci_`, `ok_/gagal_`, `jalan_`, helper `api()`, `openModal`, `toast`, `btnBusy`.
2. Aksi baru **wajib** didaftarkan di `daftarAksi_()` dengan pengecekan peran yang tepat.
3. Kolom sheet baru **hanya ditambahkan di akhir** `SCHEMA`.
4. Validasi selalu dilakukan di server. Frontend hanya membantu.
5. Rahasia tidak boleh masuk ke kode, log, atau browser.
6. Uji per peran (SA, Admin, Sales, CS, Supir) di lebar desktop dan HP (390 px).
7. Naikkan versi (`VER` di build), perbarui **Riwayat revisi** di bawah, perbarui panduan PDF bila ada perubahan tampilan atau alur, lalu sertakan `docs/` di zip.
8. Data dari pengguna (terutama formulir website publik) selalu ditampilkan dengan `esc()` dan ditulis ke sheet lewat `tulisAman_`/`simpanBaris_`. Data pribadi sensitif (NIK, rekening lengkap, kode lacak) tidak boleh ikut `saveCache()`.
9. Fitur baru yang menyangkut data pelanggan di website wajib memakai kode lacak (bukan data yang tercetak di dokumen).
11. **Panduan per divisi** (langsung di folder `docs/`: `Panduan-Super-Admin-KAGUMI.pdf`, `-Admin-`, `-Customer-Service-`, `-Sales-`, `-Supir-`, `-HRD-`) dibuat otomatis oleh `gen_divisi.py` dari bab-bab `panduan.html` + bab khusus per peran. **Wajib dijalankan ulang di setiap revisi** (setelah `panduan.html` diperbarui) dan ikut di setiap zip update, bersama panduan lengkap dan file md ini. Bab baru yang menyangkut suatu peran ditambahkan ke daftar `isi` peran itu di `PERAN`.
10. Animasi website: hanya `opacity`/`transform`, selalu di bawah kelas `html.anim` (tidak aktif untuk "kurangi gerakan"), dan elemen baru yang perlu animasi muncul-saat-digulir ditambahkan ke daftar `SEL` di CSS **dan** `web.src.js` (keduanya harus sama).

---

## 12. Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 4.6.14 (Kelola Website & Kode.gs) | 26 Nov 2026 | **Hero halaman Hubungi Kami bisa diedit** (label, judul, keterangan) di tab Hubungi kami (`Kode.gs`, aplikasi Internal, dan website 4.6.14). |
| Website 4.6.14 | 26 Nov 2026 | Hero halaman Hubungi Kami memakai teks dari Kelola Website (`website-4.6.14.zip`). |
| 4.6.13 (Kelola Website & Kode.gs) | 26 Nov 2026 | **Kotak "Sudah punya nomor resi?" bisa diedit** di tab Produk & layanan (`Kode.gs`, aplikasi Internal, dan website 4.6.13). |
| Website 4.6.13 | 26 Nov 2026 | Kotak "Sudah punya nomor resi?" di halaman Produk & Layanan memakai teks dari Kelola Website (`website-4.6.13.zip`). |
| Website 4.6.12 | 26 Nov 2026 | **Bidang usaha di beranda dan Tentang Kami**: baris berakhir titik (.) tampil sebagai deskripsi menjorok tanpa centang; yang lain tetap dicentang sebagai judul layanan (`website-4.6.12.zip`). |
| 4.6.12 (Internal) | 26 Nov 2026 | **Bisa dipasang sebagai aplikasi di HP Android** (PWA): manifest, ikon, dan service worker (`aplikasi-internal-4.6.12.zip`). Service worker hanya menyimpan berkas tampilan, tidak pernah data dari Apps Script. Backend `Kode.gs` tidak berubah dari 4.6.11. |
| Website 4.6.11 | 26 Nov 2026 | **Format nomor resi baru** `KGM-P-2611012-0001` (tahun-bulan, penerbit, cabang, urut). Cek resi cukup **6 digit terakhir** + kode lacak. Placeholder dan petunjuk di halaman Lacak, Keluhan, dan beranda (`website-4.6.11.zip`). |
| 4.6.11 (Kode.gs & Internal) | 26 Nov 2026 | **Kode cabang per akun** (kolom `KodeCabang` di sheet Pengguna, 1–9, form Pengguna untuk Admin/Super Admin). `nomorDokBaru_` memakai format baru dan tetap menghitung urut dari format lama. `cariOrderPublik_` menerima 6 digit terakhir (`cariOrderEnamDigit_`). Pakai `Kode.gs` 4.6.11. |
| Website 4.6.10 | 26 Nov 2026 | **Tentang Kami: kotak operasional di bawah Profil perusahaan** (`website-4.6.10.zip`). Empat kotak berisi ikon, judul, dan keterangan singkat, dengan label dan judul bagian di atasnya. Semuanya bisa diubah di Kelola Website → Tentang Kami. Kosongkan semua baris untuk menyembunyikan bagian ini. Di layar lebar tampil dua kolom, di HP satu kolom. |
| 4.6.10 (Kelola Website) | 26 Nov 2026 | **Kelola Website → Tentang Kami: kartu Kotak operasional** (`Kode.gs`, aplikasi Internal, dan Stylesheet). Pilihan ikon dibatasi pada daftar yang tersedia. Server berubah, jadi `Kode.gs` perlu ditempel ulang ke Apps Script lalu diterapkan ulang. |
| Website 4.6.9 | 26 Nov 2026 | **Judul halaman Tentang Kami bisa diubah**: label kecil dan judul besar. Kosongkan judul untuk memakai nama merek (Pengaturan → Branding → Nama aplikasi). Kolom baru `tentangLabel` dan `tentangJudul` di isi website; tidak ada perubahan sheet. |
| 4.6.9 (Kelola Website) | 26 Nov 2026 | **Kelola Website → tab Tentang Kami: kartu Judul halaman Tentang Kami** (`Kode.gs` dan aplikasi Internal). Server berubah, jadi `Kode.gs` perlu ditempel ulang ke Apps Script lalu diterapkan ulang. |
| Website 4.6.8 | 26 Nov 2026 | **Tentang Kami: perjalanan founder** (`website-4.6.8.zip`, hanya frontend website). Bagian baru di Tentang Kami, di bawah Sejarah, menampilkan foto dari Galeri dengan kategori **Perjalanan Founder**, diurutkan dari tanggal terlama; foto tanpa tanggal di akhir. Tiap foto menampilkan tanggal (bila diisi), keterangan foto, dan penjelasan. Bagian ini ditaruh di bawah hero, di atas Sejarah, dalam grid tiga kolom di layar lebar, dua kolom di tablet, dan satu kolom di HP. Keterangan di bawah tiap foto di layar lebar. Di HP, teks disembunyikan dan keterangan muncul dalam kotak detail saat foto diketuk. Tersembunyi selama belum ada foto. Foto founder tidak tampil di halaman Galeri dan Beranda. Uji: browser 1280 px dan 390 px, urutan tanggal, Galeri dan Beranda bebas kategori founder. |
| 4.6.8 (Galeri) | 26 Nov 2026 | **Galeri: kategori Perjalanan Founder** (`Kode.gs` `PORTO_KATEGORI` dan aplikasi Internal). Server berubah, jadi `Kode.gs` perlu ditempel ulang ke Apps Script lalu diterapkan ulang. Saat kategori ini dipilih di formulir Galeri, label kolom berubah menjadi **Keterangan foto** dan **Penjelasan perjalanan**. Tidak ada perubahan kolom data sheet Galeri. |
| Website 4.6.7 | 24 Nov 2026 | **Animasi website lebih halus** (`website-4.6.7.zip`, hanya frontend website). (1) Foto latar hero tidak lagi berganti mendadak dari latar terang ke gelap: lapisan foto + lapisan gelap memudar masuk 1,1 dtk (`kgmFoto`, skala 1,03→1, bukan Ken Burns 2,8 dtk 1,08×), warna teks ikut berganti 0,6 dtk, foto ditampilkan setelah `img.decode()` selesai, dan tidak dianimasikan ulang bila foto yang sama dipasang lagi. (2) Header: `backdrop-filter: blur` dihapus (berat saat digulir), header tidak lagi mengecil saat digulir (memicu hitung ulang tata letak), dan tidak meluncur ulang di setiap halaman. (3) Transisi antarhalaman (`@view-transition`) dihapus karena bertumpuk dengan animasi masuk. (4) Animasi muncul-saat-digulir 0,65 dtk / 16 px (dari 0,8 dtk / 20 px), jeda bertingkat 70 ms maks 4. (5) Denyut titik status lacak memakai transform/opacity (bukan box-shadow yang menggambar ulang terus). (6) Pindaian elemen baru digabung per frame (`requestAnimationFrame`). (7) Bila skrip terlambat, isi memudar masuk (tidak muncul mendadak). Uji: animasi 34/34, transisi foto hero 7/7 (CPU 4× lebih lambat, frame maks 33 ms). |
| 4.6.7 (Payroll) | 24 Nov 2026 | **Absensi: Payroll & slip gaji** — server SOP/Absensi **1.1.0**. Sheet baru `GajiKaryawan`, `Payroll`, `PayrollPeriode` (dibuat otomatis saat pertama dipakai, `paySheet_`); aturan potongan di Script Property `PAY_CFG`. Rumus `hitungGaji_` (server) = `hitungGaji` (frontend & demo): pokok + tunjangan + uang harian × hadir + tarif lembur × jam lembur DISETUJUI + tambahan − (potong telat per menit/kejadian bila dicentang) − (potong alpa proporsional/tetap bila dicentang) − potongan lain. Potongan telat/alpa bisa dimatikan per karyawan per periode (kelonggaran); BPJS/PPh 21 lewat **Potongan lain + Keterangan** manual; **Catatan internal** tidak tampil di slip. Alur DRAFT → DIAJUKAN (email Owner) → DISETUJUI (email HRD, slip tampil ke karyawan) → DIBAYAR; Owner/SA bisa **Kembalikan** dengan catatan ≥10 karakter. Hak: HRD & SA kelola, Owner hanya-baca + setujui; HRD tidak bisa mengubah gaji/baris payroll sendiri; perubahan data gaji dikirim ke email Owner; email payroll hanya berisi total. Hitung ulang mempertahankan isian manual. Aksi: `payGaji`, `payPeriode`, `paySlipSaya` (baca), `paySimpanGaji`, `paySimpanAturan`, `payHitung`, `paySimpanBaris`, `payAjukan`, `paySetujui`, `payKembalikan`, `payDibayar`; log `ABS_PAY_*`. Frontend (hanya di web Absensi, tidak ada di Internal): menu **Payroll**, **Data Gaji** (HRD/Owner/SA, di grup HRD), **Slip Gaji** (karyawan) + cetak/Simpan PDF A4. Uji: API 39/39, UI demo 25/25, integrasi UI↔server 6/6. Panduan HRD & Super Admin: 3 bab payroll; semua panduan: bagian Slip gaji. |
| 4.6.7 (Absensi) | 24 Nov 2026 | **Absensi: popup doa & pengingat sholat seperti Internal** — doa sebelum bekerja setelah login langsung (tombol Aamiin aktif setelah 4 dtk; tidak muncul saat masuk lewat token dari Internal/SOP), ucapan Alhamdulillah saat keluar sendiri (tidak saat sesi berakhir), pengingat waktu sholat wajib (layar diredupkan, tutup dengan OK, sekali per waktu per perangkat, jendela 20 menit, ditunda selama kamera absen/lembur terbuka). Jadwal dihitung di perangkat (Kemenag RI: Subuh 20°, Isya 18°, ihtiyat 2 menit) dari titik lokasi kantor pertama di pengaturan Absensi, zona waktu dari perangkat (fallback Jakarta/WIB). Kartu **Jadwal Sholat Hari Ini** + saklar pengingat (per perangkat, `kgabs:adzanOff`) di halaman Akun. Hanya `index.html` Absensi; server tidak berubah. Panduan divisi bagian Absensi diperbarui. |
| 4.6.7 (docs) | 24 Nov 2026 | **Panduan per divisi**: 6 PDF terpisah (Super Admin, Admin, Customer Service, Sales, Supir, HRD) langsung di `docs/`, termasuk bab baru Absensi harian, SOP, kata sandi, dan bab HRD (dashboard, persetujuan, data karyawan, koreksi, log) dengan tangkapan layar web Absensi. Tanpa perubahan kode. |
| 4.6.7 | 24 Nov 2026 | **Invoice: Kirim WhatsApp langsung** — `kirimPengingatWA(token, id)` mengirim pengingat tagihan lewat Fonnte (antrean + `kirimLangsung_`), memakai templat `waTemplate` (sama dengan pratinjau), event antrean `PENGINGAT_MANUAL`, jeda 2 menit per invoice (`PWA_<id>`), melaporkan hasil (terkirim / dicoba ulang / gagal via `statusAntrian_`) dan mencatat `PengingatTerakhir`. Frontend: tombol **Kirim WhatsApp** + dialog pratinjau di panel, tombol WA di tabel & daftar ringkas; wa.me tetap ada sebagai **Buka di WhatsApp (kirim manual)**. |
| 4.6.6 | 24 Nov 2026 | **WA langsung terkirim**: setelah konfirmasi order / ubah status, frontend memanggil `kirimAntreanSekarang` (tanpa menunggu, `kirimWaSegera()`), sehingga WA terkirim dalam hitungan detik (pemicu 1 menit tetap sebagai cadangan). `kirimKodeLacak` & `kirimUlangKode` juga mengirim langsung (`kirimLangsung_`). **Setiap perubahan status** kini dikabarkan: event baru `STATUS_DIBATALKAN` (pelanggan & penerima) dan `STATUS_DIJADWALKAN_ULANG`. Pesan bila WA mati kini menyebut penyebabnya (saklar mati / token kosong / nomor tidak valid). **Form order**: setelah terbit langsung dikosongkan untuk order berikutnya (cetak lewat toast atau Rekap Order). |
| 4.6.5 | 24 Nov 2026 | **Internal: Unduh PDF lebih andal** — unduhan otomatis kadang diblokir browser karena dipicu beberapa detik setelah klik (menunggu server); kini muncul bar "PDF siap" (`barPdfSiap`) dengan tombol **Simpan ke perangkat** (klik langsung, pasti diizinkan) + **Buka di Drive**; Laporan → PDF mendapat tombol serupa di toast. Backend: fungsi editor `izinkanAksesInternet` (memicu izin UrlFetch untuk Fonnte & sinkron Absensi). **Website: animasi halus & profesional**. Muncul-saat-digulir (`IntersectionObserver` + `MutationObserver`, status awal tersembunyi lewat CSS `html.anim` agar tanpa kedipan), pembuka hero bertahap, garis aksen eyebrow, foto latar mendekat pelan, header menipis saat digulir, hover kartu/tombol, hasil cek resi tergambar berurutan, dialog & menu HP memudar, perpindahan halaman `@view-transition`. Hanya `opacity`/`transform`. Mati otomatis untuk `prefers-reduced-motion`; failsafe `html.anim-off` 3 dtk bila `web.js` gagal dimuat. Zip website kini dinamai mengikuti versi Internal. |
| 4.6.4 | 23 Nov 2026 | **Kode lacak** per order (6 karakter, dikirim via WA Fonnte, tidak dicetak) menggantikan 4 digit HP untuk cek resi, ajukan keluhan & cek keluhan; tombol "Kirim ke WhatsApp" di website; staf Lihat/Kirim/Ganti kode, CS kirim tanpa melihat; event notifikasi `KODE_LACAK`, placeholder `{kode}`, template lama otomatis disesuaikan. **Batas lokasi akses** (geofence) per peran + pengecualian per pengguna, overlay kunci, data tidak disimpan di perangkat. Logout mencabut token. Panduan Bab 20–22 + PDF cara pasang Fonnte. Website 2.2.0. Termasuk semua perbaikan 4.6.3. |
| 4.6.3 | 22 Nov 2026 | **Audit keamanan sebelum rilis umum.** Formula injection di sheet ditutup (`tulisAman_`), NIK pengemudi selalu tersamar di data awal & cache perangkat, batas gagal global untuk lacak resi/cek keluhan, tautan uji bertoken tidak dicetak ke log, header keamanan Vercel (`vercel.json`: anti-clickjacking, nosniff, referrer, permissions). Server SOP/Absensi 1.0.1: akun nonaktif/diturunkan langsung tertolak walau token masih berlaku, idempotensi per pengguna, log aman dari rumus. Absensi: data perangkat dihapus saat keluar. |
| 4.6.2 | 21 Nov 2026 | **Kirim akun otomatis ke Data Karyawan Absensi**: akun baru/ubah/nonaktif/hapus di Internal ikut tercatat di Absensi (tanpa ID; HRD melengkapi ID & jadwal). Kartu Absensi di Integrasi: URL server `/exec`, saklar kirim otomatis, tombol "Kirim semua akun sekarang". Server SOP: aksi `sinkronKaryawanApp`, filter & banner **Perlu ID** di Data Karyawan. |
| 4.6.1 | 21 Nov 2026 | Keluhan: simpan **draf** (nomor langsung terbit), **no. resi wajib**, pencarian resi sebagian/nama pelanggan, penerima & pelaku tercatat otomatis (nama + peran), lencana menghitung draf, perbaikan nomor keluhan yang terlewat saat gagal simpan. Dokumentasi `docs/` mulai disertakan. |
| 4.6 | 20 Nov 2026 | Integrasi SOP & Absensi (login sekali, tab Pengaturan → Integrasi), peran **Supir**, tombol "Masuk & Absen", asuransi Kirim Mobil/Paket (premi di invoice, polis menyusul, kalimat tanpa asuransi), penomoran `KGM-…` + barcode, CRM SOP screenshot + cek SA, usulan perubahan data perusahaan oleh Sales, Sales tidak membuat surat, Galeri + watermark, info kapasitas Drive, menu "Absensi" di bawah sidebar. |
| Server SOP/Absensi | 21 Nov 2026 | Tooltip (?) pada centang Data Karyawan; status Sakit/Izin/Alpa hanya bisa diubah Super Admin. |
