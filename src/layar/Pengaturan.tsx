/**
 * PENGATURAN — mockup 29.
 *
 * Semuanya tersimpan DI PERANGKAT, bukan di akun. Itu batas yang jujur:
 * setelan per-akun hidup di `/api/saya/*`, yang masih menuntut identitas
 * Telegram. Layar ini mengatakannya — bukan membiarkan orang menemukannya
 * sendiri saat ganti HP.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { Blok, Butir, Lbl, Menu, Mikro, PilTf, Saklar } from '../komponen/mockup';
import { W, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';
import { mintaIzinPush, siapkanSaluran, tokenPerangkat } from '../data/push';
import { cabutPerangkat, daftarkanPerangkat } from '../data/saya';

type Props = { setelan: Setelan; simpan: (s: Setelan) => void };

/** Timeframe yang boleh jadi bawaan. m1/m5 sengaja tidak ada — lihat catatan di bawah. */
const TF = ['m15', 'm30', 'h1', 'h4', 'd1'];

export function LayarPengaturan({ setelan, simpan }: Props) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  /**
   * SEBAB DISIMPAN, BUKAN DIBUANG. Saklar yang kembali mati tanpa sepatah kata
   * adalah bentuk kegagalan paling membingungkan yang bisa dibuat layar ini:
   * orang menyalakannya, ia mati sendiri, dan tidak ada apa pun yang bisa
   * dibaca. Tiga sebabnya berbeda dan tindakannya berbeda — izin ditolak
   * (harus lewat Setelan sistem), belum tertaut Telegram, atau jaringan.
   */
  const [sebabPush, setSebabPush] = useState<string | null>(null);
  const [sibukPush, setSibukPush] = useState(false);

  async function gantiPush(mau: boolean): Promise<void> {
    setSibukPush(true);
    setSebabPush(null);
    try {
      if (!mau) {
        const t = await tokenPerangkat();
        if (t !== null) await cabutPerangkat(t);
        simpan({ ...setelan, pushNyala: false });
        return;
      }
      const izin = await mintaIzinPush();
      if (izin === 'bukan-perangkat') { setSebabPush('Notifikasi cuma jalan di HP, bukan di emulator.'); return; }
      if (izin === 'ditolak') { setSebabPush('Izin notifikasi ditolak. Nyalakan dari Setelan HP → Aplikasi → AnalisMarket → Notifikasi.'); return; }
      await siapkanSaluran();
      const t = await tokenPerangkat();
      if (t === null) { setSebabPush('Perangkat ini tidak bisa menerima notifikasi.'); return; }
      const j = await daftarkanPerangkat(t, 'android');
      if (!j.ok) { setSebabPush(j.kalimat); return; }
      simpan({ ...setelan, pushNyala: true });
    } finally {
      setSibukPush(false);
    }
  }
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      <Lbl>Bawaan saat app dibuka</Lbl>
      <Menu>
        <Butir simbol={setelan.pasar} nama="Pasar" ket={setelan.pasar} ketMono pertama />
        <Butir ikon="analisis" nama="Mesin" ket={setelan.mesin === '' ? 'pertama' : setelan.mesin} ketMono />
      </Menu>
      <Mikro>Keduanya ikut berubah sendiri saat kamu membuka pasar atau mesin lain — tidak perlu diatur dari sini.</Mikro>

      <Lbl gaya={{ marginTop: 2 }}>Timeframe bawaan</Lbl>
      <Blok>
        <PilTf daftar={TF} aktif={setelan.tf} pilih={(t) => { simpan({ ...setelan, tf: t }); }} />
        {/* Sapuan 1.037 kartu: nol setup m5 lolos sesudah biaya. Keduanya tetap
            bisa dibuka sendiri di pasar Binance — yang dilarang cuma jadi BAWAAN. */}
        <Mikro>m1 dan m5 tidak ditawarkan sebagai bawaan: sesudah biaya dihitung, nyaris tidak ada setup di sana yang layak. Keduanya tetap bisa dibuka sendiri di pasar Binance.</Mikro>
      </Blok>

      <Lbl gaya={{ marginTop: 2 }}>Chart</Lbl>
      <Menu>
        <Butir ikon="pasar" nama="Lapisan bawaan" ket="volume · zona · level" pertama />
        {/* Dulu `<Saklar on={false} />` tanpa penangan: saklar yang digambar
            persis seperti saklar hidup, tidak pernah bergerak, dan tidak
            pernah menyalakan apa pun. Sekarang ia menyimpan pilihannya dan
            `LayarAnalisis` yang menahan layarnya. */}
        <Butir ikon="analisis" nama="Tetap menyala saat chart terbuka"
          ket={setelan.layarMenyala ? 'nyala' : 'mati'}
          kanan={<Saklar on={setelan.layarMenyala} ganti={(v) => { simpan({ ...setelan, layarMenyala: v }); }} />} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Notifikasi</Lbl>
      <Menu>
        <Butir ikon="kabar" nama="Kabar di HP ini"
          ket={sibukPush ? 'menyiapkan…' : setelan.pushNyala ? 'nyala' : 'mati'} pertama
          kanan={<Saklar on={setelan.pushNyala} ganti={sibukPush ? undefined : (v) => { void gantiPush(v); }} />} />
      </Menu>
      {sebabPush !== null && <Mikro>{sebabPush}</Mikro>}
      <Mikro>Kabar tetap dikirim ke Telegram seperti biasa. Saklar ini menambahkan salinannya ke HP ini — dan cuma berlaku di HP ini.</Mikro>

      <Lbl gaya={{ marginTop: 2 }}>Tampilan</Lbl>
      <Menu>
        <Butir ikon="lainnya" nama="Tema" ket="Gelap" pertama />
        <Butir ikon="lainnya" nama="Bahasa" ket="Indonesia" />
        <Butir ikon="kalender" nama="Zona waktu" ket="WIB" ketMono />
      </Menu>

      <View style={{ flex: 1 }} />
      <Blok>
        <Lbl>Di mana setelan ini disimpan</Lbl>
        <Mikro>Di perangkat ini saja. Setelan per-akun butuh identitas yang belum lepas dari Telegram, jadi pilihanmu tidak ikut pindah kalau kamu ganti HP.</Mikro>
        <Lbl gaya={{ marginTop: 8 }}>Tema terang belum ada</Lbl>
        <Mikro>Kartu bot memang terang, tapi app dan web gelap — dan yang disatukan PERAN warnanya, bukan nilainya. Tema terang butuh paletnya sendiri, bukan pembalikan.</Mikro>
      </Blok>
    </ScrollView>
  );
}

const g = StyleSheet.create({ akar: { flex: 1, backgroundColor: W.latar } });
