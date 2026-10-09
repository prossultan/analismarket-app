#!/usr/bin/env python3
"""Ringkas SEBAB kematian proses dari crash.log + logcat.txt, satu baris.

Untuk anotasi `::error::` di GitHub Actions: artefak (potret, logcat lengkap)
butuh login GitHub untuk diunduh, anotasi tidak. Tanpa ringkasan ini, "proses
MATI sesudah ganti timeframe" (run e82a8d2, 9 Okt) tidak bisa dibedakan antara
galat JavaScript, crash native, dan proses yang dibunuh karena memori.

    ringkas-crash.py <folder-keluar> [paket]
"""
import re
import sys
from pathlib import Path

def baris(jalur: Path) -> list[str]:
    try:
        return jalur.read_text(errors="replace").splitlines()
    except OSError:
        return []

def utama() -> int:
    folder = Path(sys.argv[1])
    paket = sys.argv[2] if len(sys.argv) > 2 else "id.analismarket.app"
    crash = baris(folder / "crash.log")
    log = baris(folder / "logcat.txt")
    hasil: list[str] = []

    # 1. Java/Kotlin + JavascriptException: blok FATAL EXCEPTION pertama.
    for i, b in enumerate(crash + log):
        if "FATAL EXCEPTION" in b:
            blok = (crash + log)[i:i + 14]
            hasil.append("FATAL: " + " | ".join(re.sub(r"^.*?: ", "", x).strip() for x in blok[1:] if x.strip()))
            break

    # 2. Galat JavaScript yang dicatat React Native.
    js = [b for b in log if re.search(r"\bE ReactNativeJS\b|ReactNativeJS.*(Error|Exception)", b)]
    if js:
        hasil.append("JS: " + " | ".join(re.sub(r"^.*ReactNativeJS:\s*", "", x).strip() for x in js[-4:]))

    # 3. Crash native (tombstone) dan pembunuhan proses.
    native = [b for b in log if re.search(r"Fatal signal|SIGSEGV|SIGABRT|Abort message|backtrace:|#0[0-4] pc", b)]
    if native:
        hasil.append("NATIVE: " + " | ".join(re.sub(r"^.*?(Fatal signal|Abort message|#0)", r"\1", x).strip() for x in native[:6]))
    mati = [b for b in log if paket in b and re.search(r"has died|Killing|lowmemorykiller|lmkd|Force stopping|ANR in", b)]
    if mati:
        hasil.append("PROSES: " + " | ".join(re.sub(r"^.*?(ActivityManager|lmkd|lowmemorykiller)\s*:?\s*", r"\1: ", x).strip() for x in mati[:3]))

    print("  ".join(hasil) if hasil else "logcat tanpa jejak crash")
    return 0

if __name__ == "__main__":
    sys.exit(utama())
