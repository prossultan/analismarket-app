@AGENTS.md

## Jawaban jaringan tidak boleh hilang tanpa suara

`antrian.ts` dan `saya.ts` memisahkan sebab kegagalan — tidak terjangkau,
ditolak, jatah habis, sesi mati — dan menyiapkan satu kalimat untuk
masing-masing. Yang mahal bukan kalimat yang jelek, melainkan kalimat yang
DIBUANG: `if (j.ok) setD(j.isi)` tanpa cabang lain lulus TypeScript, lulus
lint, tidak pernah melempar, dan menghasilkan layar yang berbohong.

Tiga bentuknya hidup bersamaan sampai 19 Sep 2026:

| layar | gejalanya |
|---|---|
| `Home` | rangka memuat yang TIDAK PERNAH berhenti saat jaringan putus |
| `LayarKabar` | jadwal gagal diambil → "tidak ada berita" — artinya justru kebalikan dari keadaannya |
| `Akun` (6 layar) | seluruh sel "—" sambil tetap berkata "Tersambung" |

Ketiganya tanpa galat, jadi tanpa penemu. Sekarang:

- **Semua pembacaan lewat `useMuat`** (`src/data/muat.ts`), satu pintu yang
  memisahkan `memuat` / `ada` / `gagal` dan membawa `basi` untuk isi lama yang
  penyegaran terakhirnya gagal.
- **Sesi mati MENGOSONGKAN layar**, sebab lain mempertahankan isi dan
  menandainya basi. Alasannya di `muat.ts`: data yang tertinggal sesudah 401
  bukan lagi milik orang yang memegang HP-nya.
- **`basi` wajib DICETAK** lewat `<PitaBasi>`. Angka lama yang terlihat seperti
  angka baru adalah kegagalan paling mahal di app harga.
- Dijaga `skrip/periksa-jawaban.mjs`, uji-mutasi 7/7 merah.

Penjaganya menembak **pembacaan properti `.kalimat`**, bukan kata "kalimat"
atau "sebab" di sekitarnya. Versi pertama memakai kata dan langsung ditembus
uji-mutasi: mutasi yang mengembalikan bug aslinya kebetulan menulis
`const sebab = null;` — deklarasi yang tidak membaca apa pun — dan penjaganya
hijau. Kata bisa ditulis siapa saja di mana saja.

## Empat pasar teratas memang tidak punya logo

`ENA`, `WLD`, `CRCLB`, `MARSCOIN` tidak ada di `@web3icons/core` 4.0.55 maupun
4.0.56 (isinya didaftar dari tarball, 19 Sep), dan tidak ada di
`cryptocurrency-icons` 0.18.1 yang terbit ~2021. Web menampilkan lambang huruf
yang sama. **Jangan menuntut 20/20 di `skrip/uji-e2e.mts`** — itu ambang yang
mustahil dari sini, dan satu baris merah tetap akan diabaikan orang.

Yang dijaga sebagai gantinya, tiga penegasan yang saling menutup:
pasar di luar daftar kecuali wajib berlambang · daftar kecuali tidak boleh
memuat pasar yang SUDAH punya lambang (supaya daftarnya mati sendiri) ·
cakupan tidak boleh turun dari 16/20 (supaya kegagalan tidak bisa disembunyikan
dengan memperlebar daftar kecualinya).

## Ukur dari BUNDEL yang benar-benar dilayani

Sesi 19 Sep kehilangan waktu panjang pada kesimpulan yang salah — "perbaikannya
tidak bekerja" — padahal yang diukur bundel LAMA: sebuah server dari sesi
sebelumnya masih memegang port 4191, cwd-nya `~/analismarket-app`, dan namanya
`proxy.mjs` sehingga tidak cocok dengan pola `pgrep -f "_proksi-app"` yang
dipakai untuk membunuh sisa proses.

Sebelum menyimpulkan apa pun dari harness, cocokkan hash bundelnya:

```bash
curl -s http://127.0.0.1:4191/ | grep -o 'index-[a-f0-9]*\.js'
ls /tmp/web-app/_expo/static/js/web/
```

Beda hash = pengukurannya tidak sah. Dan `pkill -f` di sini WAJIB mengecualikan
`$$`/`$PPID`, atau ia membunuh shell-nya sendiri (exit 144) — sudah terjadi dua
kali.

