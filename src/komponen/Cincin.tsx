/**
 * CINCIN KEMAJUAN — busur amber di atas lingkaran redup, angka di tengah.
 * Satu komponen untuk bab Akademi, kartu member AM+, dan ringkasan pantauan.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { W } from '../gaya/token';

export function Cincin({ persen, ukuran = 40, tebal = 3.5, warna, children }: {
  persen: number; ukuran?: number; tebal?: number; warna?: string; children?: ReactNode;
}) {
  const r = (ukuran - tebal) / 2;
  const keliling = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, persen));
  return (
    <View style={{ width: ukuran, height: ukuran, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={ukuran} height={ukuran} style={StyleSheet.absoluteFill}>
        <Circle cx={ukuran / 2} cy={ukuran / 2} r={r} stroke={W.tinta(0.12)} strokeWidth={tebal} fill="none" />
        {p > 0 && (
          <Circle cx={ukuran / 2} cy={ukuran / 2} r={r} stroke={warna ?? W.plus} strokeWidth={tebal} fill="none" strokeLinecap="round"
            strokeDasharray={[keliling, keliling]} strokeDashoffset={keliling * (1 - p / 100)} transform={`rotate(-90 ${String(ukuran / 2)} ${String(ukuran / 2)})`} />
        )}
      </Svg>
      {children}
    </View>
  );
}
