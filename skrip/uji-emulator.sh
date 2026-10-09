#!/usr/bin/env bash
# UJI UJUNG-KE-UJUNG DI EMULATOR ANDROID — bukan web, bukan asumsi.
#
# Dijalankan di dalam `reactivecircus/android-emulator-runner` di GitHub
# Actions, dengan APK dari profil `uji` (tembok masuk dibuka lewat
# EXPO_PUBLIC_TANPA_TEMBOK, lihat src/data/uji.ts).
#
# Yang dibuktikan, berurutan, dan tiap langkah bisa merah sendiri:
#   1. APK terpasang dan prosesnya hidup 15 detik sesudah diluncurkan.
#   2. Tab "Pasar" ADA di layar (dibaca dari pohon UI Android, bukan koordinat
#      tebakan), lalu diketuk.
#   3. Dua belas detik sesudah ketukan, prosesnya MASIH hidup — ini persis
#      titik crash 20 Sep (kait di bawah early return, meledak saat daftar
#      pasar selesai dimuat).
#   4. Layar chart benar-benar terisi: teks "ganti" (pil pemilih pasar) atau
#      "TARIK UNTUK DETAIL" terbaca dari pohon UI.
#   5. Buffer crash logcat kosong dari FATAL EXCEPTION milik paket ini.
#
# Semua potret dan log disimpan ke folder KELUAR dan diunggah sebagai artefak,
# jadi kegagalan bisa dilihat, bukan cuma dibaca.
set -euo pipefail

APK="${1:?jalur APK}"
PKG="id.analismarket.app"
KELUAR="${2:-uji-emulator}"
mkdir -p "$KELUAR"

# Log disimpan DULU, lalu sebab kematiannya diringkas ke anotasi: artefak butuh
# login GitHub, anotasi tidak (lihat skrip/ringkas-crash.py).
gagal() {
  simpan_log
  local rinci
  rinci="$(python3 skrip/ringkas-crash.py "$KELUAR" "$PKG" 2>/dev/null | head -c 1800 || true)"
  echo "::error::$1 — ${rinci:-tanpa ringkasan logcat}"
  echo "GAGAL: $1 — ${rinci:-}" | tee -a "$KELUAR/hasil.txt"
  exit 1
}
simpan_log() {
  adb logcat -d -b crash > "$KELUAR/crash.log" 2>/dev/null || true
  adb logcat -d > "$KELUAR/logcat.txt" 2>/dev/null || true
  adb exec-out screencap -p > "$KELUAR/99-akhir.png" 2>/dev/null || true
}
potret() { adb exec-out screencap -p > "$KELUAR/$1.png"; echo "  potret $1"; }
hidup() { adb shell pidof "$PKG" 2>/dev/null | tr -d '\r' | grep -qE '^[0-9]+' ; }

echo "== perangkat =="
adb wait-for-device
adb shell getprop ro.build.version.release | tr -d '\r' | sed 's/^/  Android /'
# Animasi dimatikan supaya ketukan tidak mendarat di tengah transisi.
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

echo "== pasang =="
adb install -r "$APK"
adb logcat -c

echo "== luncurkan =="
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 15
potret 01-mulai
hidup || gagal "proses $PKG MATI dalam 15 detik pertama sesudah diluncurkan"
echo "  hidup sesudah peluncuran"

