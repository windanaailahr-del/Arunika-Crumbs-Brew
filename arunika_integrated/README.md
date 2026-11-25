# Arunika Crumbs & Brew — Website Terintegrasi

## Cara menjalankan
1. Ekstrak folder ini.
2. Buka folder `arunika_integrated` di VS Code (File → Open Folder).
3. Pasang ekstensi **Live Server** jika belum ada.
4. Klik kanan `index.html` → **Open with Live Server**.
5. Gunakan navigasi website untuk berpindah halaman.

Alternatif: buka `index.html` langsung di browser.

## Halaman utama
- `index.html` — Beranda
- `menu.html` — Menu utama
- `menu-non-coffee.html`, `menu-main-course.html`, `menu-camilan.html`, `menu-bakery.html`, `menu-paket-hemat.html` — Kategori menu
- `layanan.html` — Layanan & fasilitas
- `reservasi.html` — Reservasi
- `lokasi.html` — Lokasi (peta, alamat, jam, petunjuk arah, parkir)
- `kontak.html` — Kanal kontak resmi, formulir WhatsApp, FAQ (10 pertanyaan), quote penutup
- `keranjang.html` — Keranjang
- `pembayaran.html` — Ringkasan/pembayaran

Versi desain awal tetap tersedia dengan akhiran `-versi-awal.html`.

## Catatan penting
- Desain asli setiap halaman dipertahankan; tautan navigasi internal yang sebelumnya `#` diarahkan ke halaman yang sesuai.
- `integration.js` menambahkan keranjang demo berbasis `localStorage` dan ringkasan keranjang di halaman keranjang/pembayaran. Ini belum terhubung ke backend/database.
- Pembayaran QRIS memakai gambar QRIS resmi yang Anda sediakan; verifikasi pembayaran tetap manual oleh staf.
- Formulir reservasi masih memerlukan pengujian dan konfigurasi nomor WhatsApp/backend sesuai operasional bisnis.
- Halaman kebijakan privasi dan syarat layanan adalah placeholder yang harus diisi sebelum publikasi.
- Beberapa gambar menggunakan URL eksternal, sehingga memerlukan koneksi internet.

## Arsitektur skrip bersama (v2)
- `menu-data.js` — satu-satunya sumber data menu (nama, deskripsi, harga, gambar, kategori). Dipakai Beranda, Menu, Reservasi, keranjang.
- `i18n.js` — kamus ID & EN + runtime (`data-i18n`, `data-i18n-attr`, `I18N.t()`). Pilihan bahasa disimpan di `localStorage` (`arunika_lang`).
- `app.js` — mode gelap, keranjang (`localStorage` `arunika_cart_v1`, hanya menyimpan `{id, qty}`), toast, badge navbar, render menu.
- `reservasi.js` — form 3 input, validasi jam 24 jam, pre-order, pratinjau & tautan WhatsApp.
- `theme.css` — token warna terang/gelap (variabel `--c-*`) dan komponen bersama.
- `integration.js` — panel keranjang aktif di `keranjang.html` & `pembayaran.html`.
Menambah menu: cukup edit `menu-data.js` (dan `menu.desc.<id>` di `i18n.js` untuk terjemahan deskripsi).


## Revisi terbaru
- **Informasi Pelayanan & Alergen** (halaman Menu + 5 kategori): 8 card dihapus; judul dan paragraf utama dipertahankan. Tombol keranjang hijau tetap aktif.
- **Keranjang** (`keranjang.html`, `pembayaran.html`): hanya "Keranjang aktif" (tambah, kurang, hapus produk, total + PB1). Bagian Metode Pembayaran tetap ada di `pembayaran.html`.
- **Reservasi**: jumlah tamu kini kolom angka bebas (minimal 1, tanpa batas atas) dan terhubung ke pratinjau serta pesan WhatsApp.
- **WhatsApp**: seluruh nomor menjadi 085175474311 (tautan `6285175474311`). Nomor diatur di satu tempat: `WA_NUMBER` di `app.js` (dan `reservasi.js` memakainya). Tombol WhatsApp otomatis membawa isi pesanan/reservasi.
- **Pembayaran** (`pembayaran.js`): QRIS, Kasir/Tunai, WhatsApp, Unduh Kode QR, Upload Bukti Bayar (JPG/JPEG/PNG/WEBP, pratinjau), nominal mengikuti keranjang.

### WAJIB: pasang gambar QRIS resmi
Simpan gambar QRIS resmi Arunika sebagai `images/qris-arunika.png` (alternatif: `.jpg`, `.jpeg`, `.webp`). Gambar ini dipakai untuk tampilan QRIS dan tombol Unduh Kode QR. Selama file belum ada, halaman menampilkan pemberitahuan, bukan QRIS palsu.
Verifikasi pembayaran masih manual oleh staf (tidak ada backend); bukti bayar hanya dipratinjau di browser dan dikirim lewat WhatsApp.

## Revisi (20 Nov 2026)
- **Pembayaran**: perbaikan penumpukan layout (tag `</div>` berlebih) saat memilih Kasir/Tunai atau WhatsApp; panel WhatsApp kini menjelaskan kapan dipakai; seluruh teks halaman + footer mengikuti bahasa ID/EN.
- **Favorit**: `home: true` di `menu-data.js` adalah satu-satunya sumber menu favorit (bintang ★ di Menu, kartu Beranda, dan filter "Varian Favorit" + jumlah). Tautan `menu.html#favorit` langsung membuka filter favorit.

## Revisi (20 Nov 2026, ke-2)
- **Reservasi**: isian form (nama, WhatsApp, tanggal, jam, tamu) disimpan otomatis di `localStorage` (24 jam) sehingga tidak hilang saat pindah halaman; dihapus setelah tombol kirim WhatsApp ditekan. Menu pre-order sudah tersimpan di keranjang.
- **Footer** sama di semua halaman (mengikuti halaman Kontak). **Navigasi**: Lokasi + Kontak digabung menjadi `lokasi-kontak.html` (`lokasi.html` dan `kontak.html` hanya mengalihkan); FAQ dipisah ke `faq.html`.
- **Status header**: "Buka" saat jam buka (08.00–22.00 WIB), "Tutup · buka 08.00" di luar jam itu.
- **Pembayaran**: metode WhatsApp diganti **Transfer BRI** (rekening fiktif 0345-01-087654-50-9, ada tombol salin). Setelah konfirmasi tampil **struk/bukti pembelian** (cetak/simpan PDF).
- **Keranjang**: pilihan **Dine-in** (wajib pilih nomor meja 1–20) atau **Take away** (hanya ambil di outlet; antar lewat aplikasi GoFood/GrabFood/ShopeeFood). Logika di `pesanan.js`.
