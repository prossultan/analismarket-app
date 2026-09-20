/**
 * BANDING MESIN — kelima mesin bersebelahan, dari SATU panggilan yang sama.
 *
 * Nol permintaan tambahan: `/api/bacaan` sudah memulangkan seluruh mesin
 * dalam satu muatan. Layar ini cuma menyusunnya jadi tabel.
 *
 * KESEPAKATAN ARAH DITURUNKAN DARI ANGKA, bukan dari kata.
 * `arahTurun()` membacanya dari `sl > entry`, dan mesin tanpa angka rencana
 * TIDAK ikut dihitung — bukan dihitung sebagai netral. Menghitungnya sebagai
 * netral membuat "3 dari 5 sepakat" berarti dua hal berbeda tergantung
 * berapa mesin yang kebetulan punya rencana hari itu.
 *
 * Dan kalimat di kakinya menolak dibaca sebagai konfirmasi: lima mesin
 * membaca lilin yang SAMA, jadi kesepakatan di antara mereka bukan lima
 * pendapat bebas.
 */
import { memo } from 'react';
import { gayaTema } from '../gaya/tema';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { arahTurun, syaratWajib, type Mesin } from '../data/api';
import { W, H, J, R, ANGKA, SENTUH, TALANG, gayaLabel } from '../gaya/token';

type Props = { daftar: ReadonlyArray<Mesin>; aktif: string; pilih: (kode: string) => void };

/** Tanda titik: warna DAN bentuk, supaya status tidak cuma dibedakan warna. */
function warnaStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('setup')) return W.naik;
  if (s.includes('pantau')) return W.teksKuat;
  return W.teksSamar;
}

function rrTeks(m: Mesin): string {
  /* `null` bukan nol: mesin yang angkanya ditahan TIDAK punya RR untuk
     dicetak, dan mencetak 0,00 di situ adalah angka karangan. */
  if (m.entry === undefined || m.tp === undefined) return '—';
  return m.rrBersih.toFixed(2).replace('.', ',');
}

function jarakTeks(m: Mesin): string {
  if (m.jarakEntryAtr === null) return '—';
  return `${m.jarakEntryAtr.toFixed(1).replace('.', ',')} ATR`;
}

export const BandingMesin = memo(function BandingMesin({ daftar, aktif, pilih }: Props) {
  const berangka = daftar.map(arahTurun).filter((a): a is boolean => a !== null);
  const turun = berangka.filter(Boolean).length;
  const naikJml = berangka.length - turun;
  const terbanyak = Math.max(turun, naikJml);

  return (
    <View style={g.akar}>
      <View style={[g.baris, g.kepala]}>
        <Text style={[g.sel, g.selMesin, g.kepalaTeks]}>Mesin</Text>
        <Text style={[g.sel, g.selStatus, g.kepalaTeks]}>Status</Text>
        <Text style={[g.sel, g.selAngka, g.kepalaTeks]}>RR</Text>
        <Text style={[g.sel, g.selAngka, g.kepalaTeks]}>Jarak</Text>
      </View>

      <ScrollView>
        {daftar.map((m) => {
          const on = m.mesin === aktif;
          const w = syaratWajib(m);
          const lolos = w.filter((s) => s.lolos).length;
          return (
            <Pressable
              key={m.mesin}
              onPress={() => { pilih(m.mesin); }}
              style={[g.baris, on && g.barisOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <View style={[g.sel, g.selMesin, g.mesinSel]}>
                <View style={[g.titik, { backgroundColor: warnaStatus(m.status) }]} />
                <Text style={[g.mesinNama, on && g.mesinNamaOn]} numberOfLines={1}>{m.mesin}</Text>
              </View>
              <Text style={[g.sel, g.selStatus, g.statusTeks]} numberOfLines={1}>
                {m.status} {lolos}/{w.length}
              </Text>
              <Text style={[g.sel, g.selAngka, g.angkaTeks]}>{rrTeks(m)}</Text>
              <Text style={[g.sel, g.selAngka, g.angkaTeks]}>{jarakTeks(m)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[g.baris, g.kaki]}>
        <Text style={[g.sel, g.selMesin, g.kepalaTeks]}>Sepakat arah</Text>
        <Text style={g.kakiNilai}>
          {berangka.length === 0
            ? 'tidak ada mesin yang punya angka rencana'
            : `${String(terbanyak)} dari ${String(berangka.length)} yang berangka`}
        </Text>
      </View>
      <Text style={g.mikro}>
        Lima mesin membaca lilin yang sama. Yang berbeda cuma aturannya, dan kesepakatan di
        antara mereka tidak membuat satu pun di antaranya lebih mungkin benar.
      </Text>
    </View>
  );
});

const g = gayaTema((W) => StyleSheet.create({
  akar: { flex: 1 },
  baris: {
    flexDirection: 'row', alignItems: 'center', gap: J.x2,
    paddingHorizontal: TALANG, minHeight: SENTUH,
    borderBottomWidth: 1, borderBottomColor: W.garisSamar,
  },
  barisOn: { backgroundColor: W.kartuTerang, borderLeftWidth: 2, borderLeftColor: W.teksKuat },
  kepala: { minHeight: 30, backgroundColor: W.isiSamar, borderBottomColor: W.garis },
  kepalaTeks: { ...gayaLabel },
  kaki: { minHeight: 34, borderBottomWidth: 0, backgroundColor: W.isiSamar },
  kakiNilai: { flex: 1, fontSize: H.label, color: W.teksRedup, textAlign: 'right' },
  sel: { minWidth: 0 },
  selMesin: { flex: 1.15 },
  selStatus: { flex: 1.3 },
  selAngka: { flex: 0.75, textAlign: 'right' },
  mesinSel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  titik: { width: 5, height: 5, borderRadius: R.bulat },
  mesinNama: { fontSize: H.nilai, color: W.teksRedup, flexShrink: 1 },
  mesinNamaOn: { color: W.teksKuat, fontWeight: '500' },
  statusTeks: { fontSize: H.label, color: W.teksRedup },
  angkaTeks: { fontSize: H.label, color: W.teks, ...ANGKA },
  mikro: {
    fontSize: H.label, color: W.teksSamar, lineHeight: 13,
    paddingHorizontal: TALANG, paddingTop: J.x2, paddingBottom: J.x3,
  },
}));
