/**
 * SATU PINTU untuk "sudah dapat datanya, atau kenapa belum".
 *
 * `antrian.ts` dan `saya.ts` sudah bersusah payah memisahkan sebab kegagalan
 * — tidak terjangkau, ditolak, jatah habis, sesi mati — dan menyiapkan satu
 * kalimat untuk masing-masing. Lalu layarnya menulis `if (j.ok) setD(j.isi)`
 * dan SELURUH kerja itu dibuang di satu baris.
 *
 * Akibatnya bukan pesan galat yang jelek, melainkan keadaan yang tidak punya
 * nama sama sekali: `Home.tsx` menyetel `siap = true` tanpa data, dan cabang
 * rangkanya berbunyi `!siap || pasar === null` — jadi HP yang kehilangan
 * jaringan menampilkan rangka memuat SELAMANYA, tanpa sebab dan tanpa jalan
 * keluar. Tidak ada galat, tidak ada yang mengeluh, tidak ada yang tahu.
 *
 * Empat dari lima layar berdata membuangnya; satu (`Kalender`) tidak. Yang
 * salah karena itu bukan keempatnya satu-satu — melainkan tidak adanya satu
 * tempat yang memaksa jawabannya dibaca. Ini tempatnya.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Bentuk gabungan `Jawaban` (antrian) dan `JawabanSaya` (akun). Keduanya
 * sudah punya bentuk ini; yang di sini cuma menyatukan daftar `jenis`-nya
 * supaya satu hook bisa menampung dua-duanya tanpa cast.
 */
export type Jenis = 'jaringan' | 'ditolak' | 'batas' | 'sesi' | 'plus' | 'lain';
export type Hasil<T> = { ok: true; isi: T } | { ok: false; jenis: Jenis; kalimat: string };

/**
 * `basi` menandai data yang MASIH DITAMPILKAN padahal penyegaran terakhirnya
 * gagal — bukan keadaan galat, tapi juga bukan keadaan sehat.
 */
export type Keadaan<T> =
  | { fase: 'memuat' }
  | { fase: 'ada'; isi: T; basi: string | null }
  | { fase: 'gagal'; jenis: Jenis; kalimat: string };

export function useMuat<T>(ambil: (segarkan: boolean) => Promise<Hasil<T>>, kunci = ''): {
  keadaan: Keadaan<T>;
  /** Tarik-untuk-menyegarkan. Berbeda dari muat pertama: sudah ada isi di layar. */
  segarkan: () => void;
  menyegarkan: boolean;
  /** Dipakai tombol "Coba lagi" di layar gagal — kembali ke rangka memuat. */
  ulangi: () => void;
} {
  const [keadaan, setKeadaan] = useState<Keadaan<T>>({ fase: 'memuat' });
  const [menyegarkan, setMenyegarkan] = useState(false);
  /* Layar bisa dilepas sebelum jawabannya datang; menulis ke state sesudah
     itu adalah peringatan React yang tidak ada gunanya bagi siapa pun. */
  const hidup = useRef(true);
  useEffect(() => () => { hidup.current = false; }, []);

  /* `ambil` datang sebagai closure baru tiap render di layar yang belum
     membungkusnya dengan useCallback. Disimpan di ref supaya perubahan
     identitasnya tidak memicu pemuatan ulang tanpa henti.
     Yang menentukan kapan muat ulang karena itu `kunci`, BUKAN identitas
     fungsinya — eksplisit, dan tidak bisa berubah tanpa ada yang mengetiknya. */
  const ambilRef = useRef(ambil);
  ambilRef.current = ambil;

  const jalankan = useCallback(async (segarkan: boolean): Promise<void> => {
    /* `segarkan` diteruskan apa adanya ke pemanggil: simpanan 20 detik di
       `antrian.ts` harus DILEWATI saat orang menarik layarnya sendiri,
       kalau tidak tarik-untuk-menyegarkan cuma menyalin ulang isi yang sama. */
    const h = await ambilRef.current(segarkan);
    if (!hidup.current) return;
    if (h.ok) { setKeadaan({ fase: 'ada', isi: h.isi, basi: null }); return; }

    setKeadaan((sebelumnya) => {
      /* SESI MATI MENGOSONGKAN LAYAR, apa pun yang sedang terpampang.
         `saya.ts` sudah menghapus sesinya saat menerima 401, jadi yang masih
         terlihat adalah data milik akun yang sudah tidak tersambung. Menahannya
         di layar berarti orang berikutnya yang memegang HP itu membaca pantauan
         dan kredit orang lain. Ini SATU-SATUNYA sebab yang membuang isi. */
      if (h.jenis === 'sesi') return { fase: 'gagal', jenis: h.jenis, kalimat: h.kalimat };

      /* Belum ada apa pun di layar — tidak ada pilihan lain. */
      if (sebelumnya.fase !== 'ada') return { fase: 'gagal', jenis: h.jenis, kalimat: h.kalimat };

      /* Sisanya: isi lama DIPERTAHANKAN dan ditandai basi.
         Membuang isi karena satu tarikan meleset di lift menghukum orang atas
         keadaan jaringannya. Tapi angka lama yang terpampang seolah baru adalah
         kegagalan yang lebih mahal — karena itu `basi` bukan bendera diam-diam
         melainkan KALIMAT, dan layar yang menampilkannya wajib mencetaknya.
         `periksa-jawaban.mjs` menuntut itu.

         `batas` dan `plus` ikut ke sini dengan sadar: keduanya JAWABAN, bukan
         gangguan — datanya sah, cuma tidak boleh disegarkan lagi sekarang. */
      return { fase: 'ada', isi: sebelumnya.isi, basi: h.kalimat };
    });
  }, []);

  useEffect(() => { void jalankan(false); }, [jalankan, kunci]);

  return {
    keadaan,
    menyegarkan,
    segarkan: () => { setMenyegarkan(true); void jalankan(true).finally(() => { if (hidup.current) setMenyegarkan(false); }); },
    ulangi: () => { setKeadaan({ fase: 'memuat' }); void jalankan(false); },
  };
}