## Kontrol yang diam saat ditekan

Lebih buruk daripada kontrol yang tidak ada: orang menekannya berulang kali,
menyimpulkan app-nya rusak, lalu berhenti memercayai kontrol LAIN di layar
yang sama. Tiga di antaranya hidup sampai 19 Sep 2026 — saringan pantauan
yang tidak menyaring (dan menjanjikan dua keadaan yang tidak ada di data),
saklar induk kabar otomatis, dan saklar per-timeframe.

Yang ketiga juga salah MODEL: server menyimpan pasangan **(timeframe, mesin)**
dan `setelKabarOtomatis` menuntut ketiganya. Satu saklar per timeframe memaksa
app memilihkan mesinnya sendiri — persis "mengganti pilihan user diam-diam".
Sekarang satu baris per pasangan.

Tidak ada `{ semua: true }` di server, cuma `{ semua: false }`. Jadi saklar
induknya dicabut dan diganti tindakan bernama "Matikan semua": saklar dua arah
untuk sesuatu yang cuma bisa satu arah adalah kebohongan bentuk.

Dijaga `skrip/periksa-kontrol.mjs` — `<Chip>` dan `<Saklar>` wajib punya
penangan, kecuali yang ditandai `lencana`. Tandanya harus DIKETIK sadar, dan
ia juga mencabut peran tombol dari pembaca layar. Uji-mutasi 4/4 merah.

## Harga disalin, dan salinannya dijaga

App menampilkan harga AnalisMarket+ tapi tidak bisa mengambilnya lewat
jaringan: `/api/saya/plus` ada di balik gerbang sesi, jadi orang yang belum
menyambungkan Telegram — persis orang yang bertanya "berapa" — tidak bisa
membacanya, dan tidak ada endpoint harga publik.

Sampai 19 Sep 2026 layar AM+ mengetik **Rp 99.000** sementara yang ditagihkan
**Rp 50.000**. Hampir dua kali lipat, di halaman yang satu-satunya tugasnya
menjawab "berapa" — dan berkas data sebelahnya justru menulis "harganya
sengaja tidak ikut". Tidak ada uji yang bisa merah, karena tidak ada satu pun
tempat yang memegang angkanya.

Sekarang `PAKET_PLUS` di `src/data/amplus.ts`, dan `skrip/periksa-harga.mjs`
mencocokkannya dengan `PAKET_PLUS` di repo bot. Ia **gagal keras** kalau repo
bot tidak terjangkau — lulus karena tidak menemukan sumbernya adalah kelas
kegagalan yang sudah lima kali terjadi di repo sebelah. Setel `REPO_BOT` kalau
lokasinya lain. Uji-mutasi 4/4 merah, termasuk kasus sumber hilang.

## Izin Android datang dari pustaka, bukan dari kode kita

Tidak ada satu baris pun di repo ini yang menyebut izin, dan sampai
19 Sep 2026 app ini tetap meminta EMPAT yang tidak pernah dipakainya —
`SYSTEM_ALERT_WINDOW` ("tampil di atas aplikasi lain", izin sensitif yang
diperiksa ketat Play Store), `READ/WRITE_EXTERNAL_STORAGE`, dan `VIBRATE`.
Semuanya warisan penggabungan manifes React Native.

Diblokir lewat `android.blockedPermissions` di `app.json`. Yang boleh ikut
cuma `INTERNET`, dan itu ditegakkan `skrip/periksa-izin.mjs`.

Penjaganya menembak **manifes yang dihasilkan prebuild**, bukan daftar
`blockedPermissions`. Daftar itu cuma menjawab "apa yang sudah kita tahu";
yang berbahaya adalah izin KELIMA yang disuntikkan pustaka baru besok, dan
itu hanya terlihat dari manifesnya. Lambat (~1 menit), jadi tidak ikut
`npm run periksa` — ia bagian dari `npm run periksa-rilis`.

## Nomor versi dipegang EAS, jangan disimpan dua kali

`eas.json` memakai `appVersionSource: "remote"`, jadi `versionCode` dan
`buildNumber` di `app.json` DIABAIKAN saat build — tapi tetap tercetak ke
manifest lewat expo-constants. Dua angka untuk satu hal, dan yang terbaca app
justru yang basi. Keduanya dicabut dari `app.json`.

