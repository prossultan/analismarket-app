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

## Push butuh DUA kredensial Firebase, dua arah berbeda (19 Sep)

Diunggah ke EAS: **service account key** — surat kuasa supaya Expo boleh
MENGIRIM atas nama app. Rahasia, tidak pernah masuk repo.

Ikut di dalam APK: **`google-services.json`** — yang memberi tahu app
*dirinya siapa* di mata Firebase, supaya Android bisa MENDAFTARKANNYA ke FCM
dan menerbitkan token. Bukan rahasia; ia memang bisa dibaca siapa pun yang
membongkar APK, jadi ia masuk repo.

Tanpa yang kedua, `getExpoPushTokenAsync` gagal, token tidak pernah lahir,
dan saklar notifikasi balik mati tanpa app maupun server melakukan kesalahan.
Gejalanya menyesatkan karena sisi server sudah benar sepenuhnya.

Cara memeriksanya dari APK tanpa memasang: `google_app_id` di
`resources.arsc` harus TERISI (berbentuk `1:<angka>:android:<hex>`). Nama
kolomnya selalu ada — dibawa SDK Firebase — jadi keberadaan NAMA bukan bukti;
yang dibaca harus NILAINYA.

JANGAN menjangkar regexnya di awal baris. `resources.arsc` biner, dan
`strings` menyambung nilainya di tengah baris, jadi `grep -E "^1:[0-9]+:"`
menjawab NOL untuk APK yang sebenarnya benar. Pemeriksaan pertama gue persis
begitu dan melaporkan build yang sehat sebagai rusak — penjaga yang tidak
pernah bisa HIJAU sama merusaknya dengan penjaga yang tidak pernah bisa
merah. Pakai `grep -oE "1:[0-9]{6,}:android:[0-9a-f]+"`.

## Keterbacaan tidak boleh bergantung pada blur (19 Sep)

`expo-blur` di Android boleh GAGAL total tanpa satu pun galat — dan saat ia
gagal, yang tersisa cuma warna latar kaca. Pada `rgba(26,24,21,0.44)` itu
berarti 56% isi di baliknya tembus, dan di HP pemilik hasilnya: judul
"Profil" terbaca menimpa kartu akun, kalimat kaki tertimpa bilah tab, kartu
AM+ tembus lewat bilah. Tiga "bug tampilan" yang tampak terpisah, satu sebab.

Sekarang kepekatan kaca BERBEDA per platform: iOS tetap 0,44 (di sana blur
selalu ada, dan menaikkannya membuat kaca jadi tirai), Android 0,88/0,94.
Blur di Android jadi penyedap, bukan penopang.

Aturannya yang lebih umum, dan berlaku untuk efek apa pun sesudah ini:
**kalau sebuah efek boleh gagal diam-diam, keadaan tanpa efek itu harus tetap
layak pakai** — bukan sekadar "tidak crash". Dan keadaan itu harus DILIHAT,
bukan dibayangkan; harness potret web memakai cabang non-iOS, jadi ia
memperlihatkan persis apa yang dilihat pengguna Android saat blur mati.

Cadangan nama juga diperbaiki di putaran yang sama: akun Telegram boleh tidak
punya nama tampilan, dan itu SAH. Avatar tidak lagi mencetak '?' dan sapaan
tidak lagi berbunyi "Halo" menggantung — keduanya terbaca seperti app yang
kehilangan data, padahal tidak ada yang hilang.

## Gerak (20 Sep) — aturan yang dipakai, dan yang sengaja TIDAK dianimasikan

Fondasi: Reanimated 4 + react-native-worklets + gesture-handler, semua lewat
`npx expo install`. Token gerak satu sumber di `src/gaya/gerak.ts` — kurva,
durasi, pegas — nilainya SAMA dengan web (`--ease-out`, `--ease-lembar`).

Yang dianimasikan, dan tingkatnya menurut skill `animate-expo`:
- **Tekan** (puluhan kali sehari → nyaris tak terasa): skala 0,97 / 120 ms
  lewat transisi CSS Reanimated di `Tekan.tsx`. Tanpa worklet. Satu pintu.
- **Lembar** (sesekali → animasi penuh): nilai bersama di UI thread, menutup
  dari KECEPATAN bukan cuma jarak, kecepatan jari diteruskan ke pegas,
  hambatan karet ke atas. Gestur cuma di KEPALA lembar — isinya berisi daftar
  yang digulir, dan dua gestur vertikal di tempat yang sama saling berebut.
