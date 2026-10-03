/**
 * KEADAAN LAYAR PASAR — pasar, timeframe, dan bacaan. Kait tanpa JSX dan
 * tanpa impor React Native, supaya `skrip/uji-keputusan.mjs` bisa
 * menjalankannya di React sungguhan.
 *
 * Bug 3 Okt di layar Pasar bentuknya sama: SALINAN LOKAL dari sesuatu yang
 * sudah punya sumber, ditambah jawaban jaringan yang tiba belakangan dan
 * menimpanya.
 *
 *   tf          `useState(setelan.tf)` dibaca sekali saat layar dipasang.
 *               Ketukan kabar menyimpan m15 ke setelan, layar yang sudah
 *               terbuka tetap h1. Tf PENGGANTI (d1 untuk EURUSDT) ditulis
 *               balik ke setelan, jadi pasar berikutnya mewarisi d1. Dan
 *               kalimat penggantiannya dihapus efek muat daftar yang selesai
 *               sesudah pilihan pasar.
 *   bacaan      402 m5 yang tiba sesudah orangnya kembali ke h1 menimpa
 *               bacaan h1 dengan tembok AM+ — tanpa Coba lagi.
 *
 * Jawabannya: tf yang dibuka DIHITUNG dari `setelan.tf` (`bukaTf`), dan
 * jawaban bacaan yang bukan milik permintaan terakhir DIBUANG.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ambilBacaan, type Bacaan, type Pasar } from './api';
import type { Jawaban } from './antrian';
import { gagalBacaan, type GagalBacaan } from './gagalBacaan';
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

type AmbilBacaan = (pasar: string, tf: string, segarkan?: boolean) => Promise<Jawaban<Bacaan>>;

export type BacaanPasar = {
  bacaan: Bacaan | null;
  /** Penolakan untuk permintaan YANG SEDANG DIBUKA — tidak pernah milik tf sebelumnya. */
  gagalBaca: GagalBacaan | null;
  /** Tombol "Coba lagi": permintaan baru untuk pasar/tf yang sedang dibuka. */
  muatUlang: () => void;
};

/**
 * Bacaan untuk satu pasar × tf. `ambil` bisa diganti — uji memakai tiruan
 * yang menjawab dalam urutan yang ia pilih; layar memakai `ambilBacaan`.
 */
export function useBacaanPasar(simbol: string | null, tf: string, ambil: AmbilBacaan = ambilBacaan): BacaanPasar {
  const [bacaan, setBacaan] = useState<Bacaan | null>(null);
  const [gagalBaca, setGagalBaca] = useState<GagalBacaan | null>(null);
  /* Nomor permintaan terakhir. Antrean (`JARAK_MS` 1.100) dan simpanan 20
     detik membuat jawaban tiba TIDAK berurutan: h1 dari simpanan seketika,
     m5 yang diminta lebih dulu menyusul sedetik kemudian. Yang menang adalah
     permintaan TERAKHIR, bukan jawaban terakhir. */
  const nomor = useRef(0);

  const muat = useCallback(async (s: string, t: string, segarkan: boolean): Promise<void> => {
    nomor.current += 1;
    const ini = nomor.current;
    const j = await ambil(s, t, segarkan);
    if (ini !== nomor.current) return;
    if (!j.ok) {
      setGagalBaca(gagalBacaan({ jenis: j.jenis, kalimat: j.kalimat, galat: j.galat }, { pasar: s, tf: t }));
      setBacaan(null);
      return;
    }
    setGagalBaca(null);
    setBacaan(j.isi);
  }, [ambil]);

  useEffect(() => {
    if (simbol === null) return;
    /* Penolakan tf sebelumnya ikut dibuang, bukan cuma bacaannya: selama
       antre, lembar bawah sempat mencetak "h1 XAU/USD bagian dari
       AnalisMarket+" dari 402 milik m5. */
    setBacaan(null);
    setGagalBaca(null);
    void muat(simbol, tf, false);
  }, [simbol, tf, muat]);

  const muatUlang = useCallback((): void => {
    if (simbol !== null) void muat(simbol, tf, true);
  }, [simbol, tf, muat]);

  return { bacaan, gagalBaca, muatUlang };
}
