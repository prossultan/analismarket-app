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
const MATAHARI = 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4';
const BULAN = 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z';

/* ── Redesain Okt 2026 (mockup polish-2026) — gaya yang sama: garis 1,8,
   ujung bulat, kotak 24. Bukan salinan web: web tidak punya layar ini. */
const LIN = (cx: number, cy: number, r: number): string => `M${String(cx - r)} ${String(cy)}a${String(r)} ${String(r)} 0 1 0 ${String(r * 2)} 0a${String(r)} ${String(r)} 0 1 0 ${String(-r * 2)} 0`;
const TAMBAHAN = {
  info: `${LIN(12, 12, 8.5)}M12 11v5M12 8h.01`,
  akademi: 'M2.5 9.2L12 4.5l9.5 4.7L12 14zM6.5 11.4v4.5c0 1.6 2.5 3.1 5.5 3.1s5.5-1.5 5.5-3.1v-4.5M21.5 9.2v5.3',
  mata: `M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z${LIN(12, 12, 2.8)}`,
  kilat: 'M13 2.8L5 13.5h6l-1 7.7 8-10.7h-6z',
  jam: `${LIN(12, 12, 8.5)}M12 7.5V12l3 2`,
  kirim: 'M20.5 4L3.5 10.8l6.3 2.1 2.1 6.3L15.3 15l4.2 3.3zM9.8 12.9l5.5-4.4',
  dua: 'M3.5 5h7.5v14H3.5zM13 5h7.5v14H13z',
  gembok: 'M5 10.5h14v10H5zM8.2 10.5V8a3.8 3.8 0 017.6 0v2.5',
  putar: 'M8 5.2v13.6l11-6.8z',
  jeda: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  kanan: 'M9.5 5.5L16 12l-6.5 6.5',
  kiri: 'M14.5 5.5L8 12l6.5 6.5',
  cari: `${LIN(11, 11, 6.5)}M20 20l-4.2-4.2`,
  salin: 'M8.5 8.5h11v11h-11zM15.5 8.5V6A1.5 1.5 0 0014 4.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5',
  tempel: 'M5 4.5h14v16.5H5zM9 4.5v-1h6v1M9 11h6M9 15h4',
  keluar: 'M9.5 20.5H6A1.5 1.5 0 014.5 19V5A1.5 1.5 0 016 3.5h3.5M15.5 16.5L20 12l-4.5-4.5M20 12H9.5',
  hapus: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5',
  perisai: 'M12 3L4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z',
  dokumen: 'M14 3.5H7A1.5 1.5 0 005.5 5v14A1.5 1.5 0 007 20.5h10a1.5 1.5 0 001.5-1.5V8zM14 3.5V8h4.5M9 12.5h6M9 16h6',
  target: `${LIN(12, 12, 8.5)}${LIN(12, 12, 4.5)}M12 12h.01`,
  tren: 'M3.5 16.5L9 11l3.5 3.5 8-8M15 6.5h5.5V12',
  lapis: 'M12 3.5l8.5 4.5L12 12.5 3.5 8zM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5',
  centang: 'M5 12.5l4.4 4.4L19 7.4',
  silang: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  ulang: 'M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4.5v4h-4',
  saring: `M4 7h10M18 7h2M4 17h4M12 17h8${LIN(16, 7, 2)}${LIN(10, 17, 2)}`,
} as const;

export const JALUR = {
  tambah: TAMBAH, kisi: KISI, turunkan: TURUNKAN, matahari: MATAHARI, bulan: BULAN,
  rumah: RUMAH, pasar: PASAR, analisis: ANALISIS, plus: PLUS,
  kabar: KABAR, profil: PROFIL, lainnya: LAINNYA, kalender: KALENDER, buku: BUKU, gir: GIR,
  ...TAMBAHAN,
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
