# Sistem desain Analis Market

Satu berkas kanonis: **`tokens/colors_and_type.css`**. Sisanya penjelasan.

## Dari mana angkanya

Ditarik dari kode yang sudah berjalan, bukan dikarang:

| sumber | berkas | yang diambil |
|---|---|---|
| kartu bot | `~/apps/analisa/src/render/theme.ts` | palet `TV`, pita `BAND`, baris `ROW`, kanvas 880×1200 |
| kartu bot | `~/apps/analisa/src/render/page.ts` | frekuensi ukuran huruf nyata |
| app Expo | `~/analismarket-app/src/gaya/token.ts` | warna, jarak, tinggi komponen |
| web mobile | `~/analismarket-web/src/gaya/mobil.css` | tangga huruf 19/15/13/12/10/9, `--sentuh: 44px`, baris pasar 52px |

Kartu bot dipilih sebagai sumber karena ia permukaan yang paling banyak
dilihat orang, dan bentuknya sudah disetujui.

## Isi

```
tokens/colors_and_type.css   token kanonis — warna, huruf, jarak, tinggi, tombol
SKILL.md                     enam aturan yang tidak boleh dilanggar
brand/style-notes.md         kenapa tiap aturan ada, dan apa yang pernah rusak
README.md                    berkas ini
```

## Yang belum ada, dan sengaja

- **`assets/`** kosong. Lambang pasar dipakai web lewat paket ikon kripto
  (~2 MB) dan belum diangkut ke app. Aturan skill ini: jangan menggambar
  ulang ikon dengan tangan, salin yang asli — jadi folder ini menunggu paket
  itu dipasang, bukan diisi gambar karangan.
- **`ui-kit-*/`** kosong. Merekayasa ulang komponen jadi JSX di sini berarti
  dua salinan komponen yang sama; komponen sungguhan hidup di
  `src/komponen/` dan `src/layar/` di repo app.
- **`sample-slides/`** tidak ada. Tidak ada templat dek yang diberikan.

## Cara memakainya di React Native

RN tidak membaca CSS. `src/gaya/token.ts` adalah cerminan berkas ini dalam
TypeScript, dan **berkas CSS-nya yang kanonis** — kalau keduanya berbeda,
yang salah `token.ts`.

## Penerapan pertama — 18 Sep

Terukur sebelum: angka `14` diketik mentah di **18 tempat**, `6` di **16
tempat**, dan enam warna mentah tersebar di lima berkas. Semuanya jadi token
(`TALANG`, `SELA_CHIP`, `TINGGI_CHIP`, `TINGGI_KENDALI`, `W.chart`,
`W.turunTepi`, `W.turunLatar`, `W.tirai`, `W.isiSamar`, `W.isiSamarKuat`).

Satu hal yang hampir lolos: mengganti `"#0B0B0D"` jadi `W.chart` di atribut
JSX menghasilkan `backgroundColor=W.chart` tanpa kurung kurawal. Typecheck
menangkapnya; penggantian teks buta di JSX selalu butuh pemeriksa sesudahnya.
