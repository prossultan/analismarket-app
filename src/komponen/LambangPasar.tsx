/**
 * LAMBANG PASAR — ikon yang SAMA dengan yang dipakai web di produksi.
 *
 * Bukan hasil pencarian: 90 berkas ini diturunkan dari
 * `analismarket-web/public/koin` dan `/mata-uang`, dikonversi ke PNG 96px
 * supaya `<Image>` bisa memuatnya tanpa transformer metro tambahan.
 *
 * Dua permukaan dengan dua set ikon adalah cara paling halus membuat
 * keduanya terasa bukan satu produk.
 *
 * Petanya DIBUAT OTOMATIS dari isi folder. Metro menuntut `require` yang
 * statis — jalur yang dirangkai saat jalan tidak pernah ikut terbundel,
 * dan gagalnya diam: gambar kosong, tanpa satu pun galat.
 */
import { Image, StyleSheet, Text, View } from 'react-native';
import { gayaTema, useTema } from '../gaya/tema';
import { W, R } from '../gaya/token';

const LAMBANG: Record<string, number> = {
  'a': require('../../assets/lambang/a.png') as number,
  'aave': require('../../assets/lambang/aave.png') as number,
  'ach': require('../../assets/lambang/ach.png') as number,
  'ada': require('../../assets/lambang/ada.png') as number,
  'algo': require('../../assets/lambang/algo.png') as number,
  'apt': require('../../assets/lambang/apt.png') as number,
  'ar': require('../../assets/lambang/ar.png') as number,
  'arb': require('../../assets/lambang/arb.png') as number,
  'atom': require('../../assets/lambang/atom.png') as number,
  'aud': require('../../assets/lambang/aud.png') as number,
  'ava': require('../../assets/lambang/ava.png') as number,
  'avax': require('../../assets/lambang/avax.png') as number,
  'bch': require('../../assets/lambang/bch.png') as number,
  'bnb': require('../../assets/lambang/bnb.png') as number,
  'btc': require('../../assets/lambang/btc.png') as number,
  'cad': require('../../assets/lambang/cad.png') as number,
  'cake': require('../../assets/lambang/cake.png') as number,
  'cfg': require('../../assets/lambang/cfg.png') as number,
  'chf': require('../../assets/lambang/chf.png') as number,
  'chz': require('../../assets/lambang/chz.png') as number,
  'coti': require('../../assets/lambang/coti.png') as number,
  'crv': require('../../assets/lambang/crv.png') as number,
  'dash': require('../../assets/lambang/dash.png') as number,
  'dexe': require('../../assets/lambang/dexe.png') as number,
  'doge': require('../../assets/lambang/doge.png') as number,
  'dot': require('../../assets/lambang/dot.png') as number,
  'egld': require('../../assets/lambang/egld.png') as number,
  'epic': require('../../assets/lambang/epic.png') as number,
  'etc': require('../../assets/lambang/etc.png') as number,
  'eth': require('../../assets/lambang/eth.png') as number,
  'eur': require('../../assets/lambang/eur.png') as number,
  'fet': require('../../assets/lambang/fet.png') as number,
  'fil': require('../../assets/lambang/fil.png') as number,
  'g': require('../../assets/lambang/g.png') as number,
  'gala': require('../../assets/lambang/gala.png') as number,
  'gbp': require('../../assets/lambang/gbp.png') as number,
  'gram': require('../../assets/lambang/gram.png') as number,
  'hbar': require('../../assets/lambang/hbar.png') as number,
  'icp': require('../../assets/lambang/icp.png') as number,
  'iost': require('../../assets/lambang/iost.png') as number,
  'jpy': require('../../assets/lambang/jpy.png') as number,
  'jst': require('../../assets/lambang/jst.png') as number,
  'jup': require('../../assets/lambang/jup.png') as number,
  'ldo': require('../../assets/lambang/ldo.png') as number,
  'link': require('../../assets/lambang/link.png') as number,
  'lpt': require('../../assets/lambang/lpt.png') as number,
  'lsk': require('../../assets/lambang/lsk.png') as number,
  'ltc': require('../../assets/lambang/ltc.png') as number,
  'lunc': require('../../assets/lambang/lunc.png') as number,
  'met': require('../../assets/lambang/met.png') as number,
  'mina': require('../../assets/lambang/mina.png') as number,
  'near': require('../../assets/lambang/near.png') as number,
  'nzd': require('../../assets/lambang/nzd.png') as number,
  'one': require('../../assets/lambang/one.png') as number,
  'op': require('../../assets/lambang/op.png') as number,
  'ordi': require('../../assets/lambang/ordi.png') as number,
  'paxg': require('../../assets/lambang/paxg.png') as number,
  'pendle': require('../../assets/lambang/pendle.png') as number,
  'pepe': require('../../assets/lambang/pepe.png') as number,
  'pha': require('../../assets/lambang/pha.png') as number,
  'pol': require('../../assets/lambang/pol.png') as number,
  'prom': require('../../assets/lambang/prom.png') as number,
  'pyth': require('../../assets/lambang/pyth.png') as number,
  'qkc': require('../../assets/lambang/qkc.png') as number,
  'ray': require('../../assets/lambang/ray.png') as number,
  'render': require('../../assets/lambang/render.png') as number,
  'sei': require('../../assets/lambang/sei.png') as number,
  'shib': require('../../assets/lambang/shib.png') as number,
  'sky': require('../../assets/lambang/sky.png') as number,
  'sol': require('../../assets/lambang/sol.png') as number,
  'stg': require('../../assets/lambang/stg.png') as number,
  'strk': require('../../assets/lambang/strk.png') as number,
  'stx': require('../../assets/lambang/stx.png') as number,
  'sui': require('../../assets/lambang/sui.png') as number,
  'tao': require('../../assets/lambang/tao.png') as number,
  'tia': require('../../assets/lambang/tia.png') as number,
  'tree': require('../../assets/lambang/tree.png') as number,
  'trx': require('../../assets/lambang/trx.png') as number,
  'tut': require('../../assets/lambang/tut.png') as number,
  'uni': require('../../assets/lambang/uni.png') as number,
  'usd': require('../../assets/lambang/usd.png') as number,
  'vet': require('../../assets/lambang/vet.png') as number,
  'vtho': require('../../assets/lambang/vtho.png') as number,
  'wbtc': require('../../assets/lambang/wbtc.png') as number,
  'xau': require('../../assets/lambang/xau.png') as number,
  'xaut': require('../../assets/lambang/xaut.png') as number,
  'xlm': require('../../assets/lambang/xlm.png') as number,
  'xrp': require('../../assets/lambang/xrp.png') as number,
  'xtz': require('../../assets/lambang/xtz.png') as number,
  'zec': require('../../assets/lambang/zec.png') as number,
  'zen': require('../../assets/lambang/zen.png') as number,
};