- **Saklar**: transform, bukan margin (margin memicu layout tiap frame).
- **Isi menggantikan rangka**: memudar 180 ms, opacity saja.

Yang SENGAJA tidak dianimasikan:
- **Pindah tab.** Tab itu setara, bukan bertingkat; menggeser antar-tab
  menyiratkan kedalaman yang tidak ada, dan orang membayarnya puluhan kali
  sehari. Yang menyilang cuma latar pil, 120 ms.
- **Transisi antar-layar.** Ikut bawaan native stack; dibangun ulang di JS
  selalu lebih buruk.
- **Haptics.** `VIBRATE` sengaja diblokir di manifes; umpan balik visual
  harus berdiri sendiri karena haptics mati di banyak HP Android.

Tiga jebakan tipe yang memakan waktu:
1. `StyleSheet.create` MENOLAK properti transisi Reanimated. Gaya bertransisi
   ditulis sebagai objek `satisfies GayaGerak` (tipe dari `Animated.View`).
2. `transitionTimingFunction` bukan string CSS — pakai `cubicBezier()`.
3. `maxHeight: '88%'` di dalam `Animated.View` tanpa batas = tanpa batas.
   Persentase butuh induk berbatas; batasnya dipasang di pembungkus yang
   dianimasikan, bukan di Kaca. Terlihat di potret sebagai lembar yang
   melebar ke atas layar — bukan dari kode.

Nuansa gerak TIDAK bisa dinilai dari potret web: pegas, momentum, dan
interupsi cuma terasa di build rilis di HP paling lambat yang didukung.

## Tema terang (20 Sep) — cara kerjanya, dan jebakan yang menghabiskan waktu

`StyleSheet.create` dievaluasi saat modul dimuat, jadi warna di dalamnya
beku. Jalan keluarnya BUKAN hook di 27 berkas: `gayaTema((W) => StyleSheet
.create({...}))` di `src/gaya/tema.ts` — gaya dibangun per tema, malas, di-
cache, dan dikembalikan lewat Proxy. Komponen tidak tahu apa-apa soal tema;
yang merender ulang seluruh pohon adalah `key={tema}` di NavigationContainer,
dengan keadaan navigasi disimpan/dipulihkan supaya layar tidak hilang.

`W` dan `KACA` adalah Proxy HIDUP: aman di JSX (dibaca saat render), TIDAK
aman di `StyleSheet.create` polos dan di konstanta modul (`OPSI_KEPALA` sempat
begitu — jadi fungsi `opsiKepala()`).

Palet terang paletnya sendiri, bukan pembalikan (lihat token.ts). Tiga aturan:
- Emas #C9A961 tetap untuk ISIAN. Sebagai TEKS pakai `plusTeks` (#8A6B26 di
  terang; 1,9:1 kalau memakai isiannya). Angka besar AM+: `plusTerang`.
- `rgba(255,255,255,a)` dilarang diketik; pakai `W.tinta(a)` — putih di
  gelap, hampir-hitam di terang. Regex mengganti 30+ literal sekaligus.
- Chart TETAP gelap: kanvas web chart-embed belum bertema.

Jebakan skrip yang benar-benar terjadi: (1) memotong blok `W` dengan `};`
padahal terminatornya `} as const;` — token.ts terpotong sampai ANGKA;
(2) skrip pengganti `useHeaderHeight()` ikut mengganti definisi cadangannya
sendiri → rekursi, Home putih. Keduanya ketahuan dari tsc/harness, bukan
dari skripnya.

## Kotak masuk (20 Sep) — tab Kabar menjadi catatan yang tidak hilang

Tab Kabar dulu berisi bacaan mesin + kalender — bukan kabar. Sekarang kotak
masuk: empat jenis (pantauan · otomatis · sistem · promo), per hari, baris
pantauan = satu ketukan ke chart. Sumbernya `/api/saya/kabar`; server mencatat
baris di PINTU YANG SAMA dengan pengiriman, apa pun salurannya, jadi push yang
hilang di jalan tetap punya catatan.

Lencana belum-dibaca "realtime" TANPA polling (`src/data/kotakMasuk.ts`):
satu angka bersama untuk Home, tab, dan layar; disegarkan saat push TIBA
(listener notifikasi), saat app kembali ke depan, dan saat kotak masuk
sendiri bertindak. Ditambah tiap /api/saya yang memang sudah dipanggil Home
(`kabarBelumDibaca` ikut di sana — nol permintaan tambahan).

