/**
 * PENJAGA JAWABAN — kegagalan jaringan tidak boleh hilang tanpa suara.
 *
 * `antrian.ts` dan `saya.ts` memisahkan sebab kegagalan dan menyiapkan satu
 * kalimat untuk masing-masing. Yang mahal bukan kalimat yang jelek, melainkan
 * kalimat yang DIBUANG: `if (j.ok) setD(j.isi)` tanpa cabang lain adalah kode
 * yang lulus TypeScript, lulus lint, tidak pernah melempar, dan menghasilkan
 * layar yang berbohong.
 *
 * Tiga bentuknya pernah hidup bersamaan di repo ini, 19 Sep:
 *
 *   Home        rangka memuat yang TIDAK PERNAH berhenti saat jaringan putus
 *   LayarKabar  jadwal gagal diambil → "tidak ada berita", kalimat yang
 *               artinya justru kebalikan dari keadaannya
 *   Akun (x6)   seluruh sel "—" sambil tetap berkata "Tersambung"
 *
 * Ketiganya tidak punya galat, jadi tidak punya penemu. Penjaga ini yang
 * jadi penemunya.
 *
 * ATURANNYA: di `src/layar/`, tiap pemeriksaan `.ok` atas jawaban jaringan
 * wajib punya cabang yang MENYEBUT sebabnya — `kalimat`, `jenis`, atau
 * lewat `useMuat`. Komentar dibuang lebih dulu, supaya penjaga ini tidak
 * bisa dihijaukan dengan menulis kata "kalimat" di komentar.
 */
import { readFileSync, readdirSync } from 'node:fs';

const DEKAT = 6;               // baris di sekitar `.ok` yang dianggap satu cabang
const masalah = [];
const layar = readdirSync('src/layar').filter((n) => n.endsWith('.tsx'));

if (layar.length < 8) masalah.push(`cuma ${layar.length} layar terbaca — sapuan ini tidak menguji apa pun`);

/** Buang komentar blok dan baris. Kata di komentar bukan kode. */
function tanpaKomentar(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

let diperiksa = 0;
for (const nama of layar) {
  const mentah = readFileSync(`src/layar/${nama}`, 'utf8');
  const baris = tanpaKomentar(mentah).split('\n');

  for (let i = 0; i < baris.length; i += 1) {
    /* `j.ok` / `b.ok` / `h.ok` — pemeriksaan jawaban jaringan. `res.ok` dan
       `keadaan.fase` bukan sasarannya. */
    if (!/\b[a-z][a-zA-Z0-9]*\.ok\b/.test(baris[i])) continue;
    diperiksa += 1;
    /* MENERUSKAN bukan membuang: `if (!j.ok) return j;` mengirim objek
       gagalnya utuh — kalimat, jenis, semuanya — ke pemanggilnya, yang di
       app ini selalu `useMuat`. Pengecualian ini aman karena sisi
       merendernya tetap dijaga: pemeriksaan <PitaBasi> di bawah menuntut
       layar yang memakai `useMuat` benar-benar mencetak sebabnya. */
    const teruskan = new RegExp(String.raw`if \(!\s*([a-z][a-zA-Z0-9]*)\.ok\)\s*return \1;`).exec(baris[i]);
    if (teruskan !== null) continue;

    /* Yang dituntut adalah PEMBACAAN PROPERTI `.kalimat` dari objek
       jawabannya, bukan kata "kalimat" atau "sebab" di dekat situ.
       Versi pertama penjaga ini memakai kata, dan uji-mutasi langsung
       menembusnya: mutasi yang mengembalikan bug aslinya kebetulan menulis
       `const sebab = null;` — satu deklarasi yang tidak membaca apa pun —
       dan penjaganya hijau. Kata bisa ditulis siapa saja di mana saja;
       `.kalimat` cuma bisa datang dari objek gagal yang benar-benar dibaca. */
    const sekitar = baris.slice(Math.max(0, i - DEKAT), i + DEKAT + 1).join('\n');
    if (/\.kalimat\b/.test(sekitar)) continue;
    masalah.push(`${nama}:${i + 1} — jawaban diperiksa tapi sebab kegagalannya tidak disebut di mana pun\n      ${baris[i].trim()}`);
  }

  /* Layar yang memakai `useMuat` WAJIB merender `PitaBasi`: keadaan `basi`
     berarti angka LAMA masih terpampang, dan angka lama yang terlihat seperti
     angka baru adalah kegagalan paling mahal di app harga. Menyimpan `basi`
     tanpa mencetaknya sama dengan tidak menyimpannya. */
  if (/\buseMuat\s*\(/.test(tanpaKomentar(mentah)) && !/<PitaBasi\b/.test(tanpaKomentar(mentah))) {
    masalah.push(`${nama} — memakai useMuat tapi tidak pernah merender <PitaBasi>; isi basi akan terbaca sebagai isi segar`);
  }
}

if (diperiksa === 0 && masalah.length === 0) {
  masalah.push('nol pemeriksaan `.ok` ditemukan di seluruh layar — polanya berubah, penjaga ini sudah tidak menembak apa pun');
}

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} jawaban dibuang tanpa suara:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${layar.length} layar dipindai · ${diperiksa} pemeriksaan jawaban · tiap sebab punya suara\n`);
