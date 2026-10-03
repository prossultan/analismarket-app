/**
 * TIMEFRAME PENGGANTI — aturan yang sama dengan web (`tfNaik` di
 * analismarket-web src/data/bacaan.ts): timeframe yang tidak ada untuk sebuah
 * pasar diganti yang terdekat DI ATASNYA, atau yang tertinggi, dan
 * penggantiannya DISEBUT.
 *
 * Sampai 3 Okt layar Pasar memakai `punya[0]`: EURUSDT (bot: M1 M5 D1, lantai
 * D1 — masuk /api/pasar sejak rilis bot 3 Okt) yang diminta h1 dibuka m1, tanpa
 * satu kata pun. Itu melanggar aturan produk "tidak mengganti pilihan user
 * diam-diam", dan berbeda dari web yang membuka d1 dengan catatan.
 */
const URUT = ['m1', 'm5', 'm15', 'm30', 'h1', 'h4', 'd1'];

export function tfNaik(ada: readonly string[], tf: string): string | undefined {
  if (ada.includes(tf)) return tf;
  return ada.find((t) => URUT.indexOf(t) > URUT.indexOf(tf)) ?? ada[ada.length - 1];
}

/** Kalimat penggantian untuk layar; `null` kalau yang dibuka sama dengan yang diminta. */
export function catatanTf(simbol: string, diminta: string, dibuka: string): string | null {
  return diminta === dibuka ? null : `${diminta} tidak tersedia untuk ${simbol} — dibuka ${dibuka}.`;
}

/**
 * TF YANG DIBUKA DIHITUNG, TIDAK DISIMPAN — dari pasar dan tf yang DIMINTA.
 *
 * `diminta` adalah `setelan.tf`: pilihan orangnya sendiri, atau tf kabar yang
 * baru diketuk. Penggantinya (d1 untuk EURUSDT yang diminta h1) tidak pernah
 * ditulis balik ke setelan, jadi pasar berikutnya kembali ke h1. Dan karena
 * dihitung tiap render, kalimatnya tidak bisa dihapus efek yang selesai
 * belakangan: sampai 3 Okt keduanya salinan lokal di layar Pasar, catatannya
 * hilang begitu `/api/pasar` menjawab, d1 terwariskan diam-diam ke pasar
 * berikutnya, dan ketukan kabar m15 membuka tf lama.
 */
export function bukaTf(
  pasar: { simbol: string; timeframes: readonly string[] } | null,
  diminta: string,
): { tf: string; kataTf: string } {
  const minta = diminta.toLowerCase();
  if (pasar === null) return { tf: minta, kataTf: '' };
  const tf = tfNaik(pasar.timeframes.map((t) => t.toLowerCase()), minta) ?? 'h1';
  return { tf, kataTf: catatanTf(pasar.simbol, minta, tf) ?? '' };
}
