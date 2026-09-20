/**
 * PENGGARIS JARAK ATR — jarum tiap mesin, dalam ATR dari harga sekarang.
 *
 * Ini yang paling hilang dari app sebelumnya. Pertanyaan "mesin mana yang
 * entry-nya paling dekat" tidak bisa dijawab dengan membaca lima angka
 * berturut-turut; ia pertanyaan spasial, dan jawabannya sebuah garis.
 *
 * Skala berakhir di 3 ATR. Rencana entry hanya dicetak sampai 2 ATR, jadi
 * BATASNYA digambar — mesin yang lebih jauh dijepit di ujung dan diberi
 * keterangan "di luar", bukan dibuang. Mesin yang dibuang terbaca seperti
 * mesin yang tidak punya pendapat.
 *
 * Angkanya `jarakEntryAtr` dari endpoint, apa adanya. App tidak menghitung
 * satu pun jarak sendiri.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { gayaTema } from '../gaya/tema';
import type { Mesin } from '../data/api';
import { W, H, J, R, ANGKA, TALANG } from '../gaya/token';

/** Ujung skala. Sama dengan web: 3 ATR. */
const UJUNG = 3;
/** Batas cetak rencana. Sama dengan `AMBANG_ENTRY_JAUH_ATR` di bot. */
const BATAS = 2;

export function SkalaJarum({ daftar, aktif, pilih }: {
  daftar: Mesin[]; aktif: string; pilih: (kode: string) => void;
}) {
  const jarum = daftar
    .filter((m) => m.jarakEntryAtr !== null)
    .map((m) => ({ kode: m.mesin, atr: m.jarakEntryAtr ?? 0 }));

  if (jarum.length === 0) {
    return (
      <View style={g.akar}>
        <Text style={g.kosong}>Jarak entry belum terukur untuk timeframe ini.</Text>
      </View>
    );
  }

  const diLuar = jarum.filter((j) => j.atr > BATAS).length;

  return (
    <View style={g.akar}>
      <View style={g.kepala}>
        <Text style={g.kini}>kini</Text>
        <View style={{ flex: 1 }} />
        {diLuar > 0 && (
          <Text style={g.diLuar}>{diLuar} mesin di luar batas</Text>
        )}
      </View>

      <View style={g.garisWadah}>
        <View style={g.garis} />
        {/* Batas 2 ATR: garis emas tipis. Ini satu-satunya emas di layar ini,
            dan ia menandai batas produk — bukan hiasan. */}
        <View style={[g.batas, { left: `${String((BATAS / UJUNG) * 100)}%` as `${number}%` }]} />
        {jarum.map((j) => {
          const kiri = Math.min(100, (j.atr / UJUNG) * 100);
          const on = j.kode === aktif;
          return (
            <Pressable
              key={j.kode}
              onPress={() => { pilih(j.kode); }}
              style={[g.jarum, { left: `${String(kiri)}%` as `${number}%` }]}
              hitSlop={10}
            >
              <Text style={[g.jarumNama, on && g.jarumNamaOn]} numberOfLines={1}>{j.kode}</Text>
              <View style={[g.jarumGaris, on && g.jarumGarisOn, j.atr > BATAS && g.jarumLuar]} />
            </Pressable>
          );
        })}
      </View>

      <View style={g.tanda}>
        <Text style={g.tandaTeks}>0</Text>
        <Text style={g.tandaTeks}>1 ATR</Text>
        <Text style={g.tandaTeks}>2 ATR</Text>
        <Text style={[g.tandaTeks, { color: W.plusTeks }]}>batas</Text>
      </View>
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akar: { paddingHorizontal: TALANG, paddingTop: J.x2, paddingBottom: J.x3, borderTopWidth: 1, borderTopColor: W.garis },
  kepala: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  kini: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.1, textTransform: 'uppercase' },
  diLuar: { fontSize: H.label, color: W.teksSamar },
  garisWadah: { height: 34, justifyContent: 'flex-end' },
  garis: { position: 'absolute', left: 0, right: 0, bottom: 6, height: 1, backgroundColor: W.garis },
  batas: { position: 'absolute', bottom: 2, width: 1, height: 12, backgroundColor: W.plus },
  jarum: { position: 'absolute', bottom: 0, alignItems: 'center', marginLeft: -22, width: 44 },
  jarumNama: { fontSize: H.label, color: W.teksRedup },
  jarumNamaOn: { color: W.teksKuat, fontWeight: '500' },
  jarumGaris: { width: 1, height: 10, backgroundColor: W.teksRedup, marginTop: 2 },
  jarumGarisOn: { backgroundColor: W.teksKuat, width: 2 },
  jarumLuar: { backgroundColor: W.teksSamar },
  tanda: { flexDirection: 'row', justifyContent: 'space-between', marginTop: J.x1 },
  tandaTeks: { fontSize: H.label, color: W.teksSamar, ...ANGKA },
  kosong: { fontSize: H.label, color: W.teksSamar, paddingVertical: J.x3 },
}));