## Panah `›` adalah JANJI

`Butir` dulu menggambar `›` tanpa syarat, jadi tiap baris mati berjanji ada
layar di baliknya. Di Pengaturan ada tiga sekaligus — "Tema ›", "Bahasa ›",
"Zona waktu ›" — yang ditekan dan diam. Ditemukan dari POTRET, bukan dari
kode: di kode ketiganya baris biasa, dan panahnya datang dari komponennya.

Diperbaiki di komponennya, bukan di tiap pemanggil: "bisa ditekan" dan
"terlihat bisa ditekan" sekarang satu hal yang sama. `accessibilityRole`
ikut — baris mati berhenti diumumkan sebagai tombol.

Penjaganya di `periksa-kontrol.mjs`, dan ia butuh TIGA percobaan sebelum bisa
merah. Dua kegagalan pertamanya layak diingat karena bentuknya umum:

1. memeriksa `/bisaDitekan \?/` di SELURUH berkas — sudah dipenuhi baris
   `accessibilityRole={bisaDitekan ? …}` di atasnya, jadi panah tanpa syarat
   tetap hijau;
2. mencari `{kanan ?? (` tanpa jangkar — menemukan milik `BarisPasar`, blok
   yang sama sekali lain, jadi penjaganya memeriksa KOMPONEN YANG SALAH.

Keduanya cuma ketahuan dari uji-mutasi. Penjaga yang belum pernah dituntut
merah belum diketahui menjaga apa pun.

## `biayaPorsi` SUDAH dalam persen

Di bot, `bulatkan.ts` menghitungnya `(biayaBps / stopBps) * 100`. Server
mengatakannya sendiri di kalimat syaratnya:

```
biayaPorsi = 8.64
kalimat    = "Biaya 9,0 bps vs jarak SL 104,2 bps — 9% dari risiko"
```

App sempat mengalikannya 100 LAGI di dua tempat, jadi setup sehat berbiaya
8,6% tercetak **"Biaya 864% risiko"** — angka mustahil di kartu yang justru
harus membantu orang memutuskan. Bilahnya ikut rusak: ambangnya ditulis 0,5
dan 1, jadi apa pun di atas 1% terisi penuh dan merah, dan bilah yang selalu
merah berhenti memberi tahu apa pun.

**Web TIDAK punya bug ini** — ia membagi 100 saat menerima
(`src/data/bacaan.ts:893` dan `:994`), jadi tipenya di dalam memang pecahan.
App memakai nilai mentah API langsung, dan di situlah bedanya. Jangan
menyalin pola web tanpa menyalin normalisasinya.

Satuannya sekarang dikunci di `src/data/tampil.ts` (`biayaPersen`,
`biayaLebar`, `BIAYA_WAJAR_PERSEN`) dan `skrip/periksa-satuan.mjs` melarang
`biayaPorsi` disentuh aritmetika di luar sana. Uji-mutasi 2/2 merah.

## Tombol utama layar pertama tidak boleh mati

`LayarSambutan` berdiri DI LUAR navigator, jadi tombolnya tidak bisa
menavigasi sendiri — dan karena itu ia dibiarkan `mati`. Akibatnya tombol
TERBESAR di layar yang pertama dilihat semua orang tidak melakukan apa-apa,
dan satu-satunya jalan ke depan tersisa tautan kecil "Lanjut tanpa masuk ›"
di bawah.

Ia memang tidak boleh menautkan ke luar (aturan produk), tapi ia bisa
membuka layar Sambungkan — tempat langkahnya dijelaskan dan tempelannya
diterima. Caranya bukan menavigasi melainkan MEMBERI TAHU tumpukan harus
dibuka di mana: `mulaiDiSambung` menyetel `initialRouteName` tab `lainnya`
dan tumpukannya sekaligus.

`periksa-kontrol.mjs` sekarang ikut menembak `<Tombol>`. `mati` tetap sah —
ia digambar redup, mengumumkan dirinya nonaktif ke pembaca layar, dan
labelnya menjelaskan kenapa ("belum tersedia"). Yang dilarang tombol yang
terlihat HIDUP tapi diam.

