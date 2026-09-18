---
name: analismarket-design-system
description: Sistem desain Analis Market, ditarik dari kartu bot dan app Expo. Pakai saat membuat atau merapikan permukaan Analis Market mana pun — app native, web, atau kartu — supaya warna, jarak, huruf, tinggi komponen, dan gaya tombolnya satu bahasa.
---

Token kanonis: `tokens/colors_and_type.css`. Baca itu sebelum menulis gaya apa pun.

## Enam aturan yang tidak boleh dilanggar

1. **Emas `--plus` (#C9A961) HANYA untuk AnalisMarket+.** Keadaan terpilih
   memakai putih `--fg-1`. PLUS+ duduk di baris yang sama dengan tab lain;
   kalau tab aktif ikut emas, keduanya berebut dan PLUS+ berhenti menonjol.

2. **Label tidak pernah lebih tebal daripada nilainya.** Label 9/400 samar,
   nilai 12/500 kuat. Terbalik, mata membaca label duluan.

3. **Angka memakai `tabular-nums`.** Harga, level, RR, persen. Tanpa itu
   digit bergeser tiap kali berubah dan angka terasa gelisah.

4. **`null` bukan nol.** Harga yang tidak diketahui dirender `—`. Angka nol
   untuk sesuatu yang belum diketahui adalah kebohongan yang terlihat seperti
   data.

5. **Tinggi diturunkan dari isinya, bukan ditebak.** `--chip: 30px` = 6+6
   padding + 16 lineHeight + 2 garis. Tinggi yang ditebak memotong huruf
   berekor, dan itu tidak terlihat dari kode — cuma dari HP.

6. **Tiga gaya tombol, dan hanya tiga.** Utama (ivory, satu per layar), kedua
   (permukaan terangkat), chip/tab. Tombol keempat berarti ada dua yang
   berebut arti yang sama.

## Dua permukaan, dua tema — dan itu disengaja

| | kartu bot | app & web |
|---|---|---|
| latar | `#FFFFFF` terang | `#0C0B09` gelap |
| teks | `#172B42` | `#E8E7E5` |
| naik / turun | `#087F70` / `#C63D4A` | `#10B981` / `#F43F5E` |
| kanvas | 880×1200 logis, dirender 2x | layar ~390px |

Kartu dibagikan ulang di chat dan sering dilihat di layar terang; app dibaca
sendirian, sering malam. Yang disatukan **peran** warnanya, bukan nilainya.
Jangan menyalin heksa kartu ke app atau sebaliknya.

## Yang TIDAK ada di sistem ini

Radius dan bayangan tidak berlaku untuk kartu — SVG kartu memakai persegi dan
garis. Jangan menambahkannya ke sana.
