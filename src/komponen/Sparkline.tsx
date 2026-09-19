/**
 * SPARKLINE — garis mini dari deret harga tutup, dengan isian pudar di bawahnya.
 * Warna ikut arah: dari titik pertama ke terakhir. Tidak ada sumbu, tidak ada
 * label — ia hiasan yang jujur, bukan chart.
 */
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { W } from '../gaya/token';

export function Sparkline({ data, lebar, tinggi, warna }: { data: readonly number[]; lebar: number; tinggi: number; warna?: string }) {
  if (data.length < 2) return <Svg width={lebar} height={tinggi} />;
  const min = Math.min(...data), maks = Math.max(...data);
  const rentang = maks - min || 1;
  const pad = 3;
  const x = (i: number): number => pad + (i / (data.length - 1)) * (lebar - pad * 2);
  const y = (v: number): number => pad + (1 - (v - min) / rentang) * (tinggi - pad * 2);
  const titik = data.map((v, i) => `${x(i).toFixed(1)} ${y(v).toFixed(1)}`);
  const garis = `M ${titik.join(' L ')}`;
  const isi = `${garis} L ${x(data.length - 1).toFixed(1)} ${tinggi} L ${x(0).toFixed(1)} ${tinggi} Z`;
  const w = warna ?? ((data[data.length - 1] ?? 0) >= (data[0] ?? 0) ? W.naik : W.turun);
  const id = `sp-${w.replace('#', '')}`;
  return (
    <Svg width={lebar} height={tinggi}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={w} stopOpacity={0.28} />
          <Stop offset="1" stopColor={w} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={isi} fill={`url(#${id})`} />
      <Path d={garis} fill="none" stroke={w} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