## Periksa izin dari APK, bukan dari pemindaian string

Pemindaian string mentah atas `AndroidManifest.xml` biner MELAPORKAN
`android.permission.DUMP` yang sebenarnya tidak pernah dideklarasikan — ia
cuma nama yang tersimpan di kolam string sebuah pustaka. Yang benar mengurai
struktur AXML-nya dan membaca tag `<uses-permission>`.

Hasil sah dari APK build 19 Sep (`id.analismarket.app`):

```
android.permission.INTERNET
id.analismarket.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION   <- privat, dari AndroidX
```

## Penjaga sumber dan penjaga bundel menjawab pertanyaan yang BERBEDA

Penjaga sumber: "apakah kode yang saya lihat benar."
Penjaga bundel: "apakah yang terpasang di HP orang benar."

Keduanya berbeda pada hari yang sama, 19 Sep 2026: `periksa-harga.mjs` hijau
sesudah harga dibetulkan di satu layar, sementara bundel jadi masih memuat
harga lama TIGA kali — dari `Akun.tsx`, berkas yang penjaga itu tidak pernah
lihat karena ia cuma memindai satu berkas. Yang menemukannya `grep` atas
BUNDEL, sesudah harganya sudah dinyatakan beres.

`skrip/periksa-bundel.mjs` membangun bundel android lalu memeriksanya.
Dua sisi, dan sisi kedua ada karena sisi pertama bisa lulus dengan tidak
menemukan apa-apa:

- **larangan** — nol harga rupiah yang DIKETIK, nol kata terlarang;
- **keharusan** — tiap `hargaRp` di `PAKET_PLUS` wajib ADA di bundel, karena
  "nol literal" juga yang dijawab bundel yang harganya hilang sama sekali.

Satu jebakan yang sudah memerahkannya sekali secara palsu: **minifier menulis
`50000` sebagai `5e4`** dan `135000` sebagai `135e3`. Mencari digit polos saja
melaporkan seluruh harga hilang, dan yang salah penjaganya.

## Bundel di dalam APK rilis adalah bytecode Hermes

`assets/index.android.bundle` di APK EAS bukan JavaScript teks — ia bytecode
Hermes (magic `c6 1f bc 03`). String-nya masih terbaca di tabel string, tapi
**angkanya tersimpan biner**. Mencari `"50000"` di sana melaporkan seluruh
harga hilang, dan yang salah pencariannya, bukan bundelnya.

Yang sah diperiksa dari APK:

| bisa | tidak bisa |
|---|---|
| harga yang DIKETIK sebagai string | nilai angka konstanta |
| kata terlarang | |
| `<uses-permission>` (urai AXML, jangan pindai string) | |

Nilai angkanya diperiksa dari bundel JS `export:embed`
(`skrip/periksa-bundel.mjs`) dan dari layar yang benar-benar dirender.

## Yang cuma ketahuan di HP, bukan di harness web (uji pemilik 19 Sep)

| gejala di HP | sebab | tempat |
|---|---|---|
| "AM+ tidak terbawa" sesudah menyambung | tipe `akun.langganan` dideklarasikan objek `{aktif,…}`; server mengirim STRING `'plus'\|'gratis'`, jadi `langganan.aktif` selalu `undefined` | `sesi.ts` |
| Lainnya tetap "belum tersambung" | keterangannya DIKETIK, tidak membaca sesi | `Lainnya.tsx` |
| "tombol tidak berfungsi" | (1) ketukan pertama saat keyboard terbuka cuma menutup keyboard — `keyboardShouldPersistTaps` tidak ada; (2) tombol "Jalankan" Cek banyak `onPress={undefined}`; (3) `cekBanyak()` mengirim `{pasar}` padahal server menuntut `{pair:[],tf:[],mesin:[]}` | `Akun.tsx`, `saya.ts` |
| kaca tidak terlihat sama sekali | `backgroundColor` dipasang DI ATAS `BlurView` — di Android ia dicat menutupi hasil blur; intensitas 34 ≈ separuh mockup | `Kaca.tsx`, `token.ts` |
| tersendat | WebView `key={url}` membangun ulang chart tiap ganti tf; 131 baris pasar dirender sekaligus; layar tab lain ikut render | `ChartTertanam.tsx`, `LembarPasar.tsx`, `App.tsx` (`enableFreeze`) |

