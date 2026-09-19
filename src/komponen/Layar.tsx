/**
 * WADAH LAYAR BERTAB — menjawab kedua ujung chrome yang melayang.
 *
 * Kepala dan bilah tab keduanya berkaca, dan kaca hanya terbaca kalau isi
 * halaman benar-benar LEWAT DI BAWAHNYA. Harganya: baris pertama masuk ke
 * bawah kepala dan baris terakhir ke bawah bilah — dua-duanya tidak bisa
 * dijangkau kecuali layarnya menyisakan ruang di kedua ujung gulirannya.
 *
 * Tinggi kepalanya DITANYAKAN, bukan ditebak: ia berbeda antara iOS dan
 * Android, dan berbeda lagi di perangkat berponi. Angka yang ditebak akan
 * benar di satu HP dan memotong baris pertama di HP berikutnya — cacat yang
 * tidak pernah terlihat dari kode, cuma dari perangkatnya.
 */
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { SISA_BILAH, W } from '../gaya/token';

type Props = {
  children: ReactNode;
  /** false untuk layar yang mengatur gulirannya sendiri (chart). */
  gulir?: boolean;
  /** Jarak atas tambahan di bawah kepala. */
  atas?: number;
  gaya?: ViewStyle;
  segarkan?: ReactNode;
};

export function Layar({ children, gulir = true, atas = 0, gaya }: Props) {
  const tinggiKepala = useHeaderHeight();
  const isi = { paddingTop: tinggiKepala + atas, paddingBottom: SISA_BILAH };
  if (!gulir) return <View style={[g.akar, isi, gaya]}>{children}</View>;
  return (
    <ScrollView style={g.akar} contentContainerStyle={[isi, gaya]}>
      {children}
    </ScrollView>
  );
}

/** Jarak bawah saja — untuk layar tanpa kepala (chart). */
export function sisaBawah(): ViewStyle {
  return { paddingBottom: SISA_BILAH };
}

const g = StyleSheet.create({ akar: { flex: 1, backgroundColor: W.latar } });
