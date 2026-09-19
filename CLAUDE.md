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
