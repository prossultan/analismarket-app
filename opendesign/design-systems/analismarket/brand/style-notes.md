# Catatan gaya — kenapa tiap aturan ada

Tiap butir di bawah lahir dari sesuatu yang pernah rusak, bukan dari selera.

## Emas cuma untuk AnalisMarket+

Di web, emas berarti satu hal. Begitu ia dipakai untuk "terpilih" juga, ia
berhenti berarti apa pun. Aturannya ditegakkan `mobil.css` dengan komentar
yang menyebutnya langsung: item nav aktif putih, bukan emas, karena PLUS+
duduk di baris yang sama.

## Dua tangga huruf, dan memakai yang salah terlihat

App sempat memakai tangga **desktop** (20/18/14/13/12/10) padahal ia
permukaan mobile. Akibatnya app terbaca satu tingkat lebih besar daripada web
di HP yang sama. Tangga mobile 19/15/13/12/10/9.

## Tinggi yang ditebak memotong huruf

Chip kategori di daftar pasar terpotong di bawah — huruf berekor ("g" di
"emas & forex", "p" di "kripto") terpangkas. Sebabnya bukan tinggi yang
kurang: teks 12px **tanpa `lineHeight`** di dalam `FlatList` horizontal, jadi
tinggi barisnya diturunkan dari pengukuran virtualisasi. Perbaikannya membuat
tingginya pasti — `lineHeight` eksplisit dan `minHeight` yang dihitung dari
padding + lineHeight — bukan menaikkan angka sampai kelihatan cukup.

## Satu angka terbesar per layar

Orang membuka layar dan bertanya "sekarang berapa" lebih dulu daripada apa
pun. Di kartu, skor keyakinan pernah menempati posisi itu; tidak ada yang
pernah menanyakannya.

## Label tanpa nilainya lebih buruk daripada dua-duanya hilang

Label yang tergambar tanpa angkanya TERLIHAT seperti informasi, dan
pembacanya mengira sudah membaca sesuatu. Kartu pernah memperlihatkan kotak
"ENTRY" tanpa satu angka pun.

## Angka yang terpotong lebih buruk daripada angka kecil

"77.9" terbaca seperti angka utuh. Kalau ruangnya kurang, hurufnya yang
mengecil — jangan pernah dipotong.

## Satu sebab dicetak sekali

Kalau satu sebab melahirkan beberapa akibat, cetak sebabnya sekali dan sebut
akibatnya di baris keterangannya. Permukaan yang mengulang keluhan yang sama
tiga kali terbaca panik, dan orang berhenti membaca catatan sama sekali.

## Warna arah diturunkan dari ANGKA, bukan dari katanya

Kata arah dirender apa adanya dari endpoint; warnanya ditentukan letak SL
terhadap entry. Penjaga kosakata di web melarang kata arah diketik di kode
sama sekali, supaya tidak ada dua tempat yang bisa berbeda pendapat tentang
arti satu kata.
