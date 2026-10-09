/**
 * AVATAR DI KANAN KEPALA — huruf awal nama, cincin emas kalau AM+.
 * Ketukan membuka Profil. Kepala yang punya "orangnya" di kanan adalah
 * pola app 2026; chip "PLUS+" yang dulu di situ sudah ada sebagai tab.
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import { gayaTema } from '../gaya/tema';
import { useSesi } from '../layar/Akun';
import { useStatusPlus } from '../data/statusPlus';
import { W } from '../gaya/token';

export function AvatarKepala({ onPress, ukuran = 30, label = 'Profil' }: { onPress: () => void; ukuran?: number; label?: string }) {
  const sesi = useSesi();
  const nama = sesi?.akun.nama ?? '';
  /* 'A' dari AnalisMarket, bukan '·': titik terbaca seperti avatar yang
     gagal dimuat. Nama tampilan Telegram boleh kosong, dan itu sah. */
  const huruf = nama.trim().charAt(0).toUpperCase() || 'A';
  /* Cincin emas dari jawaban /api/saya, bukan dari sesi: sesi Google tidak
     tahu status langganan, dan pelanggan Google dulu tampil tanpa cincin. */
  const plus = useStatusPlus() === 'plus';
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [g.akar, { width: ukuran, height: ukuran, borderRadius: ukuran / 2 }, plus && g.plus, pressed && { transform: [{ scale: 0.94 }] }]}>
      <Text style={[g.huruf, { fontSize: Math.round(ukuran * 0.4) }, plus && { color: W.utamaTeks }]}>{huruf}</Text>
    </Pressable>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akar: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: W.kartuTerang, borderWidth: 1.5, borderColor: W.tinta(0.14),
  },
  /* AM+: isian amber + cincin tipis — satu-satunya avatar berisi di app. */
  plus: { backgroundColor: '#E9B65C', borderColor: 'rgba(240,191,107,0.85)' },
  huruf: { fontWeight: '800', color: W.teks },
}));
