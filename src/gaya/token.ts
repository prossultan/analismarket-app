/**
 * SATU SUMBER untuk warna, huruf, dan jarak.
 *
 * Nilainya disalin dari `analismarket-web/src/gaya/dasar.css` dan
 * `terminal.css` — bukan ditebak supaya "mirip". Dua permukaan yang memakai
 * dua palet adalah cara tercepat membuat app terbaca seperti tiruan.
 */

export const W = {
  /** obsidian hangat — latar halaman */
  latar: '#0C0B09',
  latar900: '#11100D',
  /** permukaan kartu */
  kartu: '#161512',
  kartuTerang: '#1C1A17',
  garis: '#252321',
  garisSamar: 'rgba(255,255,255,0.06)',

  teks: '#CFCECB',
  teksKuat: '#E8E7E5',
  teksRedup: '#A7A4A1',
  teksSamar: '#84827E',

  naik: '#10B981',
  turun: '#F43F5E',
  tanda: '#FD9829',

  /**
   * EMAS CUMA UNTUK AnalisMarket+.
   *
   * Bukan selera. Di web emas berarti satu hal saja, dan begitu ia dipakai
   * untuk "terpilih" juga, ia berhenti berarti apa pun. Keadaan terpilih
   * memakai `teksKuat` — putih hangat, bukan emas.
   */
  plus: '#C9A961',
  plusRedup: 'rgba(201,169,97,0.14)',
} as const;

/**
 * TANGGA HURUF — enam ukuran, tiga bobot, dan tidak lebih.
 * 20 harga · 18 status · 14 nama · 13 nilai · 12 kontrol · 10 label.
 */
export const H = {
  harga: 20,
  status: 18,
  nama: 14,
  nilai: 13,
  kontrol: 12,
  label: 10,
} as const;

export const J = { x1: 4, x2: 8, x3: 12, x4: 18, x5: 26 } as const;
export const R = { kecil: 4, sedang: 6, besar: 8, kartu: 12, bulat: 999 } as const;

/**
 * Angka TIDAK BOLEH bergeser saat digitnya berubah. Dipasang di tiap harga,
 * level, dan RR — bukan di gaya dasar, supaya yang bukan angka tidak ikut.
 */
export const ANGKA = { fontVariant: ['tabular-nums' as const] };

/** Label tidak pernah lebih tebal daripada nilainya. */
export const gayaLabel = {
  fontSize: H.label,
  fontWeight: '400' as const,
  color: W.teksSamar,
  letterSpacing: 0.6,
  textTransform: 'uppercase' as const,
};

export const gayaNilai = {
  fontSize: H.nilai,
  fontWeight: '500' as const,
  color: W.teksKuat,
  ...ANGKA,
};
