/**
 * Ikon bilah bawah — PATH-NYA DISALIN PERSIS dari `MenuBawah.tsx` di web.
 *
 * Bukan ikon yang "mirip". Bilah bawah adalah permukaan yang paling sering
 * dilihat orang, dan dua set ikon yang berbeda sedikit membuat app terasa
 * seperti tiruan web, bukan web yang sama di tempat lain.
 *
 * Gayanya juga ikut: 20x20, garis saja tanpa isian, tebal 1,8, ujung bulat.
 */
import Svg, { Path } from 'react-native-svg';

/** Satu-satunya yang TIDAK ada di web — web tidak punya Home. */
const RUMAH = 'M3 10.5L12 3l9 7.5M5.5 9.5V21h13V9.5';
const PASAR = 'M3 3v18h18M7 16l4-4 4 4 5-6';
const ANALISIS = 'M9 19V9m6 10V5m6 14v-8M3 19v-4';
const PLUS = 'M12 3l2.4 5.3 5.6.6-4.2 3.9 1.2 5.7L12 15.6 6.999 18.5l1.2-5.7L4 8.9l5.6-.6L12 3z';
const KABAR = 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0';
const PROFIL = 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
/* Mockup `kaca`: Lainnya adalah TIGA TITIK (•••), bukan tiga garis. */
const LAINNYA = 'M5 12h.01M12 12h.01M19 12h.01';
const KALENDER = 'M7 3v3m10-3v3M4 9h16M5 6h14v15H5z';
const BUKU = 'M4 5a2 2 0 012-2h13v18H6a2 2 0 01-2-2zM19 17H6';
/** Gir: lingkaran poros + enam gigi. Satu jalur, seperti yang lain. */
const GIR = 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3m0 14v3M4.2 4.2l2.2 2.2m11.2 11.2l2.2 2.2'
  + 'M2 12h3m14 0h3M4.2 19.8l2.2-2.2M17.6 6.4l2.2-2.2';

const TAMBAH = 'M12 5v14M5 12h14';
const KISI = 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z';
const TURUNKAN = 'M6 9l6 6 6-6';

export const JALUR = {
  tambah: TAMBAH, kisi: KISI, turunkan: TURUNKAN,
  rumah: RUMAH, pasar: PASAR, analisis: ANALISIS, plus: PLUS,
  kabar: KABAR, profil: PROFIL, lainnya: LAINNYA, kalender: KALENDER, buku: BUKU, gir: GIR,
} as const;

export type NamaIkon = keyof typeof JALUR;

export function Ikon({ nama, warna, ukuran = 20, isi, tebal = false }: {
  nama: NamaIkon; warna: string; ukuran?: number; isi?: string;
  /** Goresan lebih tebal — keadaan aktif untuk ikon yang jalurnya TERBUKA
      (grafik, lonceng): mengisinya menghasilkan bidang aneh, menebalkannya
      tidak. */
  tebal?: boolean;
}) {
  return (
    <Svg width={ukuran} height={ukuran} viewBox="0 0 24 24">
      <Path
        d={JALUR[nama]}
        fill={isi ?? 'none'}
        stroke={warna}
        strokeWidth={tebal ? 2.4 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