echo "== cari tab Pasar di pohon UI (sampai 65 detik sesudah peluncuran) =="
# Waktu buka app di emulator CI TIDAK tetap. Run 49626b9 (9 Okt) tidak sampai
# ke tab dalam 15 detik, padahal run f2cc1d3 dengan kode pembukaan yang sama
# sampai. Jadi menunggu dengan batas, bukan angka tetap. Kalau tetap gagal,
# teks yang terlihat ikut ditulis ke pesan galat — artefak potret butuh login
# GitHub, anotasi `::error::` tidak, jadi sebabnya terbaca tanpa menebak.
TITIK=""
for i in $(seq 1 10); do
  adb shell uiautomator dump /sdcard/ui-awal.xml >/dev/null 2>&1 || true
  adb pull /sdcard/ui-awal.xml "$KELUAR/ui-awal.xml" >/dev/null 2>&1 || true
  if TITIK="$(python3 skrip/ketuk-uiautomator.py "$KELUAR/ui-awal.xml" Pasar 2>/dev/null)"; then break; fi
  TITIK=""
  hidup || gagal "proses $PKG MATI saat menunggu tab Pasar (detik ke-$((15 + i * 5)))"
  sleep 5
done
if [ -z "$TITIK" ]; then
  potret 01b-tanpa-tab
  TERLIHAT="$(python3 skrip/ketuk-uiautomator.py "$KELUAR/ui-awal.xml" --teks 2>/dev/null | head -c 400 || true)"
  gagal "tab 'Pasar' tidak ditemukan sesudah 65 detik — teks di layar: ${TERLIHAT:-(kosong)}. Lihat 01b-tanpa-tab.png"
fi
echo "  tab Pasar di $TITIK"

echo "== ketuk Pasar =="
# shellcheck disable=SC2086
adb shell input tap $TITIK
sleep 12
potret 02-pasar
hidup || gagal "proses $PKG MATI sesudah tab Pasar dibuka — ini titik crash 20 Sep"
echo "  hidup sesudah Pasar dibuka"

echo "== pastikan chart terisi, bukan cuma tidak crash =="
adb shell uiautomator dump /sdcard/ui-pasar.xml >/dev/null
adb pull /sdcard/ui-pasar.xml "$KELUAR/ui-pasar.xml" >/dev/null
if ! grep -qiE 'text="(ganti|TARIK UNTUK DETAIL|Membaca )' "$KELUAR/ui-pasar.xml"; then
  gagal "layar Pasar terbuka tapi tidak ada pil 'ganti' maupun 'TARIK UNTUK DETAIL' di pohon UI — layar kosong. Lihat 02-pasar.png"
fi
echo "  chart terisi"

echo "== tunggu bacaan selesai, ketuk timeframe lain =="
sleep 8
potret 03-pasar-terisi
# Titik h4 dibaca ULANG tepat sebelum diketuk: dump sebelumnya diambil saat
# layar baru terbuka, dan pita/kalimat yang muncul sesudahnya bisa menggeser
# barisnya — ketukan mendarat di benda lain dan hasilnya tidak bisa dibaca.
adb shell uiautomator dump /sdcard/ui-sebelum-tf.xml >/dev/null 2>&1 || true
adb pull /sdcard/ui-sebelum-tf.xml "$KELUAR/ui-sebelum-tf.xml" >/dev/null 2>&1 || true
if TITIK_TF="$(python3 skrip/ketuk-uiautomator.py "$KELUAR/ui-sebelum-tf.xml" h4 2>/dev/null)"; then
  # shellcheck disable=SC2086
  adb shell input tap $TITIK_TF; sleep 8; potret 04-h4
  hidup || gagal "proses MATI sesudah ganti timeframe (h4 diketuk di $TITIK_TF)"
  echo "  hidup sesudah ganti timeframe"
else
  # Dulu dilewati DIAM-DIAM — run yang "lolos" bisa saja tidak pernah sampai ke sini.
  echo "::warning::tombol h4 tidak terbaca di pohon UI — langkah ganti timeframe DILEWATI"
fi

echo "== logcat =="
simpan_log
if grep -qE "FATAL EXCEPTION|Process: $PKG|AndroidRuntime.*$PKG" "$KELUAR/crash.log"; then
  gagal "buffer crash logcat memuat FATAL EXCEPTION untuk $PKG — lihat crash.log"
fi
echo "LULUS: terpasang, hidup, tab Pasar terbuka, chart terisi, logcat bersih" | tee "$KELUAR/hasil.txt"