/**
 * Simbol pasar -> kunci lambang.
 *
 * `BTCUSDT` -> `btc`, `XAU/USD` -> `xau`, `EUR/USD` -> `eur`. Pasangan
 * kripto memakai aset DASARNYA, bukan quote-nya: yang dikenali orang
 * lambang Bitcoin, bukan lambang USDT.
 */
export function kunciLambang(simbol: string): string | null {
  const s = simbol.toUpperCase();
  if (s.includes('/')) {
    const dasar = s.split('/')[0]?.toLowerCase() ?? '';
    return dasar in LAMBANG ? dasar : null;
  }
  for (const quote of ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH']) {
    if (s.endsWith(quote) && s.length > quote.length) {
      const dasar = s.slice(0, -quote.length).toLowerCase();
      if (dasar in LAMBANG) return dasar;
    }
  }
  const polos = s.toLowerCase();
  return polos in LAMBANG ? polos : null;
}

/**
 * RONA DARI NAMA SIMBOL — dua huruf abu-abu di antara logo berwarna terbaca
 * sebagai gambar yang gagal dimuat (audit 20 Sep: BA, EN di deret pasar).
 * Tiap simbol tanpa lambang dapat rona tetapnya sendiri, diturunkan dari
 * hurufnya, jadi BANK selalu warna yang sama di semua layar dan di semua HP.
 */
export function ronaSimbol(simbol: string): number {
  let h = 0;
  for (const c of simbol.toUpperCase()) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/**
 * Pasar tanpa lambang TIDAK dibiarkan kosong: ia dapat lingkaran berhuruf.
 * Lubang di deret ikon terbaca sebagai gambar yang gagal dimuat, dan itu
 * membuat seluruh daftarnya terasa rusak.
 *
 * DI TEMA TERANG lambang duduk di atas CAKRAM tipis. Sembilan lambang di set
 * ini hampir putih (XRP, ARB, HBAR, MTL, PHA, THE, XAUT, ZEN, DOGE — luminansi
 * di atas 0,8), dan di latar krem mereka hilang sama sekali; audit 20 Sep
 * memotret baris XRPUSDT tanpa lambang. Cakramnya selalu ada di tema terang,
 * bukan cuma untuk sembilan itu: satu aturan untuk semua lebih mudah dijaga
 * daripada daftar yang harus diperbarui tiap lambang bertambah.
 */
export function LambangPasar({ simbol, ukuran = 22 }: { simbol: string; ukuran?: number }) {
  const kunci = kunciLambang(simbol);
  const terang = useTema() === 'terang';
  const gaya = { width: ukuran, height: ukuran, borderRadius: R.bulat };
  if (kunci === null) {
    const h = ronaSimbol(simbol);
    const latar = terang ? `hsl(${String(h)}, 45%, 86%)` : `hsl(${String(h)}, 32%, 26%)`;
    const huruf = terang ? `hsl(${String(h)}, 45%, 28%)` : `hsl(${String(h)}, 55%, 82%)`;
    return (
      <View style={[gaya, g.ganti, { backgroundColor: latar, borderColor: terang ? `hsl(${String(h)}, 35%, 78%)` : `hsl(${String(h)}, 30%, 34%)` }]}>
        <Text style={[g.huruf, { fontSize: Math.round(ukuran * 0.42), color: huruf }]}>
          {simbol.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }
  if (!terang) return <Image source={LAMBANG[kunci]} style={gaya} accessibilityIgnoresInvertColors />;
  return (
    <View style={[gaya, g.cakram]}>
      <Image source={LAMBANG[kunci]} style={{ width: ukuran - 2, height: ukuran - 2, borderRadius: R.bulat }} accessibilityIgnoresInvertColors />
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  ganti: { alignItems: 'center', justifyContent: 'center', backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis },
  huruf: { color: W.teksRedup, fontWeight: '700' },
  /* Cakram tema terang: latar gelap 10% supaya lambang putih punya tepi, tanpa
     mengubah warna lambang berwarna. `latar900` di tema terang = krem gelap,
     jadi `rgba` hitam dipakai langsung — satu nilai yang benar di kedua tema
     tidak ada, dan cakram ini memang cuma hidup di tema terang. */
  cakram: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,18,15,0.10)', borderWidth: 1, borderColor: 'rgba(20,18,15,0.12)' },
}));
