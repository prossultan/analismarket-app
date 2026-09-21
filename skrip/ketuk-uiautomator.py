#!/usr/bin/env python3
"""Cari simpul bertuliskan LABEL di dump uiautomator, cetak titik tengahnya "x y".

Dibaca dari pohon UI Android, bukan koordinat tebakan: ukuran layar emulator
bisa berubah, letak bilah tab bisa berubah, dan koordinat yang ditebak akan
mengetuk udara tanpa mengeluh. Keluar 1 kalau tidak ketemu.
"""
import re
import sys
import xml.etree.ElementTree as ET

def utama() -> int:
    if len(sys.argv) < 3:
        print("pakai: ketuk-uiautomator.py <dump.xml> <label>", file=sys.stderr)
        return 2
    jalur, label = sys.argv[1], sys.argv[2]
    pohon = ET.parse(jalur)
    for n in pohon.iter("node"):
        teks = n.get("text", "")
        desk = n.get("content-desc", "")
        if teks.strip().lower() == label.lower() or desk.strip().lower() == label.lower():
            m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", n.get("bounds", ""))
            if m is None:
                continue
            x1, y1, x2, y2 = map(int, m.groups())
            print(f"{(x1 + x2) // 2} {(y1 + y2) // 2}")
            return 0
    print(f"label '{label}' tidak ada di {jalur}", file=sys.stderr)
    return 1

if __name__ == "__main__":
    sys.exit(utama())
