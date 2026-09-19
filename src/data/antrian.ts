/**
 * SATU PINTU untuk seluruh permintaan jaringan app ini.
 *
 * Kenapa ada: `/api/bacaan`, `/api/pasar`, dan `/api/jadwal-berita` berbagi
 * SATU zona pembatas laju di nginx — `apibacaan`, 1 r/s burst 5, dikunci pada
 * ALAMAT IP. Operator seluler memakai CGNAT, jadi banyak user berbagi satu
 * alamat. App yang menembak empat endpoint saat dibuka tidak cuma membuat 429
 * untuk dirinya sendiri; ia membuatnya untuk orang lain di jaringan yang sama.
 *
 * Empat lapis, dan masing-masing menjawab masalah yang BERBEDA:
 *
 *   antrean      → permintaan berurutan tidak pernah lebih rapat dari jatah
 *   single-flight → permintaan BERSAMAAN yang sama jadi satu
 *   simpanan     → permintaan berurutan yang sama tidak diulang sama sekali
 *   mundur       → sesudah ditolak, tidak memperburuk keadaan
 *
 * Cache dan single-flight sering dikira satu hal. Bukan: cache menolong
 * permintaan yang datang BERURUTAN, single-flight menolong yang datang di
 * frame yang SAMA — dan di layar yang baru dibuka, keduanya terjadi.
 */

import { Platform } from 'react-native';
import { headerSesi } from './sesi';
/**
 * Di web asalnya RELATIF: web dipakai untuk memotret layar, dan pemotretnya
 * memproksi /api dan /chart-embed ke produksi — API produksi tidak memasang
 * header CORS, jadi asal absolut dari 127.0.0.1 ditolak peramban.
 */
export const ASAL = Platform.OS === 'web' ? '' : 'https://analismarket.com';

/**
 * 1.100 ms, bukan 1.000.
 *
 * Jatahnya `rate=1r/s`. Menembak tepat di batas berarti tiap jitter jaringan
 * mendorong satu permintaan ke jendela sebelumnya, dan nginx menghitungnya
 * sebagai kelebihan. Seratus milidetik kelonggaran menghapus seluruh kelas
 * 429 acak itu dengan ongkos yang tidak terasa siapa pun.
 */
const JARAK_MS = 1_100;

/** Disamakan dengan `proxy_cache_valid 200 20s`. Lebih rapat cuma mengunduh salinan cache yang sama. */
const UMUR_SIMPANAN_MS = 20_000;

/** Batas waktu satu permintaan. nginx sendiri memberi `/api/` 35 detik. */
const BATAS_MS = 30_000;

export type Jawaban<T> =
  | { ok: true; isi: T; dariSimpanan: boolean; cacheNginx: string | null }
  /** `jenis` membedakan "tidak terjangkau" dari "dijawab, dan jawabannya tidak". */
  | { ok: false; jenis: 'jaringan' | 'ditolak' | 'batas'; kalimat: string; galat?: string };

type Simpanan = { pada: number; isi: unknown; cacheNginx: string | null };

const simpanan = new Map<string, Simpanan>();

/**
 * UMUR DATA — kapan jawaban terakhir untuk sebuah awalan jalur masuk.
 *
 * Dibaca layar Lainnya untuk blok "data terakhir masuk". Yang dijawab adalah
 * "ini angka kapan", pertanyaan yang muncul terus dan sebelumnya tidak punya
 * jawaban di mana pun. `null` = belum pernah, dan dicetak "—", bukan jam
 * karangan.
 */
export function umurTerakhir(awalanJalur: string): number | null {
  let terbaru: number | null = null;
  for (const [k, v] of simpanan) {
    if (!k.includes(awalanJalur)) continue;
    if (terbaru === null || v.pada > terbaru) terbaru = v.pada;
  }
  return terbaru === null ? null : Math.floor(terbaru / 1000);
}
const berjalan = new Map<string, Promise<Jawaban<unknown>>>();

let giliranBerikut = 0;
/** Sampai kapan seluruh antrean ditahan sesudah 429. 0 = tidak ditahan. */
let ditahanSampai = 0;
let berturutDitolak = 0;

