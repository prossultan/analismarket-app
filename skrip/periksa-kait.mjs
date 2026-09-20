/**
 * PENJAGA KAIT — tidak ada `useX()` yang dipanggil SESUDAH early return.
 *
 * React menuntut jumlah dan urutan hook sama di tiap render. Komponen yang
 * memanggil hook di bawah `if (...) return ...` memanggilnya nol kali saat
 * cabang itu diambil dan satu kali saat tidak — dan React menjatuhkan app
 * dengan "Rendered more hooks than during the previous render".
 *
 * KENAPA ADA: 20 Sep 2026, layar Chart. `const temaChart = useTema()`
 * ditaruh di bawah `if (pasar === null) return <Memuat/>`. Render pertama
 * daftar pasar belum ada, jadi hooknya dilewati; render kedua daftar pasar
 * masuk, hooknya ikut, dan app CRASH persis saat tab Pasar dibuka. Di web
 * gejalanya cuma layar kosong, dan harness melaporkannya sebagai "tab Pasar
 * tidak ada" — terbaca seperti masalah harness, bukan seperti app yang mati.
 * Lolos typecheck, lolos tujuh penjaga lain, dan baru ketahuan dari HP.
 *
 * Yang diperiksa cuma kait di KEDALAMAN NOL badan komponen. Kait di dalam
 * callback bukan kait komponen itu, dan memang tidak tunduk aturan ini.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';

const masalah = [];

function berkasSumber(dir) {
  const keluar = [];
  for (const n of readdirSync(dir)) {
    const j = `${dir}/${n}`;
    if (statSync(j).isDirectory()) keluar.push(...berkasSumber(j));
    else if (n.endsWith('.tsx')) keluar.push(j);
  }
  return keluar;
}

/** Buang komentar dan isi string supaya kata "return" di dalamnya tidak terbaca sebagai kode. */
function tanpaLiteral(s) {
  let keluar = '';
  let i = 0;
  while (i < s.length) {
    const dua = s.slice(i, i + 2);
    if (dua === '//') { const n = s.indexOf('\n', i); const p = n < 0 ? s.length : n; keluar += ' '.repeat(p - i); i = p; continue; }
    if (dua === '/*') { const n = s.indexOf('*/', i); const p = n < 0 ? s.length : n + 2; keluar += ' '.repeat(p - i).replace(/ /g, ' '); i = p; continue; }
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < s.length && s[j] !== c) { if (s[j] === '\\') j += 1; j += 1; }
      keluar += ' '.repeat(Math.min(j, s.length) - i + 1);
      i = j + 1;
      continue;
    }
    keluar += c;
    i += 1;
  }
  return keluar;
}

/**
 * Badan fungsi — `{` pertama SESUDAH daftar parameter ditutup.
 *
 * Bukan `{` pertama sesudah namanya: hampir tiap komponen di repo ini
 * menerima props yang didestrukturisasi (`function X({ a, b }: Props)`), dan
 * kurawal itu yang ketemu duluan. Versi pertama penjaga ini mengambil kurawal
 * parameter sebagai badan, lalu melaporkan "nol masalah" untuk berkas yang
 * benar-benar punya bug — lulus dengan tidak memeriksa apa pun.
 */
function badan(s, mulai) {
  const kurung = s.indexOf('(', mulai);
  if (kurung < 0) return null;
  let dp = 0;
  let tutup = -1;
  for (let i = kurung; i < s.length; i += 1) {
    if (s[i] === '(') dp += 1;
    else if (s[i] === ')') { dp -= 1; if (dp === 0) { tutup = i; break; } }
  }
  if (tutup < 0) return null;
  const buka = s.indexOf('{', tutup);
  if (buka < 0) return null;
  let d = 0;
  for (let i = buka; i < s.length; i += 1) {
    if (s[i] === '{') d += 1;
    else if (s[i] === '}') { d -= 1; if (d === 0) return { awal: buka + 1, akhir: i }; }
  }
  return null;
}

