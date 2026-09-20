/**
 * TOMBOL TAB di bilah pil — ikon + label, dan tab aktif disorot bulat
 * (mockup home-2026/kisi, mengikuti referensi pemilik). Menggantikan
 * tabBarIcon/tabBarLabel bawaan supaya sorotnya membungkus KEDUANYA.
 */
import { StyleSheet, Text, type GestureResponderEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { Tekan } from './Tekan';
import { KURVA_KELUAR, MS, type GayaGerak } from '../gaya/gerak';
import { useNavigationState } from '@react-navigation/native';
import { Ikon, type NamaIkon } from './Ikon';
import { W, H } from '../gaya/token';

export function TombolTab({ ikon, label, nama, emas = false, aktif = false, onPress, onLongPress }: {
  ikon: NamaIkon; label: string;
  /** Nama rute tab — keadaan aktif dibaca dari NAVIGATOR. `accessibilityState.selected`
      yang diteruskan bottom-tabs v7 kosong di runtime (terlihat di potret: tak ada tab
      yang disorot), jadi prop `aktif` cuma cadangan. */
  nama: string; emas?: boolean; aktif?: boolean;
  onPress?: ((e: GestureResponderEvent) => void) | null; onLongPress?: ((e: GestureResponderEvent) => void) | null;
}) {
  const dariNav = useNavigationState((st) => st.routes[st.index]?.name === nama);
  const aktifKini = dariNav || aktif;
  const warna = emas ? W.plus : aktifKini ? W.teksKuat : W.teksSamar;
  return (
    <Tekan onPress={onPress ?? undefined} onLongPress={onLongPress ?? undefined} gayaLuar={g.akar} gaya={{ flex: 1 }}
      accessibilityRole="tab" accessibilityState={{ selected: aktifKini }} accessibilityLabel={label}>
      {/* Pindah tab TIDAK dianimasikan — tab itu setara, bukan bertingkat, dan
          orang membayarnya puluhan kali sehari. Yang menyilang cuma latar
          pilnya, 120 ms: cukup untuk tidak "berkedip", tidak cukup untuk terasa. */}
      <Animated.View style={[g.pil, PIL_TRANSISI, aktifKini && g.pilAktif]}>
        <Ikon nama={ikon} warna={warna} ukuran={22} isi={emas ? W.plus : undefined} tebal={aktifKini} />
        <Text style={[g.label, { color: warna }, aktifKini && { fontWeight: '600' }]} numberOfLines={1}>{label}</Text>
      </Animated.View>
    </Tekan>
  );
}

/* Latar pil menyilang, bukan melompat. Di luar StyleSheet: tipenya milik Reanimated. */
const PIL_TRANSISI = {
  backgroundColor: 'rgba(255,255,255,0)',
  transitionProperty: 'backgroundColor', transitionDuration: MS.tekan, transitionTimingFunction: KURVA_KELUAR,
} satisfies GayaGerak;

const g = StyleSheet.create({
  akar: { flex: 1, paddingVertical: 6, paddingHorizontal: 3 },
  pil: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pilAktif: { backgroundColor: 'rgba(255,255,255,0.10)' },
  label: { fontSize: H.alat, fontWeight: '500' },
});
