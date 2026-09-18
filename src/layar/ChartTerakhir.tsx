/**
 * TAB CHART — membuka pasar yang terakhir dilihat.
 *
 * `LayarChart` butuh objek pasar utuh (desimal, daftar timeframe, label),
 * bukan cuma simbolnya: desimal yang salah mencetak harga yang salah, dan
 * daftar timeframe yang salah menawarkan tombol yang akan ditolak bot. Jadi
 * tab ini mencari pasarnya di daftar — yang sudah ada di simpanan 20 detik,
 * jadi hampir selalu tanpa panggilan jaringan sama sekali.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ambilPasar, type Pasar } from '../data/api';
import { Kosong, Memuat } from '../komponen/dasar';
import { LayarChart } from './Chart';
import type { Setelan } from '../data/simpan';

type Props = { setelan: Setelan; simpan: (s: Setelan) => void };

/**
 * Yang dibutuhkan dari navigasi, dan cuma itu.
 *
 * Tipe penuh react-navigation untuk lompat ANTAR tumpukan butus generik
 * berlapis yang tidak menjelaskan apa pun di tempat pemakaiannya. Satu
 * antarmuka sempit menyatakan maksudnya langsung — dan tetap bertipe.
 */
type Penyeberang = { navigate: (tab: string, isi: { screen: string; params: unknown }) => void };

export function LayarChartTerakhir({ setelan, simpan }: Props) {
  const nav = useNavigation() as unknown as Penyeberang;
  const [pasar, setPasar] = useState<Pasar | null>(null);
  const [keadaan, setKeadaan] = useState<'memuat' | 'ada' | 'gagal'>('memuat');
  const [sebab, setSebab] = useState('');

  const muat = useCallback(async (): Promise<void> => {
    const j = await ambilPasar();
    if (!j.ok) { setKeadaan('gagal'); setSebab(j.kalimat); return; }
    /* Pasar tersimpan bisa hilang dari daftar (volume turun di bawah ambang).
       Jatuh ke yang teramai, dan itu BUKAN diam-diam — simbolnya tertulis
       besar di bilah chart, jadi orang melihat apa yang sedang ia buka. */
    const p = j.isi.pasar.find((x) => x.simbol === setelan.pasar) ?? j.isi.pasar[0] ?? null;
    setPasar(p);
    setKeadaan(p === null ? 'gagal' : 'ada');
    if (p === null) setSebab('Daftar pasar kosong.');
  }, [setelan.pasar]);

  useEffect(() => { void muat(); }, [muat]);

  if (keadaan === 'memuat') return <Memuat teks="Membuka chart terakhir…" />;
  if (keadaan === 'gagal' || pasar === null) {
    return <Kosong judul="Chart tidak bisa dibuka" sebab={sebab} aksi={() => { void muat(); }} />;
  }

  const punya = pasar.timeframes.map((t) => t.toLowerCase());
  const tf = punya.includes(setelan.tf) ? setelan.tf : (punya[0] ?? 'h1');

  return (
    <LayarChart
      pasar={pasar}
      tf={tf}
      gantiTf={(t) => { simpan({ ...setelan, pasar: pasar.simbol, tf: t }); }}
      bukaBacaan={(m) => {
        /* Tab ini bukan tumpukan Pasar, jadi ia menyeberang ke sana —
           satu tempat saja yang memiliki layar Bacaan. */
        nav.navigate('pasar', { screen: 'Bacaan', params: { pasar, tf, mesin: m } });
      }}
    />
  );
}
