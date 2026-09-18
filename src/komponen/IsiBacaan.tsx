/**
 * ISI BACAAN — dipakai lapisan yang dibuka dari strip.
 *
 * Tab mesin ikut DI DALAM lapisan, dan itu disengaja: web membiarkan kendali
 * mesin tetap hidup saat bacaan terbuka, jadi mengetuk mesin lain menukar
 * bacaannya di tempat — bukan menutup, memilih, lalu membuka lagi.
 *
 * Urutan bloknya mengikuti `KolomBacaan.tsx`: keputusan, rencana, biaya,
 * syarat, level, konteks. Orang yang pindah dari web tidak perlu belajar
 * ulang letak apa pun.
 */
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { arahTurun, syaratWajib, type Bacaan, type Mesin } from '../data/api';
import { angka } from '../data/tampil';
import { BarBiaya, Kartu, Pisah } from './dasar';
import { W, H, J, R, ANGKA, SENTUH, gayaLabel, TALANG } from '../gaya/token';

export function IsiBacaan({ bacaan, m, desimal, gantiMesin }: {
  bacaan: Bacaan; m: Mesin; desimal: number; gantiMesin: (kode: string) => void;
}) {
  const turun = arahTurun(m);
  /* Warna arah dari ANGKA, bukan dari katanya. Tanpa rencana, kata tetap putih. */
  const warnaArah = turun === null ? W.teksKuat : turun ? W.turun : W.naik;
  const wajib = syaratWajib(m);
  const lolos = wajib.filter((s) => s.lolos).length;
  const gagal = wajib.filter((s) => !s.lolos);
  const punya = m.entry !== undefined && m.sl !== undefined && m.tp !== undefined;

  return (
    <ScrollView contentContainerStyle={{ paddingVertical: J.x3 }}>
      <View style={g.mesinBaris}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {bacaan.mesin.map((x) => {
            const on = x.mesin === m.mesin;
            const w = syaratWajib(x);
            const l = w.filter((c) => c.lolos).length;
            return (
              <Pressable key={x.mesin} onPress={() => { gantiMesin(x.mesin); }} style={[g.mesinTab, on && g.mesinTabOn]}>
                <View style={g.mesinKepala}>
                  {on && <View style={g.mesinTitik} />}
                  <Text style={[g.mesinNama, on && g.mesinNamaOn]} numberOfLines={1}>{x.mesin.toUpperCase()}</Text>
                </View>
                <Text style={g.mesinStatus} numberOfLines={1}>{x.status.toLowerCase()} {l}/{w.length}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Kartu
        judul="STATUS RENCANA"
        kanan={m.rrBersih > 0 ? <Text style={g.rr}>RR bersih 1:{angka(m.rrBersih, 1)}</Text> : undefined}
      >
        <View style={g.kepalaBaris}>
          <Text style={g.status}>{m.keputusan.label}</Text>
          {punya && <Text style={[g.arah, { color: warnaArah }]}>{m.arah}</Text>}
        </View>
        {punya ? (
          <View style={g.plan}>
            <Sel label="entry" nilai={angka(m.entry, desimal)} />
            <Sel label="sl" nilai={angka(m.sl, desimal)} />
            <Sel label="tp" nilai={angka(m.tp, desimal)} />
          </View>
        ) : (
          <Text style={g.alasan}>{m.keputusan.alasan}</Text>
        )}
        {m.caraMasuk !== null && m.caraMasuk !== '' && (
          <>
            <Pisah />
            <Text style={gayaLabel}>arahan</Text>
            <Text style={[g.alasan, { marginTop: 3 }]}>{m.caraMasuk}</Text>
          </>
        )}
      </Kartu>

      <Kartu judul="BIAYA"><BarBiaya porsi={m.biayaPorsi} /></Kartu>

      <Kartu judul={`Syarat ${m.mesin}`} kanan={<Text style={g.rr}>{lolos} dari {wajib.length} lolos</Text>}>
        {gagal.length > 0 && (
          <View style={g.blokGagal}>
            <Text style={g.judulGagal}>Yang belum lolos</Text>
            {gagal.map((s) => (
              <View key={s.kode} style={g.item}>
                <Text style={g.tandaGagal}>✕</Text>
                <View style={{ flex: 1 }}>
                  <Text style={g.nama}>{s.nama}</Text>
                  {s.kalimat !== '' && <Text style={g.kalimat}>{s.kalimat}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
        {wajib.filter((s) => s.lolos).map((s) => (
          <View key={s.kode} style={g.item}>
            <Text style={g.tandaLolos}>✓</Text>
            <Text style={[g.nama, { flex: 1 }]}>{s.nama}</Text>
          </View>
        ))}
      </Kartu>

      {m.level.length > 0 && (
        <Kartu judul="LEVEL YANG DIAWASI">
          {m.level.map((l, i) => (
            <View key={`${String(l.harga)}${String(i)}`} style={g.level}>
              <Text style={g.levelHarga}>{angka(l.harga, desimal)}</Text>
              <Text style={g.levelPeran} numberOfLines={1}>{l.peran}</Text>
              {l.diLuarJangkauan && <Text style={g.levelLuar}>di luar</Text>}
            </View>
          ))}
        </Kartu>
      )}

      {m.zona.length > 0 && (
        <Kartu judul={`ZONA (${String(m.zona.length)})`}>
          {m.zona.slice(0, 8).map((z, i) => (
            <View key={`${z.teks}${String(i)}`} style={g.level}>
              <Text style={g.zonaTeks}>{z.teks}</Text>
              <Text style={g.levelPeran} numberOfLines={1}>{z.peran}</Text>
              <Text style={g.zonaRentang}>{angka(z.bawah, desimal)} – {angka(z.atas, desimal)}</Text>
            </View>
          ))}
        </Kartu>
      )}

      <Kartu judul="KONTEKS ATAS">
        <Text style={g.alasan}>{m.konteksAtas}</Text>
        <Pisah />
        <BarisKV k={m.htfTimeframe === null ? 'Bias' : `Bias ${m.htfTimeframe}`} v={m.htfBias} />
        <BarisKV k="ATR" v={angka(m.atr, desimal)} />
        <BarisKV k="Jarak entry" v={m.jarakEntryAtr === null ? '—' : `${angka(m.jarakEntryAtr, 2)} ATR`} />
      </Kartu>

      <Text style={g.kaki}>
        Ini alat baca chart, bukan alat prediksi. Semua analisa bersifat informasi, bukan ajakan melakukan transaksi.
      </Text>
    </ScrollView>
  );
}

function Sel({ label, nilai }: { label: string; nilai: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={gayaLabel}>{label}</Text>
      <Text style={g.selNilai}>{nilai}</Text>
    </View>
  );
}

function BarisKV({ k, v }: { k: string; v: string }) {
  return (
    <View style={g.kv}>
      <Text style={g.kvK}>{k}</Text>
      <Text style={g.kvV}>{v}</Text>
    </View>
  );
}

const g = StyleSheet.create({
  mesinBaris: { borderBottomWidth: 1, borderBottomColor: W.garis, marginBottom: J.x3 },
  mesinTab: {
    paddingHorizontal: TALANG, paddingVertical: 7,
    borderRightWidth: 1, borderRightColor: W.garis,
    borderBottomWidth: 2, borderBottomColor: 'transparent', minWidth: 96,
  },
  mesinTabOn: { borderBottomColor: W.teksKuat, backgroundColor: W.kartu },
  mesinKepala: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  mesinTitik: { width: 5, height: 5, borderRadius: R.bulat, backgroundColor: W.teksKuat },
  mesinNama: { fontSize: H.nilai, lineHeight: 16, color: W.teksRedup, letterSpacing: 0.4 },
  mesinNamaOn: { color: W.teksKuat, fontWeight: '500' },
  mesinStatus: { fontSize: H.label, lineHeight: 13, color: W.teksSamar, letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 2 },
  rr: { fontSize: H.label, color: W.teksSamar, ...ANGKA },
  kepalaBaris: { flexDirection: 'row', alignItems: 'baseline', gap: J.x2, marginBottom: J.x2 },
  status: { fontSize: H.status, fontWeight: '700', color: W.teksKuat },
  arah: { fontSize: H.status, fontWeight: '700' },
  plan: { flexDirection: 'row', gap: J.x3 },
  selNilai: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat, marginTop: 3, ...ANGKA },
  alasan: { fontSize: 11, color: W.teksRedup, lineHeight: 17 },
  blokGagal: {
    borderWidth: 1, borderColor: W.turunTepi, backgroundColor: W.turunLatar,
    borderRadius: R.besar, padding: J.x3, marginBottom: J.x3,
  },
  judulGagal: { fontSize: H.label, color: W.turun, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: J.x2 },
  item: { flexDirection: 'row', gap: J.x2, paddingVertical: 5 },
  tandaGagal: { color: W.turun, fontSize: H.nilai, width: 14 },
  tandaLolos: { color: W.naik, fontSize: H.nilai, width: 14 },
  nama: { fontSize: H.nilai, color: W.teksKuat },
  kalimat: { fontSize: 11, color: W.teksRedup, marginTop: 2, lineHeight: 16 },
  level: { flexDirection: 'row', alignItems: 'center', gap: J.x2, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: W.garisSamar },
  levelHarga: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat, width: 92, ...ANGKA },
  levelPeran: { fontSize: 11, color: W.teksRedup, flex: 1 },
  levelLuar: { fontSize: H.label, color: W.teksSamar },
  zonaTeks: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat, width: 52, ...ANGKA },
  zonaRentang: { fontSize: 11, color: W.teks, ...ANGKA },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, gap: J.x3 },
  kvK: { fontSize: 11, color: W.teksRedup, flexShrink: 1 },
  kvV: { fontSize: 11, color: W.teksKuat, fontWeight: '500', ...ANGKA },
  kaki: { fontSize: H.label, color: W.teksSamar, paddingHorizontal: TALANG, paddingBottom: J.x4, lineHeight: 14 },
});