const berkas = berkasSumber('src').concat(['App.tsx']);
if (berkas.length < 20) masalah.push(`cuma ${berkas.length} berkas dipindai — sapuan ini tidak menguji apa pun`);

let komponen = 0;
let kaitDihitung = 0;
for (const jalur of berkas) {
  const asli = readFileSync(jalur, 'utf8');
  const kode = tanpaLiteral(asli);
  /* Fungsi berhuruf besar = komponen React menurut aturan React sendiri. */
  for (const m of kode.matchAll(/\bfunction\s+([A-Z]\w*)\s*\(/g)) {
    const b = badan(kode, m.index);
    if (b === null) continue;
    komponen += 1;
    const isi = kode.slice(b.awal, b.akhir);

    /* Telusuri sekali. Kedalaman dihitung dari KURUNG KURAWAL saja, dan tiap
       blok dicatat jenisnya: blok `if`/`else` masih TINGKAT PERNYATAAN
       komponen (return di dalamnya adalah early return yang melewati kait di
       bawahnya), sedangkan badan fungsi bukan. Versi pertama penjaga ini
       menghitung kedalaman dari semua kurung dan karena itu tidak melihat
       satu pun `if (...) { return ... }` — ia lulus tanpa memeriksa apa pun,
       persis kelas kegagalan yang seharusnya ia cegah. */
    const tumpukan = [];
    let returnAwal = -1;
    const kait = [];
    for (let i = 0; i < isi.length; i += 1) {
      const c = isi[i];
      if (c === '{') {
        const sebelum = isi.slice(Math.max(0, i - 400), i).trimEnd();
        let jenis = 'lain';
        if (/\belse$/.test(sebelum)) jenis = 'if';
        else if (sebelum.endsWith(')')) {
          /* Mundur ke '(' pasangannya, lalu lihat kata sebelum kurung itu. */
          let d2 = 0;
          let j = sebelum.length - 1;
          for (; j >= 0; j -= 1) {
            if (sebelum[j] === ')') d2 += 1;
            else if (sebelum[j] === '(') { d2 -= 1; if (d2 === 0) break; }
          }
          const kata = /([A-Za-z_$]\w*)\s*$/.exec(sebelum.slice(0, j));
          if (kata !== null && kata[1] === 'if') jenis = 'if';
        }
        tumpukan.push(jenis);
        continue;
      }
      if (c === '}') { tumpukan.pop(); continue; }
      const tingkatPernyataan = tumpukan.every((t) => t === 'if');
      if (!tingkatPernyataan) continue;
      if (returnAwal < 0 && tumpukan.length > 0 && isi.startsWith('return', i) && !/\w/.test(isi[i - 1] ?? ' ')) returnAwal = i;
      if (tumpukan.length > 0) continue;
      const k = /^use[A-Z]\w*\s*\(/.exec(isi.slice(i, i + 40));
      if (k !== null && !/[\w.]/.test(isi[i - 1] ?? ' ')) { kait.push({ i, nama: k[0].replace(/\s*\($/, '') }); kaitDihitung += 1; }
    }
    if (returnAwal < 0) continue;
    for (const k of kait) {
      if (k.i > returnAwal) {
        const baris = asli.slice(0, 1).length && kode.slice(0, b.awal + k.i).split('\n').length;
        masalah.push(`${jalur}:${baris} — ${m[1]}() memanggil ${k.nama}() sesudah early return; React akan menjatuhkan app saat cabang itu berubah`);
      }
    }
  }
}

if (komponen < 15) masalah.push(`cuma ${komponen} komponen ditemukan — polanya berubah, penjaga ini tidak memeriksa apa pun`);
if (kaitDihitung < 20) masalah.push(`cuma ${kaitDihitung} kait ditemukan — polanya berubah, penjaga ini tidak memeriksa apa pun`);

if (masalah.length > 0) {
  process.stderr.write(`GAGAL — ${masalah.length} masalah kait:\n${masalah.map((m) => `  - ${m}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`  ${berkas.length} berkas · ${komponen} komponen · ${kaitDihitung} kait, nol di bawah early return\n`);
