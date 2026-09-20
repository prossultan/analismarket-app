# Rilis ke toko — Google Play dan App Store

Daftar yang harus ada SEBELUM mengirim, dan dari mana tiap butir diambil.
Ditulis 20 Sep 2026 sesudah audit ujung-ke-ujung.

## Yang sudah ada di repo ini

| butir | tempat |
|---|---|
| Nama paket / bundle id | `id.analismarket.app` (app.json) |
| Versi | `1.0.0`, versionCode naik otomatis di EAS (`autoIncrement`) |
| Ikon adaptif Android, splash | `assets/` lewat plugin app.json |
| Izin Android | 5 saja: INTERNET, POST_NOTIFICATIONS, ACCESS_NETWORK_STATE, WAKE_LOCK, c2dm.RECEIVE — dijaga `skrip/periksa-apk.mjs` |
| Enkripsi iOS | `ITSAppUsesNonExemptEncryption: false` (app.json) |
| Build Play (AAB) | Actions → Build Android → Run workflow → profil `produksi` → artefak `AnalisMarket.aab` |
| Build tautan unduhan (APK) | push ke `main`, atau profil `pratinjau` |
| Gambar toko | `~/analismarket-web/skrip/_mockup-play.mts` → 5 PNG 1080×1920 |
| Hapus akun di dalam app | Lainnya → Profil → Hapus akun (wajib App Store) |
| Hapus akun dari luar app | https://analismarket.com/hapus-akun (wajib Google Play) |
| Kebijakan privasi | https://analismarket.com/privasi |
| Syarat | https://analismarket.com/syarat |

## Formulir Data Safety (Play) dan App Privacy (Apple) — isi yang jujur

Data yang dikumpulkan dan DITAUTKAN ke pengguna:

- **Identitas**: nama tampilan dan id Telegram (masuk lewat bot), atau email
  dan nama (masuk lewat Google). Tujuan: fungsi app (akun). Tidak dibagikan.
- **Token push perangkat** (Expo push token). Tujuan: notifikasi. Dikirim ke
  Expo Push Service untuk pengantaran. Dihapus saat pengguna mematikan saklar
  atau menghapus akun.
- **Aktivitas app**: pasar yang dibuka, pantauan yang dipasang, status
  langganan. Tujuan: fungsi app dan analitik pemakaian internal. Tidak
  dibagikan ke pihak ketiga.
- **Pembayaran**: TIDAK diproses di app. Langganan dibeli lewat bot Telegram.
  Tidak ada data kartu.

Yang TIDAK dikumpulkan: lokasi, kontak, foto, riwayat peramban, iklan/ID
iklan, kesehatan, keuangan pengguna.

Enkripsi dalam perjalanan: ya (HTTPS). Pengguna bisa minta hapus: ya, tiga
jalur di atas. Anak-anak: bukan sasaran; pilih kategori 18+ untuk konten
keuangan.

## Yang masih butuh keputusan pemilik (bukan kode)

1. **Akun Apple Developer** (US$99/tahun) — tanpa ini tidak ada build iOS
   maupun TestFlight. Sesudah ada: `eas credentials -p ios`, lalu
   `eas build -p ios --profile produksi` (butuh runner macOS; GitHub Actions
   menyediakannya gratis untuk repo publik).
2. **Akun Google Play Console** (US$25 sekali) dan kunci unggah dikelola EAS.
3. **Kategori & rating konten**: Finance, 18+ (kuesioner IARC: bukan judi,
   bukan nasihat investasi — app menyebut ini di setiap layar dokumen).
4. **Teks listing**: judul "AnalisMarket — Analisa Teknikal", deskripsi
   pendek tanpa kata sinyal/rekomendasi/pasti/jaminan/profit (penjaga
   kosakata repo ini berlaku juga untuk teks toko).

## Sebelum menekan "kirim"

```bash
npm run periksa-rilis          # penjaga sumber + izin + bundel + e2e produksi
```

Lalu unggah AAB dari artefak Actions, isi Data Safety seperti di atas,
tautkan `/privasi` dan `/hapus-akun`. Untuk App Store: TestFlight dulu
minimal satu putaran di HP sungguhan, karena push dan buka-dari-notifikasi
hanya bisa dibuktikan di perangkat.
