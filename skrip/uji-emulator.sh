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

gagal() { echo "::error::$1"; echo "GAGAL: $1" | tee -a "$KELUAR/hasil.txt"; simpan_log; exit 1; }
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

echo "== cari tab Pasar di pohon UI =="
adb shell uiautomator dump /sdcard/ui-awal.xml >/dev/null
adb pull /sdcard/ui-awal.xml "$KELUAR/ui-awal.xml" >/dev/null
TITIK="$(python3 skrip/ketuk-uiautomator.py "$KELUAR/ui-awal.xml" Pasar)" \
  || gagal "tab 'Pasar' tidak ditemukan di pohon UI — app tidak sampai ke tab (masih di tembok masuk, atau layar kosong). Lihat 01-mulai.png"
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
if TITIK_TF="$(python3 skrip/ketuk-uiautomator.py "$KELUAR/ui-pasar.xml" h4 2>/dev/null)"; then
  # shellcheck disable=SC2086
  adb shell input tap $TITIK_TF; sleep 8; potret 04-h4
  hidup || gagal "proses MATI sesudah ganti timeframe"
  echo "  hidup sesudah ganti timeframe"
fi

echo "== logcat =="
simpan_log
if grep -qE "FATAL EXCEPTION|Process: $PKG|AndroidRuntime.*$PKG" "$KELUAR/crash.log"; then
  gagal "buffer crash logcat memuat FATAL EXCEPTION untuk $PKG — lihat crash.log"
fi
echo "LULUS: terpasang, hidup, tab Pasar terbuka, chart terisi, logcat bersih" | tee "$KELUAR/hasil.txt"
