/**
 * PENGATURAN — bawaan yang dipakai saat app dibuka.
 *
 * Semuanya tersimpan DI PERANGKAT (`AsyncStorage`), bukan di akun. Itu bukan
 * kekurangan sementara melainkan batas yang jujur: setelan per-akun hidup di
 * `/api/saya/*`, yang masih menuntut identitas Telegram. Menyimpannya di
 * perangkat berarti ia tidak ikut pindah HP — dan layar ini mengatakannya,
 * bukan membiarkan orang menemukannya sendiri saat ganti telepon.
 */
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Kartu } from '../komponen/dasar';
import { Ikon } from '../komponen/Ikon';
import { W, H, J, R, SENTUH, TALANG, SISA_BILAH, ANGKA } from '../gaya/token';
import type { Setelan } from '../data/simpan';

type Props = { setelan: Setelan; simpan: (s: Setelan) => void };

/** Timeframe yang boleh jadi bawaan. m1/m5 sengaja tidak ada di sini. */
const TF = ['m15', 'm30', 'h1', 'h4', 'd1'] as const;

export function LayarPengaturan({ setelan, simpan }: Props) {
  const tinggiKepala = useHeaderHeight();
  return (
    <ScrollView
      style={g.akar}
      contentContainerStyle={{ paddingTop: tinggiKepala + J.x3, paddingBottom: SISA_BILAH }}
    >
      <Kartu judul="Bawaan saat app dibuka">
        <View style={g.baris}>
          <Ikon nama="pasar" warna={W.teksSamar} ukuran={15} />
          <Text style={g.nama}>Pasar</Text>
          <Text style={g.nilai}>{setelan.pasar}</Text>
        </View>
        <View style={[g.baris, g.garis]}>
          <Ikon nama="analisis" warna={W.teksSamar} ukuran={15} />
          <Text style={g.nama}>Mesin</Text>
          <Text style={g.nilai}>{setelan.mesin}</Text>
        </View>
        <Text style={g.ket}>
          Keduanya ikut berubah sendiri saat kamu membuka pasar atau mesin lain — tidak perlu
          diatur dari sini.
        </Text>
      </Kartu>

      <Kartu judul="Timeframe bawaan">
        <View style={g.pilTf}>
          {TF.map((t) => {
            const on = setelan.tf === t;
            return (
              <Pressable
                key={t}
                onPress={() => { simpan({ ...setelan, tf: t }); }}
                style={[g.tf, on && g.tfOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[g.tfTeks, on && g.tfTeksOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>
        {/* Kenapa m1 dan m5 tidak ada: sapuan 1.037 kartu menunjukkan nol
            setup m5 lolos sesudah biaya. Keduanya tetap bisa dibuka sendiri
            di pasar Binance — yang dilarang cuma menjadikannya BAWAAN. */}
        <Text style={g.ket}>
          m1 dan m5 tidak ditawarkan sebagai bawaan: sesudah biaya dihitung, nyaris tidak ada
          setup di sana yang layak. Keduanya tetap bisa dibuka sendiri di pasar Binance.
        </Text>
      </Kartu>

      <Kartu judul="Di mana setelan ini disimpan">
        <Text style={g.sebab}>
          Di perangkat ini saja. Setelan per-akun butuh identitas yang belum lepas dari Telegram,
          jadi pilihanmu tidak ikut pindah kalau kamu ganti HP.
        </Text>
      </Kartu>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  baris: { flexDirection: 'row', alignItems: 'center', gap: J.x3, minHeight: SENTUH },
  garis: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  nama: { fontSize: H.nilai, color: W.teksKuat },
  nilai: { marginLeft: 'auto', fontSize: H.nilai, color: W.teksRedup, ...ANGKA },
  ket: { fontSize: H.label, color: W.teksSamar, lineHeight: 13, paddingTop: J.x2 },
  sebab: { fontSize: H.label, color: W.teksRedup, lineHeight: 14 },
  pilTf: { flexDirection: 'row', gap: 3, padding: 3, borderRadius: R.bulat, backgroundColor: W.isiSamar },
  tf: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: R.bulat },
  tfOn: { backgroundColor: W.kartuTerang },
  tfTeks: { fontSize: H.label, color: W.teksSamar, ...ANGKA },
  tfTeksOn: { color: W.teksKuat, fontWeight: '500' },
});
