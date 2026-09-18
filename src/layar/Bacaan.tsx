/**
 * HALAMAN 3 — BACAAN, dan pintu ke halaman 4, 5, 6.
 *
 * Keempatnya berdiri di atas SATU muatan `/api/bacaan`. Tidak ada pengambilan
 * tambahan: simpanan 20 detik dan single-flight di `antrian.ts` membuat empat
 * layar yang meminta kombinasi yang sama menjadi satu permintaan jaringan.
 *
 * Urutan bloknya mengikuti `KolomBacaan.tsx` di web — keputusan dulu, baru
 * angka, baru syarat. Orang yang pindah dari web ke app tidak perlu belajar
 * ulang letak apa pun.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilBacaan, arahTurun, syaratWajib, type Bacaan, type Mesin, type Pasar } from '../data/api';
import { angka } from '../data/tampil';
import { BarBiaya, Baris, Kartu, Kosong, Label, Memuat, Pil, Pisah } from '../komponen/dasar';
import { W, H, J, R, ANGKA } from '../gaya/token';

export type MuatanBacaan = { bacaan: Bacaan; mesin: Mesin };

type Props = {
  pasar: Pasar;
  tf: string;
  mesinDipilih: string;
  pilihMesin: (kode: string) => void;
  bukaBanding: (b: Bacaan) => void;
  bukaSyarat: (m: Mesin) => void;
  bukaZona: (m: Mesin) => void;
};

export function LayarBacaan({ pasar, tf, mesinDipilih, pilihMesin, bukaBanding, bukaSyarat, bukaZona }: Props) {
  const [bacaan, setBacaan] = useState<Bacaan | null>(null);
  const [keadaan, setKeadaan] = useState<'memuat' | 'ada' | 'gagal'>('memuat');
  const [sebab, setSebab] = useState('');
  const [menyegarkan, setMenyegarkan] = useState(false);

  const muat = useCallback(async (segarkan = false): Promise<void> => {
    const j = await ambilBacaan(pasar.simbol, tf, segarkan);
    if (j.ok) { setBacaan(j.isi); setKeadaan('ada'); }
    else { setKeadaan('gagal'); setSebab(j.kalimat); }
  }, [pasar.simbol, tf]);

  useEffect(() => { setKeadaan('memuat'); void muat(); }, [muat]);

  if (keadaan === 'memuat') return <Memuat teks={`Membaca ${pasar.simbol} ${tf.toUpperCase()}…`} />;
  if (keadaan === 'gagal' || bacaan === null) {
    return <Kosong judul="Mesin tidak menjawab" sebab={sebab} aksi={() => { void muat(true); }} />;
  }

  if (bacaan.mesin.length === 0) {
    return (
      <Kosong
        judul="Tidak ada mesin yang membaca timeframe ini"
        sebab={`Tidak satu pun mesin membaca ${pasar.simbol} di ${tf.toUpperCase()}. Coba timeframe lain.`}
      />
    );
  }

  const m = bacaan.mesin.find((x) => x.mesin === mesinDipilih) ?? bacaan.mesin[0];
  if (m === undefined) return <Kosong judul="Tidak ada mesin" />;

  const turun = arahTurun(m);
  /* Warna arah dari ANGKA, bukan dari katanya. Tanpa rencana, kata tetap putih. */
  const warnaArah = turun === null ? W.teksKuat : turun ? W.turun : W.naik;
  const wajib = syaratWajib(m);
  const lolos = wajib.filter((s) => s.lolos).length;
  const punyaRencana = m.entry !== undefined && m.sl !== undefined && m.tp !== undefined;

  return (
    <ScrollView
      style={g.akar}
      contentContainerStyle={{ paddingVertical: J.x3 }}
      refreshControl={
        <RefreshControl
          refreshing={menyegarkan}
          tintColor={W.teksRedup}
          onRefresh={() => { setMenyegarkan(true); void muat(true).finally(() => { setMenyegarkan(false); }); }}
        />
      }
    >
      {/* Pemilih mesin. Semua mesin sudah ada di muatan ini — pindah mesin
          tidak memanggil jaringan sama sekali. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.mesinBaris}>
        {bacaan.mesin.map((x) => {
          const on = x.mesin === m.mesin;
          return (
            <Pressable key={x.mesin} onPress={() => { pilihMesin(x.mesin); }} style={[g.chip, on && g.chipOn]}>
              <Text style={[g.chipTeks, on && g.chipTeksOn]}>{x.mesin}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Kartu>
        <View style={g.kepalaBaris}>
          <Text style={g.status}>{m.keputusan.label}</Text>
          {punyaRencana && <Text style={[g.arah, { color: warnaArah }]}>{m.arah}</Text>}
        </View>
        <Text style={g.sub}>
          {m.mesin} · {tf.toUpperCase()} · {pasar.simbol}
        </Text>
        {m.keputusan.alasan !== '' && <Text style={g.alasan}>{m.keputusan.alasan}</Text>}
      </Kartu>

      {bacaan.pasarTutupAlasan !== null && bacaan.pasarTutupAlasan !== 'buka' && (
        <Kartu judul="Pasar tutup">
          <Text style={g.alasan}>{m.konteksAtas}</Text>
        </Kartu>
      )}

      <Kartu
        judul="Rencana"
        kanan={m.rrBersih > 0 ? <Pil teks={`RR bersih 1:${angka(m.rrBersih, 1)}`} /> : undefined}
      >
        {punyaRencana ? (
          <View style={g.plan}>
            <Sel label="entry" nilai={angka(m.entry, pasar.desimal)} />
            <Sel label="sl" nilai={angka(m.sl, pasar.desimal)} />
            <Sel label="tp" nilai={angka(m.tp, pasar.desimal)} />
          </View>
        ) : (
          <>
            <Text style={g.tanpaAngka}>Belum ada rencana entry yang valid</Text>
            <Text style={g.alasan}>{m.keputusan.alasan}</Text>
          </>
        )}
        {m.caraMasuk !== null && m.caraMasuk !== '' && (
          <>
            <Pisah />
            <Label>arahan</Label>
            <Text style={[g.alasan, { marginTop: J.x1 }]}>{m.caraMasuk}</Text>
          </>
        )}
      </Kartu>

      <Kartu judul="Biaya">
        <BarBiaya porsi={m.biayaPorsi} />
      </Kartu>

      <Kartu judul={`Syarat ${m.mesin}`} kanan={<Pil teks={`${String(lolos)} dari ${String(wajib.length)} lolos`} nada={lolos === wajib.length ? 'naik' : 'netral'} />}>
        {/* Ringkasnya di sini; daftar lengkapnya halaman sendiri. */}
        {wajib.filter((s) => !s.lolos).slice(0, 3).map((s) => (
          <Baris key={s.kode} kiri={`✕  ${s.nama}`} kanan="" warnaKanan={W.turun} />
        ))}
        {lolos === wajib.length && <Text style={g.alasan}>Semua syarat wajib lolos.</Text>}
        <Pressable onPress={() => { bukaSyarat(m); }} style={g.tautan}>
          <Text style={g.tautanTeks}>Lihat {wajib.length} syarat selengkapnya</Text>
        </Pressable>
      </Kartu>

      <Kartu judul="Konteks atas">
        <Text style={g.alasan}>{m.konteksAtas}</Text>
        <Pisah />
        <Baris kiri={m.htfTimeframe === null ? 'Bias' : `Bias ${m.htfTimeframe}`} kanan={m.htfBias} />
        <Baris kiri="ATR" kanan={angka(m.atr, pasar.desimal)} />
        <Baris kiri="Jarak entry" kanan={m.jarakEntryAtr === null ? '—' : `${angka(m.jarakEntryAtr, 2)} ATR`} />
      </Kartu>

      <View style={g.aksi}>
        <Pressable onPress={() => { bukaBanding(bacaan); }} style={g.aksiTombol}>
          <Text style={g.aksiTeks}>Banding {bacaan.mesin.length} mesin</Text>
        </Pressable>
        <Pressable onPress={() => { bukaZona(m); }} style={g.aksiTombol}>
          <Text style={g.aksiTeks}>Zona & level</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Sel({ label, nilai }: { label: string; nilai: string }) {
  return (
    <View style={g.sel}>
      <Label>{label}</Label>
      <Text style={g.selNilai}>{nilai}</Text>
    </View>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  mesinBaris: { gap: 6, paddingHorizontal: J.x3, paddingBottom: J.x3 },
  chip: { paddingVertical: 6, paddingHorizontal: J.x3, borderRadius: R.sedang, borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartu },
  chipOn: { backgroundColor: W.teksKuat, borderColor: W.teksKuat },
  chipTeks: { fontSize: H.kontrol, color: W.teksRedup },
  chipTeksOn: { color: W.latar, fontWeight: '500' },
  kepalaBaris: { flexDirection: 'row', alignItems: 'baseline', gap: J.x2, flexWrap: 'wrap' },
  status: { fontSize: H.status, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.3 },
  arah: { fontSize: H.status, fontWeight: '700', letterSpacing: -0.3 },
  sub: { fontSize: 11, color: W.teksRedup, marginTop: J.x1 },
  alasan: { fontSize: 11, color: W.teksRedup, lineHeight: 17 },
  plan: { flexDirection: 'row', gap: J.x3 },
  sel: { flex: 1 },
  selNilai: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat, marginTop: 3, ...ANGKA },
  tanpaAngka: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat, marginBottom: J.x1 },
  tautan: { marginTop: J.x3 },
  tautanTeks: { fontSize: H.kontrol, color: W.teks, textDecorationLine: 'underline' },
  aksi: { flexDirection: 'row', gap: J.x3, marginHorizontal: J.x3, marginBottom: J.x4 },
  aksiTombol: { flex: 1, paddingVertical: J.x3, borderRadius: R.besar, borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartuTerang, alignItems: 'center' },
  aksiTeks: { fontSize: H.kontrol, color: W.teksKuat, fontWeight: '500' },
});