Harness web tidak bisa melihat satu pun dari ini: tidak ada keyboard, blur
CSS selalu jalan, dan potret cuma memotret jalur bahagia. **Potret dari HP
pemilik adalah bukti yang lebih tinggi daripada seluruh harness.**

## 402 punya dua arti

`perlu-telegram` (akun belum ditautkan ke bot — mis. masuk lewat Google) dan
`perlu-plus` (butuh langganan) sama-sama datang sebagai 402. Dulu keduanya
dipetakan `jenis: 'plus'`, jadi orang yang baru masuk disuruh berlangganan
padahal yang kurang tautannya. Sekarang `jenis: 'telegram'`, dibedakan dari
`badan.galat`.

## Masuk dengan Google — Clerk, instance yang sama dengan web

`@clerk/clerk-expo` + SecureStore. Kuncinya PUBLISHABLE (`clerk-kunci.ts`),
sama dengan `VITE_CLERK_PUBLISHABLE_KEY` di web. Sesi Clerk berumur pendek dan
diperbarui Clerk sendiri, jadi TIDAK disimpan di `sesi.ts` — `tokenSesi()`
memintanya tiap kali. `JembatanClerk` di App.tsx meneruskan keadaan Clerk ke
`sesi.ts`; layar cukup memakai `useSesi()`.

Sesi mini (Telegram) MENANG atas sesi Clerk: Telegram yang membuka fitur bot.
Pengguna Google tanpa Telegram melihat ajakan "Tautkan Telegram" di Profil.

**Syarat di Dashboard Clerk yang tidak bisa dipasang dari kode:** skema
`analismarket://` harus ada di daftar putih Native Applications. Kalau belum,
Google selesai di peramban tapi app tidak pernah dipanggil kembali — terlihat
persis seperti tombol yang tidak bekerja.

## Bandingkan dengan mockup lewat POTRET, bukan ingatan

`~/analismarket-web/skrip/_potret-mockup.mts` memotret tiap `.hp` di
`opendesign/mockups/kaca/index.html`; lembar banding (mockup | app) dirakit
dengan PIL ke `scratchpad/banding/`. Dua belas lembar, 24 pasang layar.
Yang mockup punya tapi API tidak (dan karena itu SENGAJA tidak dibuat):
feed Kabar per-peristiwa dengan "belum dibaca", statistik "Analisa dibaca /
Hari beruntun", "Terkirim 7 hari terakhir", jatah harian 412/800 per pasar.
Semuanya butuh endpoint baru di bot.

## Izin dan skema dari PUSTAKA cuma terlihat di APK, bukan di prebuild

`periksa-izin.mjs` (prebuild) berkata "1 izin ikut". APK yang jadi memuat
`USE_BIOMETRIC`, `USE_FINGERPRINT`, `ACCESS_NETWORK_STATE`, install-referrer,
DAN skema intent `solana-wallet://` — semuanya terseret paket Clerk
(`androidx.biometric` lewat expo-secure-store; `@solana-mobile/*` lewat
@clerk/clerk-expo). Penggabungan manifes pustaka terjadi di Gradle, sesudah
prebuild. Jadi:

- `skrip/periksa-apk.mjs <apk>` adalah penjaga yang MENENTUKAN — ia mengurai
  AXML di dalam APK hasil EAS. Jalankan pada tiap artefak sebelum dibagikan.
- Modul Solana dikeluarkan dari penautan (`expo.autolinking.exclude` +
  `react-native.config.js`); izin biometrik & referrer diblokir di app.json.
  `ACCESS_NETWORK_STATE` dibiarkan: tingkat normal, tidak ditampilkan ke
  pengguna, dipakai pustaka memeriksa sambungan.

## Tanpa tamu — keputusan pemilik 19 Sep

App tampil HANYA kalau ada sesi (Telegram lewat token bot, atau Google lewat
Clerk). Gerbangnya satu tempat: `Isi()` di App.tsx membaca `useSesi()`; sesi
`null` → `LayarSambutan`; sesi datang → app; sesi hilang (keluar, 401,
kedaluwarsa) → kembali ke layar masuk dengan sendirinya.

Dua akibat yang disengaja:

