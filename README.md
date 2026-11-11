# 📦 Input Data Pemesanan (Static Web App + Google Sheets)

Aplikasi web statis yang berjalan di **GitHub Pages**, dengan **Google Apps Script** sebagai backend
untuk menulis/baca data ke **Google Sheets**.

Struktur:
- `index.html`  — tampilan form + tabel CRUD
- `style.css`   — gaya (CSS)
- `app.js`      — logika klien (fetch ke Apps Script)
- `Code.gs`     — skrip backend Google Apps Script

---

## Bagaimana caranya bekerja

1. Frontend (GitHub Pages) adalah **hanya HTML/CSS/JS**. Karena itu tidak bisa langsung menulis ke
   Google Sheets (CORS + autentikasi).
2. Backend adalah **Google Apps Script Web App** yang terbaca/tertulis ke spreadsheet.
3. `app.js` memanggil Apps Script lewat `fetch()` (CORS-friendly) dan menampilkan/harap hasilnya.

Alur kirim data:
```
Browser (GitHub Pages)
   │  POST { JSON }
   ▼
Apps Script Web App  ──▶  Google Sheet
   │  JSON (baca/kenal)
   ▼
Browser
```

---

## 1. Siapkan Google Sheet + Apps Script

### A. Copy data sheet (jika mau mulai dari awal)
Buka spreadsheet kamu, simpan dulu lewati langkah ini kalau sudah punya header sesuai:
```
PELANGGAN | TANGGAL PESAN | NAMA BARANG | QTY | SATUAN | STATUS KIRIM | TANGGAL KIRIM | KETERANGAN
```
Kolom **wajib** ada. Urutan bebas, tapi nama kolom di `Code.gs` (`COLUMNS`) wajib sesuai.

### B. Buat project Apps Script
1. Buka: https://script.google.com/home
2. Klik **+ New project**.
3. Ganti nama projek (kanan atas) menjadi `Input Data Pemesanan`.
4. Hapus skrip default, salin isi `Code.gs` ke dalam editor (kiri).
5. **Ganti `SHEET_ID`** di atas dengan ID spreadsheet kamu:
   ```
   https://docs.google.com/spreadsheets/d/1snL-7pQ8o3XxBnRQ148XDgAx3Za4lQyv9gH-6QjogQg
                  ↑↑↑  ini (di posisi yang ditandai)
   ```
   Kopikan bagian yang berwarna/UFO (contoh: `1snL-...`). Jangan sertakan
   `/edit`, `/usp=sharing`, atau `d/` sisa.

6. **Simpan** (Ctrl+S / Cmd+S).

### C. Deploy sebagai Web App
1. Menu **Deploy → New deployment**.
2. Klik **⚙️ (pencerkatan)** di sebelah type "Web app".
3. Konfigurasi:
   - **Description**: `Input Data Pemesanan`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**, izinkan akses (izin) jika diminta.
5. **Salin URL** yang muncul. URL ini bentuknya:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
   ⚠️ URL-nya **satu kali** setelah dicopy. Jika salah, deploy ulang.

---

## 2. Siapkan GitHub Pages

1. Buat repository baru di GitHub (contoh: `input-pemesanan`).
2. Upload file-file berikut ke repo tersebut:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md` (opsional)
   - `Code.gs` (opsional, untuk referensi)
3. Setelah commit, aktifkan **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` / `gh-pages`, folder `/ (root)`
4. Tunggu sampai URL terpublik: `https://<username>.github.io/input-pemesanan/`

---

## 3. Hubungkan frontend ke backend

Buka `app.js`, cari bagian **CONFIG** dan ganti:

```js
const CONFIG = {
  scriptUrl: "https://script.google.com/macros/s/AKfycbx.../exec", // <-- paste URL dari step 1.c
  sheetName: "Sheet1",
  columns: [ /* ... */ ]
};
```

---

## 4. Uji

Buka URL GitHub Pages. Isi form:
- **Pemesan**, **Nama Barang**, **Qty** wajib diisi.
- Pilih **Status Kirim** (BELUM / SIAP / KIRIM / SELESAI).
- Tanggal muncul otomatis hari ini.

Klik **Simpan** → data masuk ke Google Sheet. Tabel di bawah akan memuat data dari Sheet.

---

## Fitur

| Aksi | Cara dipakai |
|------|--------------|
| **Simpan** | Isi form → klik Simpan |
| **Edit**   | Klik tombol Edit → form terisi → klik Update |
| **Hapus**  | Klik tombol Hapus + konfirmasi |
| **Tabel**  | Data diurutkan dari tanggal pesan terbaru |

> 💡 Klik **Reset** untuk kosongkan form.

---

## Katakan apa saja

- Tanggal disimpan dalam format ISO (`YYYY-MM-DD`), sesuai input `<input type="date">`.
- `Qty` wajib berupa angka ≥ 1.
- Form validasi: Pemesan, Nama Barang, Qty wajib diisi.
- Kesalahan jaringan/otorisasi ditampilkan di bagian **alert** (biru/kuning/merah).

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "Gagal memuat data" | Cek URL `scriptUrl` di `app.js`; pastikan SPA masih aktif. |
| "Failed to add row: Permission Denied" | Ulangi deploy Web App, pastikan **Who has access: Anyone** dan spreadsheet dibagikan. |
| Data tidak muncul | **Sometimes** sheet has empty rows di atas header; script mencari header otomatis. |
| CORS error | Pastikan tidak menggunakan `file://`; gunakan hosting web (GitHub Pages). |

---

## File di repo

- `index.html` — UI
- `style.css` — CSS
- `app.js`    — klien
- `Code.gs`   — backend (Apps Script)
