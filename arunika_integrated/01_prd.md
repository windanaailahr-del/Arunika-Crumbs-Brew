# 01 · PRD — Kehadiran Digital Arunika Crumbs & Brew

> **Status:** draf. Fakta usaha berasal dari `00-Rancangan-Awal`. Ruang lingkup produk (website/pemesanan) adalah **turunan** dari profil: profil menyebut "layanan digital terintegrasi", "sistem kasir dan website", dan pemesanan lewat WhatsApp, tetapi tidak merinci fiturnya. Hal yang belum pasti ada di `06-Prompt-dan-Catatan/06-prompt-dan-catatan.md` (bagian Pertanyaan Terbuka).

## 1. Latar dan tujuan
Profil menyebut keunggulan "layanan digital terintegrasi untuk informasi menu, jam buka, lokasi, kontak, dan pemesanan" dan alokasi anggaran Rp5.000.000 untuk sistem kasir dan website. Produk ini memberi pelanggan satu tempat resmi untuk melihat menu, menemukan lokasi, dan menghubungi kafe.

**Tujuan**
1. Pelanggan menemukan menu, harga, jam buka, dan lokasi dalam hitungan detik.
2. Mengarahkan pelanggan ke WhatsApp Business untuk pemesanan dan reservasi.
3. Mendukung promosi dan program loyalitas.
4. Memperkuat identitas brand (Instagram/TikTok @arunika.crumbs).

**Bukan tujuan (fase 1):** pembayaran online sendiri, aplikasi mobile, integrasi penuh dengan platform pesan-antar.

## 2. Pengguna
| Persona | Dasar (target pasar profil) | Kebutuhan utama |
|---|---|---|
| Mahasiswa/pelajar | Mahasiswa dan pelajar | Harga, paket hemat (Student Combo), Wi-Fi, jam buka |
| Pekerja/profesional | Pekerja dan profesional | Work-friendly corner, stopkontak, menu kopi |
| Komunitas/kelompok | Komunitas dan pertemanan | Reservasi meja/acara, paket kelompok |
| Keluarga/umum | Keluarga dan pelanggan umum | Menu beragam, lokasi, parkir |
| Staf (admin) | Admin & Marketing, Manager | Memperbarui menu, harga, promo, jam |

## 3. Fitur
Prioritas: **P1** wajib peluncuran, **P2** setelah stabil, **P3** pengembangan.

| ID | Fitur | Prioritas | Sumber profil |
|---|---|---|---|
| F1 | Beranda: slogan, pesan brand, jam buka, tombol WhatsApp | P1 | 1, 4, 25 |
| F2 | Menu digital per kategori (Coffee, Non-Coffee, Main Course, Camilan, Bakery) dengan deskripsi dan harga | P1 | 9 |
| F3 | Penanda ★ favorit/rekomendasi | P1 | 9 |
| F4 | Paket hemat dan bundling (7 paket) | P1 | 9F |
| F5 | Catatan menu: pajak, alergen, ketersediaan | P1 | 9 |
| F6 | Lokasi: alamat, tautan Google Maps, petunjuk | P1 | 6 |
| F7 | Kontak: WhatsApp, Instagram, TikTok | P1 | 25 |
| F8 | Fasilitas dan layanan (dine-in, takeaway, meeting space, event, catering) | P1 | 10, 11 |
| F9 | Formulir/tautan reservasi meja → pesan WhatsApp terisi (tanggal, waktu, jumlah orang) | P1 | 12 |
| F10 | Permintaan reservasi acara dan catering (jenis acara, peserta, durasi, kebutuhan makanan) | P2 | 12 |
| F11 | Halaman promo (Student Deal, Coffee of the Month, Seasonal Menu, Group Package, Birthday Treat) | P2 | 16 |
| F12 | Informasi program loyalitas | P2 | 17 |
| F13 | Tautan ke platform pesan-antar | P2 | 10 |
| F14 | Panel admin: kelola menu, harga, promo, jam buka | P2 | 14 |
| F15 | Pemesanan daring dengan keranjang | P3 | 10, 15 |
| F16 | Poin loyalitas digital | P3 | 17 |

## 4. Kebutuhan fungsional ringkas
- **Menu:** dapat difilter per kategori; menampilkan nama, deskripsi, harga (Rp), penanda ★; item dapat ditandai "habis".
- **Harga:** selalu disertai catatan "belum termasuk pajak".
- **Reservasi:** tidak dianggap terkonfirmasi sampai staf mengonfirmasi (profil bagian 12). Tampilan harus menyatakan ini.
- **Jam buka:** Senin–Minggu 08.00–22.00 WIB; mendukung penutupan khusus.
- **Konten promo:** wajib memuat periode, produk yang memenuhi syarat, dan batas penggunaan.

## 5. Kebutuhan nonfungsional
- Responsif, terutama seluler (mayoritas pelanggan kafe mengakses dari ponsel; asumsi).
- Dimuat cepat dan ramah koneksi seluler.
- Bahasa Indonesia sebagai bahasa utama.
- Privasi: data pelanggan terbatas (profil bagian 17); tidak ada akun wajib pada P1.
- Aksesibilitas: kontras warna memadai, teks alternatif untuk gambar.

## 6. Metrik keberhasilan
Mengacu pada indikator profil bagian 24:
| Metrik | Cara ukur |
|---|---|
| Pesanan/reservasi dari kanal digital | Jumlah klik tombol WhatsApp dan pesan masuk |
| Pertumbuhan kanal sosial | Pengikut dan interaksi @arunika.crumbs |
| Kunjungan halaman menu | Statistik halaman |
| Ulasan dan keluhan | Google Business Profile, DM |

Target numerik **belum ditetapkan** pemilik.

## 7. Risiko dan ketergantungan
- Harga/menu berubah → data harus dikelola di satu tempat (lihat `02-Architecture`).
- Kebijakan pembatalan, uang muka, minimum pembelian belum dirumuskan.
- Aset foto produk dan interior belum tersedia di profil.
- Kapasitas tempat dan jumlah meja belum tercatat.

## 8. Tahapan
| Rilis | Isi | Selaras tahap profil |
|---|---|---|
| R1 | F1–F9 | Tahap 1 (bulan 0–3): sebelum grand opening |
| R2 | F10–F14 | Tahap 2 (bulan 4–12) |
| R3 | F15–F16 | Tahap 3 (tahun ke-2) |
