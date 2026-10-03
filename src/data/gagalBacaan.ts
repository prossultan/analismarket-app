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
/**
 * `pasar` dan `tf` = permintaan yang DITOLAK, dibawa bersama jawabannya.
 * Judul lembar dicetak dari sini, bukan dari tf yang sedang terbuka saat
 * render: sampai 3 Okt 402 m5 yang tiba sesudah orangnya kembali ke h1
 * tercetak "h1 XAU/USD bagian dari AnalisMarket+" — untuk tf gratis.
 */
export type GagalBacaan = { jenis: JenisGagalBacaan; kalimat: string; pasar: string; tf: string };

/** Bentuk kegagalan `ambil()` di `antrian.ts`, disalin tanpa impor. */
type GagalAntrian = { jenis: 'jaringan' | 'ditolak' | 'batas'; kalimat: string; galat?: string };

export function gagalBacaan(j: GagalAntrian, diminta: { pasar: string; tf: string }): GagalBacaan {
  const { pasar, tf } = diminta;
  /* `galat` dulu, BUKAN kode status — pelajaran yang sama dengan
     `perlu-telegram` (409) di `saya.ts`: kode status bisa dipakai bersama
     oleh dua arti, `galat` tidak. */
  if (j.galat === 'perlu-plus') return { jenis: 'plus', kalimat: j.kalimat, pasar, tf };
  if (j.jenis === 'batas') return { jenis: 'batas', kalimat: j.kalimat, pasar, tf };
  if (j.jenis === 'ditolak') return { jenis: 'ditolak', kalimat: j.kalimat, pasar, tf };
  return { jenis: 'jaringan', kalimat: j.kalimat, pasar, tf };
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
export function isiLembarGagal(g: GagalBacaan): IsiLembarGagal {
  switch (g.jenis) {
    case 'plus':
      return {
        label: 'AnalisMarket+',
        judul: `${g.tf.toLowerCase()} ${g.pasar} bagian dari AnalisMarket+`,
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
