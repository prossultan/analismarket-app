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
