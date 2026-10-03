/**
 * JAM SUNYI KABAR OTOMATIS — murni, tanpa impor.
 *
 * Server menyimpan dan mengirim jendela KIRIM, bukan jam diam:
 * `{ mulai: 5, selesai: 23 }` berarti kabar boleh dikirim 05.00–23.59 WIB,
 * dan yang sunyi 00.00–05.00 (`JAM_SUNYI_PILIHAN` di `src/bot/amplus-menu.ts`
 * bot, `didalamJamOtomatis` di `src/jobs/kabar-otomatis.ts`).
 *
 * App sempat salah DUA kali di sini sekaligus, dan keduanya lolos tsc:
 *
 * 1. `pilihanJam` dideklarasikan `number[]`, padahal server mengirim objek.
 *    Chipnya tercetak "[object Object].00", dan menekannya mengirim objek ke
 *    kolom angka — server menolaknya.
 * 2. Baris "Jam sunyi · Mulai 5.00 · Selesai 23.00" membaca jendela KIRIM
 *    sebagai jendela DIAM. Yang sebenarnya diam justru 00.00–05.00.
 *
 * Label di sini menyalin rumus bot (`T.jamSunyiPilihan`): yang dicetak di
 * chip adalah jam DIAMNYA, karena itu yang dicari orang; di sebelahnya jam
 * KIRIM ditulis terang supaya tidak ada yang menebak.
 *
 * DAN TIDAK ADA YANG DISUSULKAN. Pemindai melewati penerima yang sedang
 * sunyi (`if (tolak !== null) continue` di `pemindai.ts`) SEBELUM kabarnya
 * dicatat — kabar di jam sunyi dibuang, bukan ditahan lalu dikirim
 * sekaligus. App sempat menjanjikan yang kedua.
 */

export type JendelaJam = { mulai: number; selesai: number };

function jamSah(x: unknown): number | null {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 23 ? x : null;
}

/** Satu jendela dari jawaban server, atau `null` kalau bentuknya bukan jendela. */
export function bacaJendela(x: unknown): JendelaJam | null {
  if (typeof x !== 'object' || x === null) return null;
  const o = x as { mulai?: unknown; selesai?: unknown };
  const mulai = jamSah(o.mulai);
  const selesai = jamSah(o.selesai);
  return mulai === null || selesai === null ? null : { mulai, selesai };
}

/**
 * Daftar pilihan dari jawaban server. GAGAL-TERTUTUP: entri yang bukan
 * jendela DIBUANG, bukan dicetak. Angka polos (bentuk yang dulu diandaikan
 * app) tidak menghasilkan satu chip pun — chip yang ditolak server saat
 * ditekan lebih buruk daripada chip yang tidak ada.
 */
export function bacaPilihanJam(x: unknown): JendelaJam[] {
  if (!Array.isArray(x)) return [];
  const keluar: JendelaJam[] = [];
  for (const e of x) {
    const j = bacaJendela(e);
    if (j !== null) keluar.push(j);
  }
  return keluar;
}

const dua = (n: number): string => String(n).padStart(2, '0');

/** Jendela kirim menutupi 24 jam penuh = tidak ada jam sunyi. */
export function tanpaSunyi(j: JendelaJam): boolean {
  return (j.selesai + 1) % 24 === j.mulai;
}

/** Label chip: jam DIAM-nya, rumus yang sama dengan bot. "Tidak ada" kalau kirim 24 jam. */
export function labelSunyi(j: JendelaJam): string {
  if (tanpaSunyi(j)) return 'Tidak ada';
  return `${dua((j.selesai + 1) % 24)}.00–${dua(j.mulai)}.00`;
}

/** Jam KIRIM. `selesai` inklusif sampai menit terakhirnya: selesai 23 = sampai 23.59. */
export function labelKirim(j: JendelaJam): string {
  return `${dua(j.mulai)}.00–${dua(j.selesai)}.59`;
}

export function samaJendela(a: JendelaJam, b: JendelaJam): boolean {
  return a.mulai === b.mulai && a.selesai === b.selesai;
}

/**
 * Kalimat di bawah pilihan jam. Disimpan di sini, bukan diketik di layar,
 * supaya penjaga bisa menuntut isinya: kabar di jam sunyi TIDAK dikirim
 * dan TIDAK disusulkan.
 */
export const KALIMAT_JAM_SUNYI =
  'Di jam sunyi kabar otomatis tidak dikirim, dan tidak disusulkan sesudahnya. Jam mengikuti WIB.';
