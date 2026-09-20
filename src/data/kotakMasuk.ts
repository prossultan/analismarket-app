/**
 * LENCANA BELUM-DIBACA — satu angka bersama untuk Home, tab Kabar, dan kepala.
 *
 * "Realtime" di sini berarti: angkanya menyusul kejadian yang sebenarnya, bukan
 * menunggu orang membuka layar. Tiga pemicu penyegaran:
 *   1. push TIBA saat app terbuka (listener notifikasi) — inilah "pesan timbul";
 *   2. app kembali ke depan (AppState active) — push yang tiba saat app di latar;
 *   3. tindakan di kotak masuk sendiri (buka baris, tandai semua).
 * Ditambah tiap /api/saya yang memang sudah dipanggil Home.
 *
 * Tanpa polling: tidak ada timer yang menagih server tiap N detik untuk angka
 * yang hampir selalu sama.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ambilRingkas } from './saya';
import { sesiSekarang } from './sesi';

let jumlah = 0;
const pendengar = new Set<() => void>();

export function belumDibaca(): number { return jumlah; }
export function setBelumDibaca(n: number): void {
  if (n === jumlah) return;
  jumlah = n;
  for (const f of pendengar) f();
}

/** Tanya server sekali. Diam kalau gagal — lencana lama lebih baik daripada lencana yang berkedip. */
export async function segarkanBelumDibaca(): Promise<void> {
  if (sesiSekarang() === null) { setBelumDibaca(0); return; }
  const j = await ambilRingkas();
  if (j.ok) setBelumDibaca(j.isi.kabarBelumDibaca ?? 0);
}

export function useBelumDibaca(): number {
  const [n, setN] = useState(jumlah);
  useEffect(() => {
    const f = (): void => { setN(jumlah); };
    pendengar.add(f);
    return () => { pendengar.delete(f); };
  }, []);
  return n;
}

/**
 * Dipasang SEKALI di akar app. Mengembalikan pelepasnya.
 * Push yang tiba = ada baris baru di kotak masuk = lencana harus naik SEKARANG.
 */
export function pasangPenyegarLencana(): () => void {
  const notif = Notifications.addNotificationReceivedListener(() => { void segarkanBelumDibaca(); });
  const app = AppState.addEventListener('change', (st) => { if (st === 'active') void segarkanBelumDibaca(); });
  void segarkanBelumDibaca();
  return () => { notif.remove(); app.remove(); };
}
