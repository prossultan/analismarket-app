/**
 * PENJAGA APK — menembak artefak yang benar-benar dipasang orang.
 *
 * `periksa-izin.mjs` membaca manifes hasil prebuild, dan itu BUTA terhadap
 * izin yang digabung dari pustaka native (AAR) saat Gradle berjalan. Terbukti
 * 19 Sep: prebuild berkata "1 izin ikut", APK yang jadi memuat EMPAT
 * tambahan (USE_BIOMETRIC, USE_FINGERPRINT, ACCESS_NETWORK_STATE,
 * install-referrer) plus skema intent `solana-wallet://` — semuanya terseret
 * paket Clerk. Tidak ada satu pun yang pernah diketik di repo ini.
 *
 * Yang sah cuma yang dibaca dari AXML biner di dalam APK. Pemindaian string
 * mentah TIDAK cukup: ia pernah "menemukan" izin DUMP yang tidak pernah
 * dideklarasikan.
 *
 *   node skrip/periksa-apk.mjs /jalur/ke/app.apk
 */
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const BOLEH_IZIN = new Set([
  'android.permission.INTERNET',              // seluruh isi app dari jaringan
  // Kabar pantauan ke HP. Diminta dari SAKLAR di Pengaturan, bukan saat app
  // pertama dibuka — dialog izin Android cuma muncul sekali seumur pemasangan.
  'android.permission.POST_NOTIFICATIONS',
  'com.google.android.c2dm.permission.RECEIVE', // menerima pesan FCM — tanpa ini push tidak pernah sampai
  'android.permission.WAKE_LOCK', // membangunkan perangkat untuk memproses push prioritas tinggi
  'android.permission.ACCESS_NETWORK_STATE',  // pustaka memeriksa sambungan; tingkat normal, tidak ditampilkan ke pengguna
]);
/** Izin privat milik app sendiri dari AndroidX — sah. */
const IZIN_SENDIRI = /\.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION$/;
const BOLEH_SKEMA = new Set(['analismarket', 'https', 'http']);

const jalur = process.argv[2];
if (jalur === undefined) { process.stdout.write('pakai: node skrip/periksa-apk.mjs <apk>\n'); process.exit(2); }

/* ── pembaca ZIP minimal: cari satu entri lewat central directory ── */
function entriZip(buf, nama) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const jumlah = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < jumlah; i += 1) {
    const n = buf.readUInt16LE(p + 28), e = buf.readUInt16LE(p + 30), c = buf.readUInt16LE(p + 32);
    const namaIni = buf.toString('utf8', p + 46, p + 46 + n);
    if (namaIni === nama) {
      const metode = buf.readUInt16LE(p + 10), ukuranTerkompres = buf.readUInt32LE(p + 20);
      const lokal = buf.readUInt32LE(p + 42);
      const ln = buf.readUInt16LE(lokal + 26), le = buf.readUInt16LE(lokal + 28);
      const data = buf.subarray(lokal + 30 + ln + le, lokal + 30 + ln + le + ukuranTerkompres);
      return metode === 0 ? data : inflateRawSync(data);
    }
    p += 46 + n + e + c;
  }
  return null;
}

/* ── AXML ── */
function kolamString(buf, off) {
  const size = buf.readUInt32LE(off + 4);
  const cnt = buf.readUInt32LE(off + 8), flags = buf.readUInt32LE(off + 16), sstart = buf.readUInt32LE(off + 20);
  const utf8 = (flags & (1 << 8)) !== 0; const out = [];
  for (let i = 0; i < cnt; i += 1) {
    let p = off + sstart + buf.readUInt32LE(off + 28 + i * 4);
    if (utf8) {
      let n = buf[p]; p += 1; if (n & 0x80) { n = ((n & 0x7f) << 8) | buf[p]; p += 1; }
      let n2 = buf[p]; p += 1; if (n2 & 0x80) { n2 = ((n2 & 0x7f) << 8) | buf[p]; p += 1; }
      out.push(buf.toString('utf8', p, p + n2));
    } else {
      let n = buf.readUInt16LE(p); p += 2; if (n & 0x8000) { n = ((n & 0x7fff) << 16) | buf.readUInt16LE(p); p += 2; }
      out.push(buf.toString('utf16le', p, p + n * 2));
    }
  }
  return { out, next: off + size };
}
function bacaManifes(buf) {
  const fsize = buf.readUInt32LE(4);
  const { out: sp, next } = kolamString(buf, 8);
  const S = (i) => (i >= 0 && i < sp.length ? sp[i] : `#${String(i)}`);
  let off = next; const izin = []; const skema = []; let paket = null;
  while (off < Math.min(fsize, buf.length) - 8) {
    const typ = buf.readUInt16LE(off), size = buf.readUInt32LE(off + 4);
    if (size <= 0) break;
    if (typ === 0x0102) {
      const nama = S(buf.readUInt32LE(off + 20));
      const acnt = buf.readUInt16LE(off + 28), ast = off + 16 + buf.readUInt16LE(off + 24);
      const at = {};
      for (let i = 0; i < acnt; i += 1) {
        const a = ast + i * 20, an = S(buf.readUInt32LE(a + 4)), raw = buf.readInt32LE(a + 8);
        at[an] = raw >= 0 ? S(raw) : buf.readUInt32LE(a + 16);
      }
      if (nama === 'uses-permission') izin.push(String(at.name));
      if (nama === 'manifest') paket = String(at.package);
      if (nama === 'data' && at.scheme !== undefined) skema.push(String(at.scheme));
    }
    off += size;
  }
  return { paket, izin, skema: [...new Set(skema)] };
}

const apk = readFileSync(jalur);
const manifes = entriZip(apk, 'AndroidManifest.xml');
if (manifes === null) { process.stdout.write('GAGAL — AndroidManifest.xml tidak ada di APK\n'); process.exit(1); }
const m = bacaManifes(manifes);
const masalah = [];
if (m.izin.length === 0) masalah.push('nol uses-permission terbaca — pengurai AXML gagal, bukan APK yang bersih');
for (const i of m.izin) if (!BOLEH_IZIN.has(i) && !IZIN_SENDIRI.test(i)) masalah.push(`izin TIDAK dibenarkan: ${i}`);
for (const s of m.skema) if (!BOLEH_SKEMA.has(s)) masalah.push(`skema intent asing: ${s}:// — app mendaftar sebagai penangan tautan yang bukan miliknya`);
if (!m.skema.includes('analismarket')) masalah.push('skema analismarket:// hilang — Google (Clerk) tidak bisa kembali ke app');
if (m.paket !== 'id.analismarket.app') masalah.push(`paket ${String(m.paket)} bukan id.analismarket.app`);

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${String(masalah.length)} masalah di APK:\n`);
  for (const x of masalah) process.stdout.write(`  - ${x}\n`);
  process.exit(1);
}
process.stdout.write(`  ${m.paket} · izin: ${m.izin.join(', ')} · skema: ${m.skema.join(', ')}\n`);
