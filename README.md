# analismarket-app

Layar pertama app native: **satu chart, satu bilah**. Expo + React Native +
TypeScript, jalan di **Expo Go** — tanpa EAS Build, tanpa Clerk, tanpa tab
bawah.

## Menjalankannya

```bash
cd ~/analismarket-app
npx expo start --tunnel
```

Lalu buka **Expo Go** di HP dan pindai QR yang muncul di terminal. Tunnel
dipakai supaya HP tidak perlu satu jaringan dengan mesin yang menjalankan
Metro. `@expo/ngrok` sudah terpasang sebagai devDependency, jadi tidak ada
pertanyaan "install globally?" di tengah jalan.

### WAJIB LOGIN DI KEDUA SISI

`npx expo login` di mesin Metro, **dan** akun yang sama di Expo Go. Tanpa itu
Expo Go menolak dengan *"There was a problem running the requested project —
You need to be signed in to Expo Go and Expo CLI"*, dan tunnelnya lahir
bernama `…-anonymous-…`.

Yang TIDAK menolong, dan sempat dicoba 18 Sep sampai memakan waktu:

- **Keluar dari akun di Expo Go** supaya "anonim ketemu anonim" — Expo Go
  menuntut login, bukan menerima ketiadaannya.
- **Melewati tunnel lewat IP publik VPS** (`REACT_NATIVE_PACKAGER_HOSTNAME=
  103.150.227.163 npx expo start`). Manifestnya memang terjangkau dari luar —
  terukur HTTP 200 dengan alamat bundel yang benar — tapi Expo Go tetap minta
  login. Jadi cara itu menukar satu syarat dengan risiko baru (Metro terbuka
  ke internet; `ufw` di VPS ini `inactive`) tanpa menyelesaikan apa pun.

Dan satu jebakan di layar errornya: tombol **"Try again"** mengulang URL yang
SAMA, jadi ia tidak akan pernah berhasil sesudah alamatnya diganti. Tekan
**"Go home"**, lalu masuk lagi lewat QR atau *Enter URL manually*.

## Pembagian tugasnya

```
chart  ← WebView  → https://analismarket.com/chart-embed?pair=XAU/USD&tf=<tf>
harga  ← React Native → GET /api/bacaan?pasar=XAU/USD&tf=<tf>, medan `harga`
```

Seluruh halaman embed cuma memakai tiga endpoint: `/api/bacaan` (lilin, pola,
dan chip ikut di jawaban yang sama — tidak ada `/api/lilin`, dan memintanya
dijawab 404), `/api/pasar`, dan `/api/harga-stream` untuk XAU/forex.

Harga **tidak** diambil dari dalam WebView. Kalau ia diambil dari sana, angka
di bilah atas baru muncul sesudah seluruh chart diunduh dan digambar, dan
kosong lagi tiap kali timeframe diganti.

Chart-nya bukan gambar baru: `/chart-embed` memuat komponen chart web apa
adanya — lapisan SVG zona, sumbu, dan chip harga ikut semuanya.

## Yang SENGAJA belum ada

- **Pemilih pasar.** Layar ini XAU/USD saja.
- **Umur harga.** Web mencetak "harga terakhir diketahui · N menit lalu" saat
  yang tampil bukan harga soket; bilah app belum.
- **m1/m5.** Emas berpenyedia berkuota; dua timeframe itu memang tidak
  ditawarkan di sini.

## Utang yang sudah diketahui

`/api/bacaan` mengirim 1.300 lilin — **68 KB mentah, 22,5 KB gzip** (terukur
18 Sep, XAU/USD h1) — dan bilah atas cuma memakai satu angka darinya. Pada
jeda 20 detik itu sekitar **4 MB per jam** kuota HP untuk satu medan.

Jedanya disamakan dengan `proxy_cache_valid 200 20s` di nginx, jadi ongkos
SERVER-nya nol; yang mahal kuota HP. Sebelum app ini dipakai orang banyak,
yang benar adalah endpoint harga kecil, bukan jeda yang lebih panjang.

## Sepuluh halaman

| # | halaman | sumber data |
|---|---|---|
| 1 | Pasar — 131 pasar, cari, saring jenis+kategori, urut volume | `/api/pasar` |
| 2 | Chart — WebView `/chart-embed`, tab timeframe per pasar | WebView |
| 3 | Bacaan — keputusan, arah, entry/SL/TP, RR bersih, biaya, konteks | `/api/bacaan` |
| 4 | Banding Mesin — kelima mesin bersebelahan | muatan yang sama |
| 5 | Syarat — syarat WAJIB, yang gagal dulu | muatan yang sama |
| 6 | Zona & Level | muatan yang sama |
| 7 | Kalender — jadwal berita 14 hari per hari WIB | `/api/jadwal-berita` |
| 8 | Belajar — tiga keadaan kartu + 16 istilah | statis |
| 9 | AM+ — isi paket, tanpa harga | statis |
| 10 | Lainnya — pilihan terakhir, dokumen, tentang | lokal |

Halaman 3–6 berdiri di atas SATU muatan `/api/bacaan`. Pindah mesin dan
membuka Banding tidak memanggil jaringan sama sekali.

## Kenapa ada antrean permintaan

`/api/bacaan`, `/api/pasar`, dan `/api/jadwal-berita` berbagi satu zona nginx
`1r/s burst=5` yang dikunci pada **alamat IP**. Operator seluler memakai
CGNAT, jadi banyak user berbagi satu alamat: app yang boros tidak cuma
memperlambat dirinya, ia membuat 429 untuk orang lain.

`src/data/antrian.ts` menjawabnya dengan empat lapis — antrean 1.100 ms,
single-flight per kunci, simpanan 20 detik (sama dengan `proxy_cache_valid`),
dan mundur bertahap yang menghormati `Retry-After`.

**Terukur** (`npm run ukur-laju`), jalur dingin buka-Pasar → ketuk → Chart →
Bacaan → Banding → Syarat → Zona → Kalender:

```
panggilan modul : 8
permintaan HTTP : 3
ditolak 429     : 0
jejak           : +0,12s /api/pasar · +3,42s /api/bacaan · +3,56s /api/jadwal-berita
```

Diuji-mutasi: single-flight dicabut → 4 permintaan, merah. Simpanan dicabut →
4 permintaan, merah.

## Penjaga

```bash
npm run periksa     # tsc + penjaga teks
npm run ukur-laju   # batas laju, butuh jaringan
```

`skrip/periksa-teks.mjs` menolak empat hal: kata arah diketik di kode, kata
kepatuhan, nama pemroses pembayaran web, dan tautan keluar. Ia memindai
dirinya sendiri — kata-katanya dirakit dari potongan — jadi tidak butuh
pengecualian. Keempatnya sudah diuji-mutasi dan keempatnya merah.

## Yang belum bisa dibangun, dan kenapa

`/api/saya/*` punya 15 fungsi; 13 menolak tanpa identitas Telegram. Jadi
pantauan, kabar otomatis, setelan akun, kredit, cek-banyak, dan berlangganan
dari app **tidak ada di sini** — bukan lupa. Layar Lainnya menyebutkannya
apa adanya, karena menyembunyikannya membuat orang mencari menu yang tidak
ada.
