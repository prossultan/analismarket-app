/**
 * KENAPA BACAAN TIDAK DATANG — murni, tanpa impor.
 *
 * `/api/bacaan` menolak dengan DUA jawaban yang punya arti produk, dan
 * keduanya bukan gangguan:
 *
 *   402 `perlu-plus`    m1/m5 emas & forex untuk akun tanpa AM+
 *                       (`tolakBerkuota` di `src/lib/api-bacaan.ts` bot)
 *   429 `batas-harian`  jatah m1/m5 pelanggan hari ini sudah terpakai
 *
 * Sampai 3 Okt layar Pasar memperlakukan SEMUA kegagalan sama: "tidak
 * tersambung · Mesin tidak menjawab · Coba lagi". Untuk akun gratis yang
 * membuka XAU m5 itu kebohongan dua lapis — mesinnya menjawab, dan menekan
 * "Coba lagi" tidak akan pernah mengubah jawabannya. Pola yang sama sudah
 * dibuang dari layar akun pada 20 Sep (`KartuButuhPlus`); layar Pasar
 * tertinggal.
 *
 * Isi lembar untuk ajakan AM+ SENGAJA tanpa harga dan tanpa cara membeli,
 * di build mana pun: tombolnya cuma membuka tab PLUS+, dan tab itu sendiri
 * yang tunduk pada `TOKO_PLAY`. Satu tempat yang tahu soal toko, bukan dua.
 */

export type JenisGagalBacaan = 'plus' | 'batas' | 'ditolak' | 'jaringan';
export type GagalBacaan = { jenis: JenisGagalBacaan; kalimat: string };

/** Bentuk kegagalan `ambil()` di `antrian.ts`, disalin tanpa impor. */
type GagalAntrian = { jenis: 'jaringan' | 'ditolak' | 'batas'; kalimat: string; galat?: string };

export function gagalBacaan(j: GagalAntrian): GagalBacaan {
  /* `galat` dulu, BUKAN kode status — pelajaran yang sama dengan
     `perlu-telegram` (409) di `saya.ts`: kode status bisa dipakai bersama
     oleh dua arti, `galat` tidak. */
  if (j.galat === 'perlu-plus') return { jenis: 'plus', kalimat: j.kalimat };
  if (j.jenis === 'batas') return { jenis: 'batas', kalimat: j.kalimat };
  if (j.jenis === 'ditolak') return { jenis: 'ditolak', kalimat: j.kalimat };
  return { jenis: 'jaringan', kalimat: j.kalimat };
}

export type IsiLembarGagal = {
  label: string;
  judul: string;
  ket: string;
  /** `coba` = mengulang bisa mengubah jawabannya · `plus` = buka tab PLUS+ · `null` = tidak ada yang bisa ditekan. */
  aksi: 'coba' | 'plus' | null;
  emas: boolean;
};

/**
 * Isi lembar bawah layar Pasar saat bacaan tidak datang. "Coba lagi" HANYA
 * untuk kegagalan jaringan: mengulang permintaan yang sudah dijawab "butuh
 * AM+" atau "jatah habis" cuma menagih jatah laju untuk jawaban yang sama.
 */
export function isiLembarGagal(g: GagalBacaan, pasar: string, tf: string): IsiLembarGagal {
  switch (g.jenis) {
    case 'plus':
      return {
        label: 'AnalisMarket+',
        judul: `${tf.toLowerCase()} ${pasar} bagian dari AnalisMarket+`,
        ket: 'Timeframe lain untuk pasar ini tetap terbuka.',
        aksi: 'plus',
        emas: true,
      };
    case 'batas':
      return { label: 'jatah hari ini', judul: 'Jatah analisa hari ini habis', ket: g.kalimat, aksi: null, emas: false };
    case 'ditolak':
      return { label: 'tidak bisa dibaca', judul: 'Permintaan ditolak', ket: g.kalimat, aksi: null, emas: false };
    case 'jaringan':
      return { label: 'tidak tersambung', judul: 'Mesin tidak menjawab', ket: g.kalimat, aksi: 'coba', emas: false };
  }
}