- Gerbang menunggu `sudahSiapSesi()` — simpanan sesi DAN Clerk sama-sama
  terbaca — sebelum memutuskan. Memutuskan lebih awal membuat pelanggan
  melihat layar masuk sekejap tiap kali membuka app.
- Formulir Sambungkan Telegram pindah ke komponen `FormulirSambung` dan
  dipakai di DUA rumah: layar Sambungkan (dalam app, untuk pengguna Google
  yang mau menautkan Telegram) dan layar masuk (di luar navigator). Orang
  tanpa sesi tidak bisa mencapai layar dalam app, jadi formulirnya yang
  datang.

Harness: tidak ada lagi "Lanjut tanpa masuk" yang bisa diketuk. Tiap harness
memakai `skrip/_sesi-tiruan.mts` (web) — sesi mini tiruan di localStorage +
`/api/saya**` dijawab ringkasan tetap. Tanpa itu, `/api/saya` sungguhan
menjawab 401, sesi dihapus, dan harness terlempar ke layar masuk di tengah
jalan.

## Home = pusat menu, tanpa pasar (19 Sep)

Pemilik: "pasar jangan taruh di home" lalu mengirim referensi (kisi ikon 4
kolom, bilah tab pil melayang). Home sekarang: kartu akun ringkas → kisi 12
ikon (semua pintu) → Pintasan → Bantuan & dokumen → "Istilah hari ini".
Satu permintaan jaringan (`/api/saya`); pasar dan bacaan milik tab Pasar.

"Jangan sampai ada ruang kosong" — yang mengisi harus ISI, bukan pendorong
`flex: 1`. Kartu istilah (16 istilah Belajar, berganti per hari) yang mengisi.

Bilah tab PIL: `TombolTab` membaca keadaan aktif dari `useNavigationState`,
BUKAN dari `accessibilityState.selected` — prop itu kosong di bottom-tabs v7
saat runtime, dan potretnya tanpa satu pun tab tersorot. Jarak aman lewat
`bottom: bawah + ANGKAT_BILAH`; `periksa-kaca.mjs` menerima bentuk ini.

Ikon app: `assets/icon.png` dkk. sempat IKON BAWAAN TEMPLATE EXPO (chevron
biru) sampai 19 Sep. Sekarang semua diturunkan dari `logo-512.png` web —
satu mark di ikon, adaptive, monochrome, splash, kepala, dan Tentang.
Mockup: `opendesign/mockups/kepala-2026`, `home-2026`.

## Home akhir (19 Sep, tiga putaran umpan balik pemilik)

Urutan: kartu akun → kisi 12 ikon → BENTO sparkline (BTC besar; XAU/USD,
ETH, SOL kecil — mengikuti referensi Pintu yang dikirim pemilik) → kartu AM+
("jualan": harga dari `PAKET_PLUS`, tombol ke tab PLUS+; pelanggan melihat
status, bukan dijual ulang). Tanpa Pintasan, Bantuan, dan Istilah.

Sparkline dari `/api/bacaan` h1, 48 lilin terakhir (`lilin[].tutup`), lewat
antrean yang sama dengan tab Pasar — cache 20 detik, jadi kalau tab Pasar
sudah memuatnya, kartunya gratis. Empat kartu = ±300 KB; diterima.

Dua jebakan tata letak yang ketahuan dari potret, bukan dari kode: kartu
kecil tanpa `flex: 1, minWidth: 0` meluap keluar layar; baris yang dipaksa
sama tinggi (`flex: 1` di baris bawah) membuat sparkline menimpa harga.
Sekarang kartu kecil ditentukan isinya; kartu besar yang meregang mengikuti.

## Kredit/poin sudah TIDAK berlaku — jangan ditampilkan

`KREDIT_AKTIF` di bot bawaan `false` dan tidak disetel di `.env` produksi
(dicek 19 Sep): poin tidak pernah ditagih. API `/api/saya` dan
`/api/saya/kredit` masih MENGIRIM `poin` — itu sisa, bukan fitur. App
sempat menampilkannya di Home, Profil, Pantauan, Cek banyak, dan satu layar
Kredit penuh, karena bentuk API disalin tanpa memeriksa saklarnya. Semua
dicabut atas permintaan pemilik. Kalau suatu hari kredit dinyalakan lagi,
mulai dari saklarnya: API perlu mengirim `kreditAktif`, bukan app menebak.