Jebakan harness: `sesiTiruan` mendaftarkan rute `/api/saya**` — rute yang
didaftarkan SESUDAHNYA yang menang. Mock kotak masuk harus dipasang sesudah
`sesiTiruan(p, false)`, lalu reload sendiri. Sempat menghasilkan "Belum ada
kabar" yang terlihat seperti bug app.

## Siap toko (20 Sep) — yang ditambahkan sesudah audit ujung-ke-ujung

Skor audit 8,3/10 dengan dua penghalang toko: jalur hapus akun dan AAB.
Keduanya sekarang ada. Yang tidak terbaca dari kode:

- **Hapus akun tiga pintu, satu fungsi.** App (Profil → Hapus akun), web
  `/hapus-akun` (syarat Google Play: tautan di luar app), dan bot
  `/hapus_akun`. Semuanya memanggil `hapusSemuaData` di repo bot; app cuma
  mengirim `{ yakin: true }` ke `/api/saya/hapus` lalu membuang sesinya.
  Jangan menambah pintu keempat dengan daftar tabelnya sendiri.
- **Lambang dibuat, bukan diketik.** `node skrip/siapkan-lambang.mjs`
  membaca SVG hasil `siapkan-logo-pasar.ts` di repo web (yang membaca
  registri pasar hidup), merender PNG 96 px lewat resvg, dan menulis ulang
  peta `require` di `LambangPasar.tsx`. Berkas PNG yang tidak ada di peta
  wajib dibuang: `periksa-lambang.mjs` menuntut peta sejajar dengan folder.
  Tiga koin teratas (BANK, PROVE, ZAMA) memang tidak ada di paket ikon mana
  pun — tercatat di `TANPA_LOGO_HULU` `uji-e2e.mts`, diperiksa dari daftar
  berkas paketnya, bukan diduga.
- **Tema terang: lambang duduk di cakram, huruf pengganti berona.** Sembilan
  lambang hampir putih (luminansi > 0,8) hilang di latar krem tanpa cakram.
  Rona huruf diturunkan dari nama simbol (`ronaSimbol`) supaya BANK selalu
  sama warnanya di semua layar.
- **Chart ikut tema** lewat `?tema=terang` ke chart-embed; token `chart`
  tema terang = latar krem yang sama supaya WebView tidak berkilat hitam.
- **Layar berbayar untuk akun gratis = kartu ajakan, bukan galat.**
  `useAkun` meneruskan `jenis` kegagalan; `jenis === 'plus'` menggambar
  `KartuButuhPlus`. Mencocokkan kalimat server adalah cara yang pecah
  begitu kalimatnya diubah.
- **Tanggal berakhir dari `plusBerakhirPada`**, bukan `sekarang + sisaHari`:
  dua layar yang menghitung sendiri sempat beda satu hari.
- **AAB untuk Play** dari tombol Run workflow dengan profil `produksi`;
  push ke `main` tetap membuat APK pratinjau. Daftar syarat toko dan isi
  formulir privasi: `docs/toko.md`.

## Build Play diam soal harga — satu saklar, bukan dua cabang (20 Sep)

Kebijakan pembayaran Google Play: app yang membuka fitur berbayar di dalam
dirinya wajib memakai penagihan Play, dan DILARANG menyebut harga atau
mengarahkan orang ke jalur beli di luar app. AnalisMarket+ ditagih lewat bot
Telegram, jadi build Play tidak boleh menyebut Rp 50.000 maupun "/plus ke
@analismarketbot". Build tautan unduhan tidak tunduk aturan itu dan tetap
menyebut keduanya.

- Saklarnya `TOKO_PLAY` di `src/data/amplus.ts`, dari `EXPO_PUBLIC_TOKO=play`
  yang dipasang profil `produksi` di `eas.json`. Profil `pratinjau` sengaja
  TIDAK memasangnya.
- `hargaPlus()` adalah SATU-SATUNYA tempat angka harga boleh lahir; ia
  mengembalikan `null` di build Play, dan `null` berarti barisnya tidak
  dicetak sama sekali. Bukan "—", dan bukan kalimat pengganti yang
  menjelaskan ke mana harus membeli — kalimat begitu persis yang dilarang.
- Layar Berlangganan menyusut jadi layar STATUS di build Play: harga, cara
  bayar, rincian, dan tombol ke bot semuanya hilang.
