/**
 * KEADAAN LAYAR PASAR — pasar, timeframe, dan bacaan. Kait tanpa JSX dan
 * tanpa impor React Native, supaya `skrip/uji-keputusan.mjs` bisa
 * menjalankannya di React sungguhan.
 *
 * Bug 3 Okt di layar Pasar bentuknya sama: SALINAN
 * LOKAL dari sesuatu yang sudah punya sumber, ditambah jawaban jaringan yang
 * tiba belakangan dan menimpanya.
 *
 *   tf          `useState(setelan.tf)` dibaca sekali saat layar dipasang.
 *               Ketukan kabar menyimpan m15 ke setelan, layar yang sudah
 *               terbuka tetap h1. Tf PENGGANTI (d1 untuk EURUSDT) ditulis
 *               balik ke setelan, jadi pasar berikutnya mewarisi d1. Dan
 *               kalimat penggantiannya dihapus efek muat daftar yang selesai
 *               sesudah pilihan pasar.
 *
 * Jawabannya: tf yang dibuka DIHITUNG dari `setelan.tf` (`bukaTf`).
 */
import { useMemo } from 'react';
import type { Pasar } from './api';
import type { Setelan } from './simpan';
import { bukaTf } from './tfPengganti';

export type PasarTf = {
  pasar: Pasar | null;
  /** Yang dibuka — `setelan.tf`, atau penggantinya kalau pasar ini tidak punya. */
  tf: string;
  /** Kalimat penggantian; kosong = tidak ada yang diganti. */
  kataTf: string;
  /** Orangnya memilih tf sendiri — itu yang disimpan. */
  pilihTf: (tf: string) => void;
  /** Ganti pasar TANPA menyentuh tf yang diminta. */
  pilihPasar: (p: Pasar) => void;
};

/**
 * Pasar dan tf layar Pasar, SELURUHNYA dari setelan + daftar pasar.
 *
 * Tidak ada `useState` di sini, dan itu intinya: yang tidak disalin tidak
 * bisa basi. Ketukan kabar (App.tsx menyimpan `{pasar, tf}` lalu pindah tab)
 * langsung terbaca di render berikutnya, juga kalau layar ini sudah terbuka
 * dan dibekukan `enableFreeze`.
 */
export function usePasarTf(setelan: Setelan, simpan: (s: Setelan) => void, daftar: readonly Pasar[]): PasarTf {
  const pasar = useMemo(
    () => daftar.find((x) => x.simbol === setelan.pasar) ?? daftar[0] ?? null,
    [daftar, setelan.pasar],
  );
  const { tf, kataTf } = bukaTf(pasar, setelan.tf);
  return {
    pasar,
    tf,
    kataTf,
    pilihTf: (k) => { simpan({ ...setelan, pasar: pasar?.simbol ?? setelan.pasar, tf: k }); },
    /* `tf` TIDAK ikut disimpan: yang tersimpan tetap yang diminta orangnya.
       Menyimpan pengganti (d1) membuat BTCUSDT berikutnya terbuka d1 tanpa
       satu kalimat pun — bentuk lain dari mengganti pilihan diam-diam. */
    pilihPasar: (p) => { simpan({ ...setelan, pasar: p.simbol }); },
  };
}
