/**
 * LATAR — obsidian dengan cahaya amber di atas, sama dengan hero landing
 * (`radial-gradient(ellipse 74% 510px at 50% …, #4c331b, #2e2114, #161009)`).
 *
 * Kenapa ada: kaca yang duduk di atas latar datar terbaca sebagai panel abu
 * biasa — di belakangnya tidak ada apa pun untuk dibiaskan (temuan 19 Sep,
 * diulang di mockup polish-2026). Cahaya ini yang memberi kartu kaca
 * "sesuatu di belakangnya".
 *
 * Layar tetap BERLATAR PADAT, dan itu disengaja: layar transparan di
 * native-stack membuat layar sebelumnya ikut terlihat selama transisi geser.
 * Jadi cahayanya digambar per layar, sekali — SVG statis, tanpa animasi,
 * tanpa kerja per frame. Layar yang dibekukan (enableFreeze) tidak
 * menggambarnya ulang.
 */
import { memo, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { W } from '../gaya/token';

type Props = {
  children?: ReactNode;
  gaya?: StyleProp<ViewStyle>;
  /** `redup` untuk layar yang isinya padat (chart, daftar panjang). */
  kuat?: 'penuh' | 'redup';
};

export function Latar({ children, gaya, kuat = 'penuh' }: Props) {
  return (
    <View style={[g.akar, { backgroundColor: W.latar }, gaya]}>
      <Cahaya kuat={kuat} warna={W.cahaya[0]} tengah={W.cahaya[1]} tepi={W.cahaya[2]} />
      {children}
    </View>
  );
}

/* Memo: warnanya cuma berubah saat tema berganti, dan saat itu akar navigasi
   memang di-remount. Tanpa memo, tiap render layar membangun ulang SVG-nya. */
const Cahaya = memo(function Cahaya({ kuat, warna, tengah, tepi }: { kuat: 'penuh' | 'redup'; warna: string; tengah: string; tepi: string }) {
  const { width } = useWindowDimensions();
  const tinggi = 520;
  return (
    <View pointerEvents="none" style={[g.cahaya, { height: tinggi, opacity: kuat === 'penuh' ? 1 : 0.62 }]}>
      <Svg width={width} height={tinggi}>
        <Defs>
          <RadialGradient id="cahaya-latar" cx="50%" cy="0%" rx="78%" ry="100%" fx="50%" fy="0%">
            <Stop offset="0" stopColor={warna} stopOpacity={1} />
            <Stop offset="0.34" stopColor={tengah} stopOpacity={0.92} />
            <Stop offset="0.66" stopColor={tepi} stopOpacity={0.55} />
            <Stop offset="1" stopColor={tepi} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={-40} rx={width * 0.95} ry={tinggi} fill="url(#cahaya-latar)" />
      </Svg>
    </View>
  );
});

const g = StyleSheet.create({
  akar: { flex: 1 },
  cahaya: { position: 'absolute', left: 0, right: 0, top: 0 },
});
