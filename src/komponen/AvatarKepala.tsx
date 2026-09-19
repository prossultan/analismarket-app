/**
 * AVATAR DI KANAN KEPALA — huruf awal nama, cincin emas kalau AM+.
 * Ketukan membuka Profil. Kepala yang punya "orangnya" di kanan adalah
 * pola app 2026; chip "PLUS+" yang dulu di situ sudah ada sebagai tab.
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSesi } from '../layar/Akun';
import { W } from '../gaya/token';

export function AvatarKepala({ onPress }: { onPress: () => void }) {
  const sesi = useSesi();
  const nama = sesi?.akun.nama ?? '';
  /* 'A' dari AnalisMarket, bukan '·': titik terbaca seperti avatar yang
     gagal dimuat. Nama tampilan Telegram boleh kosong, dan itu sah. */
  const huruf = nama.trim().charAt(0).toUpperCase() || 'A';
  const plus = sesi?.akun.langganan === 'plus';
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Profil"
      style={({ pressed }) => [g.akar, plus && g.plus, pressed && { transform: [{ scale: 0.94 }] }]}>
      <Text style={[g.huruf, plus && { color: '#1A1508' }]}>{huruf}</Text>
    </Pressable>
  );
}

const g = StyleSheet.create({
  akar: {
    width: 30, height: 30, borderRadius: 15, marginRight: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  plus: { backgroundColor: '#D6BE7E', borderColor: 'rgba(201,169,97,0.7)' },
  huruf: { fontSize: 12, fontWeight: '700', color: W.teks },
});
