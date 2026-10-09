/**
 * LILIN MINI — 20 lilin terakhir yang ASLI dari `/api/bacaan`, untuk kartu
 * "Coba di chart" di pelajaran Akademi. Lewat antrean yang sama dengan tab
 * Pasar (simpanan 20 detik), jadi membuka chart-nya sesudah ini gratis.
 *
 * `bedah` (pelajaran candlestick): lilin terakhir diperbesar di samping dan
 * keempat harganya dinamai — H, O, C, L — di posisinya sendiri.
 * Gagal memuat = kalimat sebabnya, bukan kotak kosong.
 */
import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgTeks, Path } from 'react-native-svg';
import { ambilBacaan, type Lilin } from '../data/api';
import { W } from '../gaya/token';
import { Rangka } from './mockup';

const HIJAU = '#10B981';
const MERAH = '#F43F5E';
const AMBER = '#E5AD51';

export const LilinMini = memo(function LilinMini({ pasar, tf, bedah = false }: { pasar: string; tf: string; bedah?: boolean }) {
  const [lilin, setLilin] = useState<Lilin[] | null>(null);
  const [sebab, setSebab] = useState<string | null>(null);
  useEffect(() => {
    let hidup = true;
    void ambilBacaan(pasar, tf).then((b) => {
      if (!hidup) return;
      if (!b.ok) { setSebab(b.kalimat); return; }
      setSebab(null);
      setLilin(b.isi.lilin.slice(-20));
    });
    return () => { hidup = false; };
  }, [pasar, tf]);
  const { width } = useWindowDimensions();
  const w = width - 32 - 28;
  const h = 118;

  if (sebab !== null) return <Text style={g.sebab}>{sebab}</Text>;
  if (lilin === null || lilin.length < 2) return <View style={{ height: h, justifyContent: 'center', gap: 8 }}><Rangka lebar="70%" tinggi={10} /><Rangka lebar="50%" tinggi={10} /></View>;

  const areaW = bedah ? w * 0.56 : w;
  const nil = lilin.flatMap((l) => [l.tinggi, l.rendah]);
  const mn = Math.min(...nil); const mx = Math.max(...nil);
  const y = (v: number): number => 8 + ((mx - v) / ((mx - mn) || 1)) * (h - 16);
  const cw = areaW / lilin.length;
  const ak = lilin[lilin.length - 1] as Lilin;
  const naik = ak.tutup >= ak.buka;
  const zx = areaW + (w - areaW) * 0.32;
  const top = 10; const bot = h - 10;
  const zy = (v: number): number => top + ((ak.tinggi - v) / ((ak.tinggi - ak.rendah) || 1)) * (bot - top);
  const label: [number, string, string][] = [
    [zy(ak.tinggi), 'H', 'tertinggi'],
    [zy(naik ? ak.tutup : ak.buka), naik ? 'C' : 'O', naik ? 'tutup' : 'buka'],
    [zy(naik ? ak.buka : ak.tutup), naik ? 'O' : 'C', naik ? 'buka' : 'tutup'],
    [zy(ak.rendah), 'L', 'terendah'],
  ];
  /* Label tidak boleh bertumpuk, dan tidak boleh keluar bingkai. */
  for (let i = 1; i < label.length; i++) { const a = label[i - 1] as [number, string, string]; const b = label[i] as [number, string, string]; if (b[0] - a[0] < 13) b[0] = a[0] + 13; }
  const terakhir = label[label.length - 1] as [number, string, string]; terakhir[0] = Math.min(terakhir[0], h - 6);
  for (let i = label.length - 2; i >= 0; i--) { const a = label[i] as [number, string, string]; const b = label[i + 1] as [number, string, string]; if (b[0] - a[0] < 13) a[0] = b[0] - 13; }

  return (
    <Svg width={w} height={h}>
      {[0, 1, 2, 3].map((i) => <Line key={i} x1={0} x2={areaW + 6} y1={8 + (i * (h - 16)) / 3} y2={8 + (i * (h - 16)) / 3} stroke={W.tinta(0.06)} />)}
      {lilin.map((l, i) => {
        const cx = i * cw + cw / 2; const up = l.tutup >= l.buka; const col = up ? HIJAU : MERAH; const akhir = i === lilin.length - 1;
        return (
          <G key={l.waktu}>
            <Line x1={cx} x2={cx} y1={y(l.tinggi)} y2={y(l.rendah)} stroke={col} strokeWidth={1} opacity={akhir ? 1 : 0.75} />
            <Rect x={cx - cw * 0.32} y={y(Math.max(l.buka, l.tutup))} width={cw * 0.64} height={Math.max(1, Math.abs(y(l.buka) - y(l.tutup)))} fill={col} rx={0.6} opacity={akhir ? 1 : 0.75} />
            {akhir && <Rect x={cx - cw * 0.8} y={y(l.tinggi) - 4} width={cw * 1.6} height={y(l.rendah) - y(l.tinggi) + 8} rx={3} fill="rgba(229,173,81,0.08)" stroke={AMBER} strokeWidth={1.1} strokeDasharray={[2.5, 2]} />}
          </G>
        );
      })}
      {bedah && (
        <>
          <Path d={`M${String((lilin.length - 1) * cw + cw * 1.3)} ${String(y(ak.tinggi) - 4)} L${String(zx - 14)} ${String(top - 2)}`} stroke="rgba(229,173,81,0.45)" strokeDasharray={[2, 3]} fill="none" />
          <Path d={`M${String((lilin.length - 1) * cw + cw * 1.3)} ${String(y(ak.rendah) + 4)} L${String(zx - 14)} ${String(bot + 2)}`} stroke="rgba(229,173,81,0.45)" strokeDasharray={[2, 3]} fill="none" />
          <Rect x={zx - 24} y={top - 6} width={48} height={bot - top + 12} rx={9} fill={W.tinta(0.04)} stroke={W.tinta(0.1)} />
          <Line x1={zx} x2={zx} y1={zy(ak.tinggi)} y2={zy(ak.rendah)} stroke={naik ? HIJAU : MERAH} strokeWidth={2.2} strokeLinecap="round" />
          <Rect x={zx - 10} y={zy(Math.max(ak.buka, ak.tutup))} width={20} height={Math.max(3, Math.abs(zy(ak.buka) - zy(ak.tutup)))} rx={2.5} fill={naik ? HIJAU : MERAH} />
          {label.map(([yy, k, t]) => (
            <G key={k}>
              <Line x1={zx + 12} x2={zx + 30} y1={yy} y2={yy} stroke="rgba(229,173,81,0.6)" />
              <SvgTeks x={zx + 35} y={yy + 3.6} fontSize={10.5} fontWeight="700" fill={AMBER}>{k}</SvgTeks>
              <SvgTeks x={zx + 49} y={yy + 3.6} fontSize={10.5} fill={W.teksRedup}>{t}</SvgTeks>
            </G>
          ))}
        </>
      )}
    </Svg>
  );
});

const g = StyleSheet.create({
  sebab: { fontSize: 12.5, color: '#BDB5A9', lineHeight: 18, paddingVertical: 10 },
});