## Status langganan dibaca dari SATU sumber di setiap permukaan

19 Sep pemilik menemukan: Home bilang "AM+ aktif", tab PLUS+ dua ketukan
kemudian masih mengajak berlangganan — layar PLUS+ statis, tidak membaca
sesi maupun `/api/saya`. Kelas yang sama ada di tab Kabar ("menunggu
Telegram · Sambungkan" tampil tanpa syarat). Dua permukaan yang berbeda
pendapat lebih buruk daripada satu yang salah: orang tidak tahu mana yang
benar. Tiap permukaan yang menyebut langganan atau tautan Telegram WAJIB
membaca `useSesi()` + `ambilRingkas()`, bukan mengetik keadaannya.

## Sesi ikut ke SEMUA permintaan, termasuk chart tertanam (19 Sep)

`antrian.ts` (bacaan, pasar) tidak pernah membawa Bearer, jadi m5 emas/forex
milik pelanggan AM+ dijawab 402 di app — server menjawab 200 untuk sesi yang
sama. Chart tertanam (WebView) juga anonim; diperbaiki dengan menyuntik token
mini ke `localStorage['am_sesi_mini']` (kunci yang dibaca `miniapp.ts` web)
lewat `injectedJavaScriptBeforeContentLoaded`. Dibuktikan lewat Playwright
pada `chart-embed` XAU m5: 402 → 200. Ini kali KETIGA bug "sesi tidak ikut"
muncul di produk ini (Mini App 13 Sep, app 19 Sep dua kali) — tiap permukaan
baru yang memanggil `/api/bacaan` wajib diuji dengan sesi AM+ sungguhan.
Cara mencetak sesi uji tanpa Telegram dan tanpa menulis: `terbitkanSesiMini`
fungsi murni; lihat riwayat commit ini.

## Kontrak galat akun adalah field `galat`, bukan kode status (19 Sep)

Server menjawab `perlu-telegram` sebagai **409** dan `perlu-plus` sebagai
**402** (`PERLU_TELEGRAM` / `PERLU_PLUS` di `src/lib/api-saya.ts` bot). Versi
pertama `panggil()` cuma memeriksa `perlu-telegram` di dalam cabang 402, jadi
cabang `jenis: 'telegram'` mati sejak lahir dan akun Google jatuh ke `'lain'`.
Tidak ketahuan karena server ikut mengirim `pesan` yang benar — kalimat yang
tampil tidak salah, cuma jenisnya. Sekarang `galat` diperiksa lebih dulu, apa
pun kode statusnya. Kalau menambah jenis galat baru, baca kodenya DARI berkas
bot itu, jangan menebak dari nama galatnya.

## Splash ditahan sampai gerbang sesi memutuskan (19 Sep)

Root merender `null` sampai setelan (AsyncStorage) DAN Clerk (≤2,5 dtk
fallback) terbaca. Tanpa `preventAutoHideAsync`, splash turun begitu root
mount — jadi tiap buka dingin ada layar gelap tanpa merek, dan itu terasa
sebagai "kurang smooth" walau tidak ada satu pun galat. Sekarang splash
ditahan di `App.tsx` dan diturunkan saat `siap`, paling lambat 6 detik.
Konfigurasi splash memakai plugin `expo-splash-screen` (`imageWidth: 200`),
bukan kunci `expo.splash` lama. Harness potret web TIDAK bisa melihat ini
(splash native tidak ada di web) — buktinya cuma di HP.

## Belum ada jalur hapus akun di dalam app (temuan 19 Sep, keputusan pemilik)

Play Console mewajibkan app yang membuat akun (masuk Google lewat Clerk =
membuat akun) menyediakan cara menghapus akun DI DALAM app dan tautan web
untuk permintaan hapus. Yang ada sekarang: kalimat di Kebijakan Privasi
"minta lewat bot". Itu belum memenuhi formulir Data safety. Menghapus akun
berarti menulis (menghapus) data produksi — keputusan pemilik, bukan sesi
otonom. Belum dikerjakan; jangan dianggap selesai karena tidak ada uji merah.

## Notifikasi push ke app (19 Sep) — dan kenapa ia belum menyala

Saluran kedua di samping Telegram, BUKAN pengganti: ~300 pengguna bot tidak
memasang app, dan mencabut Telegram mematikan kabar untuk mereka semua.
Keputusan per orang ada di satu pintu, `pilihSaluran` di `src/lib/push.ts`
repo bot — dipanggil kedua jalur kabar supaya jalur ketiga yang ditambahkan
besok ikut tunduk tanpa disuruh.

Izin notifikasi TIDAK diminta saat app pertama dibuka. Dialog izin Android
cuma muncul SEKALI seumur pemasangan; sesudah ditolak, satu-satunya jalan
adalah Setelan sistem. Meminta sebelum orang tahu kabar itu apa membuang
satu-satunya kesempatan itu. Izin diminta dari saklar di Pengaturan.

`POST_NOTIFICATIONS` sekarang ikut ke APK, dan itu disengaja — dua penjaga
(`periksa-izin`, `periksa-apk`) memuatnya di daftar putih beserta alasannya.
Penjaga izin memeriksa DUA ARAH: izin yang hilang dari manifes juga merah,
jadi plugin yang berhenti menambahkannya akan ketahuan.

Push tidak memuat entry/SL/TP maupun arah. Notifikasi dibaca di layar kunci,
sering berjam-jam sesudah tiba, tanpa caption dan tanpa layar penjelas di
sebelahnya — angka rencana yang dibaca terlambat adalah angka yang salah.
Dijaga `src/lib/keputusan-push.test.ts` di repo bot, empat mutasi merah.

BELUM MENYALA, dan tiga hal menahannya, semuanya keputusan pemilik:
migrasi `0050_perangkat_push` belum dijalankan (migrasi produksi bukan
wewenang sesi mana pun), `pilihSaluran` masih menjawab `['telegram']`, dan
kunci FCM V1 baru diunggah ke EAS hari ini sehingga belum pernah diuji
mengirim ke perangkat sungguhan.

## Dua penjaga izin melihat DUA permukaan yang berbeda (19 Sep)

`periksa-izin` membaca manifes hasil **prebuild**; `periksa-apk` membaca
**APK sungguhan**. Keduanya tidak melihat daftar yang sama, dan itu bukan
kelemahan salah satunya: izin yang disumbang manifes AAR pustaka baru
digabung Gradle saat BUILD, jadi `com.google.android.c2dm.permission.RECEIVE`
dan `WAKE_LOCK` TIDAK ADA di manifes prebuild tapi ADA di APK. Menaruhnya di
daftar putih `periksa-izin` membuat penjaga itu merah selamanya atas sesuatu
yang benar. Tiap izin baru harus ditanya: ia lahir di prebuild atau di build?

`expo-notifications` menarik **19 izin** yang tidak diminta. Tujuh belas di
antaranya dari ShortcutBadger — angka di ikon app — termasuk
`WRITE_SETTINGS` untuk launcher Huawei dan Oppo. App ini memasang
`shouldSetBadge: false`, jadi tidak satu pun dipakai; semuanya diblokir.
Yang ketiga kalinya pustaka menyelundupkan izin ke APK di proyek ini
(Clerk/Solana, expo-secure-store biometrik, sekarang ShortcutBadger), dan
ketiganya ditemukan penjaga, bukan mata.

## APK 86 MB: 38 MB-nya arsitektur yang tidak dipakai HP mana pun (19 Sep)

Rincian APK pratinjau pertama: `lib/x86` 19,4 MB + `lib/x86_64` 18,7 MB —
keduanya untuk emulator Intel, dan tidak satu pun HP Android memakainya.
arm64-v8a 18,2 MB dan armeabi-v7a 12,7 MB yang benar-benar dipakai.

Unduhan 86 MB lewat jaringan seluler adalah penyebab nyata orang gagal
memasang app, dan separuhnya tidak pernah dijalankan siapa pun. Dipotong
lewat `gradleCommand` di `eas.json`:
`-PreactNativeArchitectures=arm64-v8a,armeabi-v7a`.

Kalau suatu saat perlu menjalankan app di emulator x86, JANGAN mencabut baris
ini — pakai profil `development`, yang memang untuk itu.
