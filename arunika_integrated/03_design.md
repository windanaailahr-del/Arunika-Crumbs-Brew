# 03 · Design — Arunika Crumbs & Brew

> **Status:** panduan awal. Yang berasal dari profil ditandai **[profil]**; yang merupakan usulan desain ditandai **[usulan]**.

## 1. Esensi brand
- **Slogan [profil]:** Coffee, Comfort, and Little Moments.
- **Pesan brand [profil]:** Setiap kunjungan memiliki cerita, setiap sajian membawa kenyamanan.
- **Makna nama [profil]:** Arunika = cahaya pagi/awal baru; Crumbs = remah roti, kehangatan, detail; Brew = peracikan yang teliti.
- **Kepribadian [profil]:** nyaman, hangat, santai, tetap profesional.

## 2. Warna
**[profil]** warna utama: cream, cokelat kopi, beige, hijau zaitun.

**[usulan]** nilai heksadesimal (silakan disesuaikan dengan materi cetak/interior yang ada):
| Peran | Nama | Hex |
|---|---|---|
| Latar utama | Cream | `#F6EEDC` |
| Latar sekunder | Beige | `#E6D5B8` |
| Teks utama/judul | Cokelat kopi | `#4A2F1E` |
| Aksen/tombol | Hijau zaitun | `#6B7A3A` |
| Aksen hangat (sorotan promo) | Karamel | `#B9793B` |

Periksa kontras: teks cokelat kopi di atas cream untuk isi; teks putih/cream di atas hijau zaitun untuk tombol.

## 3. Tipografi [usulan]
- Judul: serif hangat dengan karakter (mis. Fraunces atau Playfair Display).
- Isi: sans-serif bersih dan mudah dibaca di ponsel (mis. DM Sans atau Inter).
- Harga: angka tabular agar rata.
- Sediakan fallback (`Georgia`, `system-ui`).

## 4. Gaya visual
- **[profil]** minimalis modern, elemen kayu, tanaman, cahaya hangat/alami.
- **[usulan]** fotografi natural light, sudut dekat produk, tekstur kayu dan remah roti; ilustrasi garis halus (biji kopi, croissant, daun) sebagai ornamen kecil; hindari tampilan terlalu ramai.
- **[profil]** gelas, piring, dan kemasan memakai identitas brand.

## 5. Nada bahasa
Ramah, hangat, tidak bertele-tele; sapaan santai namun sopan. Contoh arah:
- "Kopi pagi, remah hangat, dan waktu untukmu."  ← contoh gaya, bukan salinan resmi
- Hindari klaim berlebihan ("terbaik di Surabaya") karena tidak ada dasarnya di profil.
Aturan lengkap: `05-Rules`.

## 6. Struktur halaman (sitemap) [usulan, mengacu fitur PRD]
```
/                Beranda
/menu            Menu (tab: Coffee · Non-Coffee · Main Course · Camilan · Bakery · Paket)
/promo           Promo dan program (R2)
/layanan         Dine-in, takeaway, meeting space, event, catering
/reservasi       Reservasi meja (R1), acara (R2)
/lokasi          Alamat, peta, jam buka, parkir
/tentang         Cerita brand, konsep kafe
/kontak          WhatsApp, Instagram, TikTok
```

## 7. Wireframe teks
**Beranda:** hero (foto suasana + slogan + tombol "Lihat Menu" dan "Chat WhatsApp") → 5 menu ★ → strip "Cocok untuk": belajar/bekerja/berkumpul/keluarga → jam buka dan lokasi → footer kontak.

**Menu:** pilihan kategori (tab bisa digeser di ponsel) → kartu item: nama, deskripsi singkat, harga, ★ jika favorit → catatan pajak dan alergen di bawah.

**Reservasi:** tanggal, waktu, jumlah orang, nama → tombol "Kirim lewat WhatsApp" → teks: "Reservasi terkonfirmasi setelah staf membalas."

## 8. Komponen UI [usulan]
Tombol utama (hijau zaitun), tombol sekunder (garis cokelat), kartu menu, lencana ★ "Favorit", lencana "Habis", tab kategori, banner promo (dengan periode berlaku), bar jam buka (buka/tutup saat ini).

## 9. Aksesibilitas
Kontras sesuai WCAG AA, ukuran sentuh ≥ 44 px, teks alternatif untuk foto, jangan mengandalkan warna saja untuk ★/habis.

## 10. Aset yang dibutuhkan
Logo (belum ada di profil), foto produk (60 item, prioritaskan 5 favorit), foto interior, ikon sosial, favicon.
