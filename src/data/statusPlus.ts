/**
 * STATUS AM+ YANG BOLEH DICETAK — satu keputusan, satu catatan bersama.
 *
 * Sumber kebenarannya `/api/saya` (`ringkas.langganan`). Sesi cuma PETUNJUK:
 *
 *   mini   `akun.langganan` dari `/api/sambung/masuk` — benar saat menyambung,
 *          bisa basi dalam 12 jam umur sesinya.
 *   clerk  tidak tahu apa-apa. Sampai 3 Okt `JembatanClerk` MENGETIK
 *          `langganan: 'gratis'` untuk setiap akun Google, dan tiga permukaan
 *          membacanya mentah: layar Sambungkan ("Akun Google · Gratis"),
 *          baris Profil di Lainnya, dan cincin avatar. Pelanggan yang masuk
 *          lewat Google dibilang gratis di app yang sama yang dua ketukan
 *          kemudian menulis "AnalisMarket+ aktif".
 *
 * Aturannya: jawaban server menang; tanpa jawaban server, petunjuk sesi mini
 * boleh dipakai; selebihnya `null` — TIDAK DIKETAHUI, dicetak "—" atau tidak
 * dicetak, dan tidak pernah "Gratis".
 *
 * Catatannya dikunci pada SESI yang memintanya. Jawaban yang tiba sesudah
 * orangnya berganti akun bukan milik akun baru.
 */
import { useEffect, useState } from 'react';
import { dengarSesi, sesiSekarang, type Sesi } from './sesi';

export type StatusPlus = 'plus' | 'gratis';

/** Keputusan murni: apa yang boleh dicetak untuk sesi ini. */
export function statusTampil(
  sesi: { akun: { langganan: StatusPlus | null } } | null,
  dariServer: StatusPlus | null,
): StatusPlus | null {
  if (sesi === null) return null;
  if (dariServer !== null) return dariServer;
  return sesi.akun.langganan;
}

/** Label status. `null` dicetak em dash — tidak diketahui bukan gratis. */
export function labelStatus(s: StatusPlus | null): string {
  return s === 'plus' ? 'AnalisMarket+' : s === 'gratis' ? 'Gratis' : '—';
}

/** Identitas sesi untuk mengunci catatan. Dua sesi berbeda = dua kunci berbeda. */
export function kunciSesi(s: Sesi | null): string {
  if (s === null) return '';
  return [s.jenis ?? 'mini', s.sesi, String(s.akun.akunId), s.akun.email ?? '', s.akun.nama ?? ''].join('|');
}

let catatan: { kunci: string; status: StatusPlus } | null = null;
const pendengar = new Set<() => void>();

/**
 * Dicatat `ambilRingkas()` tiap kali server menjawab. `kunci` diambil
 * SEBELUM permintaan berangkat — kalau sesinya berganti di tengah jalan,
 * jawabannya dibuang.
 */
export function catatStatusPlus(kunci: string, status: StatusPlus): void {
  if (kunci === '' || kunci !== kunciSesi(sesiSekarang())) return;
  if (catatan?.kunci === kunci && catatan.status === status) return;
  catatan = { kunci, status };
  for (const f of pendengar) f();
}

/** Jawaban server terakhir untuk sesi ini, atau `null`. */
export function statusServer(sesi: Sesi | null): StatusPlus | null {
  return catatan !== null && catatan.kunci === kunciSesi(sesi) ? catatan.status : null;
}

/**
 * Status untuk permukaan yang TIDAK memuat `/api/saya` sendiri (avatar,
 * Lainnya). Tidak menembak jaringan: Home — layar pertama setiap kali app
 * dibuka — sudah memuatnya, dan permintaan kedua untuk angka yang sama cuma
 * menagih jatah orang lain di zona laju yang sama.
 */
export function useStatusPlus(): StatusPlus | null {
  const [sesi, setSesi] = useState<Sesi | null>(() => sesiSekarang());
  const [, setVersi] = useState(0);
  useEffect(() => {
    const f = (): void => { setVersi((v) => v + 1); };
    pendengar.add(f);
    const lepas = dengarSesi(setSesi);
    return () => { pendengar.delete(f); lepas(); };
  }, []);
  return statusTampil(sesi, statusServer(sesi));
}