function tidur(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Giliran berikutnya, dihitung dari jam — bukan dari `setInterval` yang bisa hanyut. */
async function tungguGiliran(): Promise<void> {
  const sekarang = Date.now();
  const mulai = Math.max(sekarang, giliranBerikut, ditahanSampai);
  giliranBerikut = mulai + JARAK_MS;
  if (mulai > sekarang) await tidur(mulai - sekarang);
}

/**
 * Berapa lama seluruh antrean ditahan sesudah ditolak.
 *
 * Menghormati `Retry-After` kalau servernya menyebutkan angka: server yang
 * memberi tahu kapan boleh kembali lebih tahu daripada rumus kita.
 */
function tahan(retryAfter: string | null): void {
  berturutDitolak += 1;
  const dariServer = retryAfter === null ? NaN : Number(retryAfter) * 1000;
  const mundur = Number.isFinite(dariServer) && dariServer > 0
    ? dariServer
    : Math.min(30_000, 2_000 * 2 ** (berturutDitolak - 1));
  ditahanSampai = Date.now() + mundur;
}

export function lupakan(kunci: string): void {
  simpanan.delete(kunci);
}

export function lupakanSemua(): void {
  simpanan.clear();
}

/**
 * Ambil JSON lewat antrean.
 *
 * `kunci` adalah identitas permintaan, dan sengaja dipisah dari `jalur`:
 * dua pemanggil yang meminta hal yang sama harus memakai kunci yang sama
 * supaya single-flight menyatukannya.
 */
export async function ambil<T>(kunci: string, jalur: string, segarkan = false): Promise<Jawaban<T>> {
  if (!segarkan) {
    const t = simpanan.get(kunci);
    if (t !== undefined && Date.now() - t.pada < UMUR_SIMPANAN_MS) {
      return { ok: true, isi: t.isi as T, dariSimpanan: true, cacheNginx: t.cacheNginx };
    }
  }

  const sedang = berjalan.get(kunci);
  if (sedang !== undefined) return sedang as Promise<Jawaban<T>>;

  const janji = (async (): Promise<Jawaban<T>> => {
    await tungguGiliran();
    const henti = new AbortController();
    const jam = setTimeout(() => { henti.abort(); }, BATAS_MS);
    try {
      /* SESI IKUT. Tanpa ini /api/bacaan dan /api/pasar selalu anonim, jadi
         fitur AM+ di sisi bacaan — m5 emas/forex — tergerbang 402 untuk
         pelanggan yang sudah masuk. Diuji 19 Sep dengan sesi asli pemilik:
         server menjawab 200 dengan sesi dan 402 tanpanya; app-nya yang tidak
         pernah membawa sesinya. */
      const res = await fetch(`${ASAL}${jalur}`, { signal: henti.signal, headers: await headerSesi() });
      const cacheNginx = res.headers.get('x-cache-status');

      if (res.status === 429) {
        const badan = (await res.json().catch(() => ({}))) as { galat?: string; pesan?: string };
        /**
         * DUA HAL BERBEDA DATANG SEBAGAI 429.
         *
         * Batas harian AM+ adalah JAWABAN — bot sudah memutuskan, dan
         * mengulang-coba cuma membakar jatah untuk pertanyaan yang sudah
         * dijawab. Pembatas laju nginx adalah gangguan sementara, dan di situ
         * menahan antrean memang benar.
         */
        if (badan.galat === 'batas-harian') {
          return { ok: false, jenis: 'batas', kalimat: badan.pesan ?? 'Jatah analisa hari ini sudah habis.', galat: badan.galat };
        }
        tahan(res.headers.get('retry-after'));
        return { ok: false, jenis: 'jaringan', kalimat: 'Terlalu banyak permintaan. Mencoba lagi sebentar lagi.' };
      }

      if (res.status === 402 || res.status === 400) {
        const badan = (await res.json().catch(() => ({}))) as { galat?: string; pesan?: string };
        berturutDitolak = 0;
        return { ok: false, jenis: 'ditolak', kalimat: badan.pesan ?? badan.galat ?? 'Permintaan ditolak.', galat: badan.galat };
      }

      if (!res.ok) return { ok: false, jenis: 'jaringan', kalimat: `Bot menjawab ${String(res.status)}.` };

      const isi = (await res.json()) as T;
      berturutDitolak = 0;
      simpanan.set(kunci, { pada: Date.now(), isi, cacheNginx });
      return { ok: true, isi, dariSimpanan: false, cacheNginx };
    } catch {
      return { ok: false, jenis: 'jaringan', kalimat: 'Tidak bisa menghubungi bot. Periksa sambungan.' };
    } finally {
      clearTimeout(jam);
      berjalan.delete(kunci);
    }
  })();

  berjalan.set(kunci, janji as Promise<Jawaban<unknown>>);
  return janji;
}
