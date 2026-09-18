/**
 * HALAMAN 4 — BANDING MESIN.
 *
 * Kelima mesin membaca pasar dan timeframe yang SAMA, dan jawabannya sudah
 * ada di satu muatan `/api/bacaan`. Jadi halaman ini berbiaya nol panggilan
 * tambahan — ia cuma menyusun ulang apa yang sudah diunduh.
 *
 * Kenapa layak jadi halaman: pertanyaan "mesin mana yang sedang setuju"
 * tidak bisa dijawab dengan memandang satu mesin, dan menggeser lima kali
 * membuat orang membandingkan dari ingatan.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { arahTurun, syaratWajib, type Bacaan, type Mesin } from '../data/api';
import { angka } from '../data/tampil';
import { Kartu, Pil } from '../komponen/dasar';
import { W, H, J, ANGKA } from '../gaya/token';

export function LayarBanding({ bacaan, desimal }: { bacaan: Bacaan; desimal: number }) {
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingVertical: J.x3 }}>
      <Text style={g.kepala}>
        {bacaan.pasar} · {bacaan.tf.toUpperCase()} · {bacaan.mesin.length} mesin membaca data yang sama
      </Text>
      {bacaan.mesin.map((m) => <BarisMesin key={m.mesin} m={m} desimal={desimal} />)}
      <Text style={g.kaki}>
        Mesin yang tidak sependapat bukan tanda ada yang salah — masing-masing membaca hal yang berbeda dari lilin yang sama.
      </Text>
    </ScrollView>
  );
}

function BarisMesin({ m, desimal }: { m: Mesin; desimal: number }) {
  const turun = arahTurun(m);
  const warnaArah = turun === null ? W.teksKuat : turun ? W.turun : W.naik;
  const wajib = syaratWajib(m);
  const lolos = wajib.filter((s) => s.lolos).length;
  const punya = m.entry !== undefined && m.sl !== undefined && m.tp !== undefined;

  return (
    <Kartu
      judul={m.mesin}
      kanan={<Pil teks={`${String(lolos)}/${String(wajib.length)}`} nada={lolos === wajib.length ? 'naik' : 'netral'} />}
    >
      <View style={g.atas}>
        <Text style={g.keputusan} numberOfLines={1}>{m.keputusan.label}</Text>
        {punya && <Text style={[g.arah, { color: warnaArah }]}>{m.arah}</Text>}
      </View>

      {punya ? (
        <View style={g.grid}>
          <Kolom label="entry" nilai={angka(m.entry, desimal)} />
          <Kolom label="sl" nilai={angka(m.sl, desimal)} />
          <Kolom label="tp" nilai={angka(m.tp, desimal)} />
          <Kolom label="rr bersih" nilai={m.rrBersih > 0 ? `1:${angka(m.rrBersih, 1)}` : '—'} />
        </View>
      ) : (
        <Text style={g.tanpa}>{m.keputusan.alasan}</Text>
      )}
    </Kartu>
  );
}

function Kolom({ label, nilai }: { label: string; nilai: string }) {
  return (
    <View style={g.kolom}>
      <Text style={g.label}>{label}</Text>
      <Text style={g.nilai}>{nilai}</Text>
    </View>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  kepala: { fontSize: 11, color: W.teksRedup, paddingHorizontal: J.x3, paddingBottom: J.x3 },
  atas: { flexDirection: 'row', alignItems: 'baseline', gap: J.x2, marginBottom: J.x3 },
  keputusan: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat, flexShrink: 1 },
  arah: { fontSize: H.nilai, fontWeight: '700' },
  grid: { flexDirection: 'row', gap: J.x2 },
  kolom: { flex: 1 },
  label: { fontSize: H.label, color: W.teksSamar, letterSpacing: 0.6, textTransform: 'uppercase' },
  nilai: { fontSize: H.kontrol, fontWeight: '500', color: W.teksKuat, marginTop: 2, ...ANGKA },
  tanpa: { fontSize: 11, color: W.teksRedup, lineHeight: 17 },
  kaki: { fontSize: H.label, color: W.teksSamar, paddingHorizontal: J.x3, paddingVertical: J.x4, lineHeight: 15 },
});
