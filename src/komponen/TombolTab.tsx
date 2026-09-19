/**
 * TOMBOL TAB di bilah pil — ikon + label, dan tab aktif disorot bulat
 * (mockup home-2026/kisi, mengikuti referensi pemilik). Menggantikan
 * tabBarIcon/tabBarLabel bawaan supaya sorotnya membungkus KEDUANYA.
 */
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
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
    <Pressable onPress={onPress ?? undefined} onLongPress={onLongPress ?? undefined} style={g.akar}
      accessibilityRole="tab" accessibilityState={{ selected: aktifKini }} accessibilityLabel={label}>
      <View style={[g.pil, aktifKini && g.pilAktif]}>
        <Ikon nama={ikon} warna={warna} ukuran={22} isi={emas ? W.plus : undefined} tebal={aktifKini} />
        <Text style={[g.label, { color: warna }, aktifKini && { fontWeight: '600' }]} numberOfLines={1}>{label}</Text>
      </View>
    </Pressable>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, paddingVertical: 6, paddingHorizontal: 3 },
  pil: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pilAktif: { backgroundColor: 'rgba(255,255,255,0.10)' },
  label: { fontSize: H.alat, fontWeight: '500' },
});