- Dijaga `skrip/periksa-toko.mjs`: `rupiah(` cuma boleh dipanggil di dua
  berkas, kalimat pengarah cuma boleh hidup di berkas yang menyebut
  `TOKO_PLAY`, dan `eas.json` produksi wajib memasang envnya. Dua mutasi
  merah: env dicabut, dan harga dicetak dari layar lain.
- Bukti env benar-benar sampai ke bundel: di keluaran build Play,
  `hargaPlus` terkompilasi jadi `function(){return null}`. Kalimat lamanya
  masih ADA sebagai string di bundel — cabangnya tidak dibuang penyusun —
  tapi tidak pernah dirender. Yang ditinjau Play app yang berjalan.

## Kait di bawah early return menjatuhkan app (20 Sep)

Layar Chart crash di HP begitu tab Pasar dibuka. Sebabnya satu baris:
`const temaChart = useTema()` ditaruh di bawah `if (pasar === null) return`.
Render pertama daftar pasar belum ada, kaitnya dilewati; render kedua daftar
pasar masuk, kaitnya ikut, dan React menjatuhkan app.

Yang membuatnya lolos sampai ke HP layak diingat:

- **Typecheck dan tujuh penjaga sumber hijau.** Tidak ada satu pun yang
  bertanya soal urutan kait.
- **Di web gejalanya cuma layar kosong**, dan harness melaporkannya sebagai
  `tab Pasar tidak ada` — terbaca seperti masalah harness, dan memang saya
  baca begitu lalu saya lewati. Pesan harness yang ambigu antara "app mati"
  dan "harness salah jalan" adalah pesan yang akan disalahartikan lagi.

Penjaganya `skrip/periksa-kait.mjs`, dan penjaga itu sendiri GAGAL DUA KALI
sebelum benar — dua-duanya bentuk "lulus tanpa memeriksa apa pun":

1. Kedalaman dihitung dari semua kurung, jadi `return` di dalam
   `if (...) { ... }` terbaca kedalaman 1 dan tidak pernah dianggap early
   return. Nol temuan.
2. Badan fungsi diambil dari `{` pertama sesudah nama — padahal hampir tiap
   komponen di sini menerima props yang didestrukturisasi, jadi yang terambil
   kurawal PARAMETER. Nol temuan lagi.

Sesudah benar ia menemukan tiga: satu di Chart, dua di Home yang sudah ada
sebelumnya (`useBelumDibaca` dan `useEffect` di bawah early return `gagal`) —
artinya Home meledak tiap kali `/api/saya` gagal, dan tidak ada yang tahu.

## Bukti di Android sungguhan, bukan di web (21 Sep)

"Masih crash" sesudah perbaikan didorong. Setengah jam terbuang membuktikan
bahwa ketiga saluran yang bisa dipasang pemilik masih memuat build lama —
lewat perbandingan ukuran byte, karena app cuma menulis "v1.0.0". Dua
jawaban permanen:

- **Cap build di layar.** `src/data/versi.ts`: versi (app.json), kode build
  (`expo-application`, versionCode native), dan komit (`EXPO_PUBLIC_KOMIT`
  dari `github.sha`, disuntik kedua workflow). Tampil di Lainnya dan Tentang.
  "Build mana yang kamu jalankan" dijawab dari layar, bukan ditebak.
- **Emulator Android di GitHub Actions** (`.github/workflows/uji-android.yml`,
  `skrip/uji-emulator.sh`). Server produksi tidak punya KVM; runner GitHub
  punya. APK profil `uji` dipasang ke emulator API 34, tab Pasar dicari dari
  POHON UI (`uiautomator dump`, bukan koordinat tebakan), diketuk, dan
  prosesnya harus tetap hidup — persis titik crash 20 Sep. Merah kalau
  proses mati, kalau chart tidak terisi, atau kalau logcat memuat FATAL.

Profil `uji` membuka tembok masuk lewat `EXPO_PUBLIC_TANPA_TEMBOK=1`
(`src/data/uji.ts`), karena emulator tidak bisa masuk Google maupun
Telegram sedangkan Chart hidup di baliknya. Sekat itu TIDAK boleh ada di
`pratinjau`/`produksi`/`development` — `periksa-toko.mjs` menjaganya, dua
mutasi merah. Dibuktikan dulu di web sebelum membakar 25 menit CI: tanpa
sesi, tab Pasar ada dan chart terisi, nol galat.

Yang tetap tidak bisa dibuktikan dari sini: build yang ditandatangani Play
(kunci berbeda) — cuma HP atau pre-launch report Play yang melihatnya.
