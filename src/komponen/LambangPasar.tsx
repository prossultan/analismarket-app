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
import { W, R } from '../gaya/token';

const LAMBANG: Record<string, number> = {
  'aave': require('../../assets/lambang/aave.png') as number,
  'ada': require('../../assets/lambang/ada.png') as number,
  'ankr': require('../../assets/lambang/ankr.png') as number,
  'apt': require('../../assets/lambang/apt.png') as number,
  'ar': require('../../assets/lambang/ar.png') as number,
  'arb': require('../../assets/lambang/arb.png') as number,
  'ark': require('../../assets/lambang/ark.png') as number,
  'arpa': require('../../assets/lambang/arpa.png') as number,
  'aud': require('../../assets/lambang/aud.png') as number,
  'ava': require('../../assets/lambang/ava.png') as number,
  'avax': require('../../assets/lambang/avax.png') as number,
  'bch': require('../../assets/lambang/bch.png') as number,
  'blur': require('../../assets/lambang/blur.png') as number,
  'bnb': require('../../assets/lambang/bnb.png') as number,
  'btc': require('../../assets/lambang/btc.png') as number,
  'cad': require('../../assets/lambang/cad.png') as number,
  'cake': require('../../assets/lambang/cake.png') as number,
  'chf': require('../../assets/lambang/chf.png') as number,
  'chz': require('../../assets/lambang/chz.png') as number,
  'coti': require('../../assets/lambang/coti.png') as number,
  'crv': require('../../assets/lambang/crv.png') as number,
  'ctsi': require('../../assets/lambang/ctsi.png') as number,
  'cvc': require('../../assets/lambang/cvc.png') as number,
  'dash': require('../../assets/lambang/dash.png') as number,
  'doge': require('../../assets/lambang/doge.png') as number,
  'dot': require('../../assets/lambang/dot.png') as number,
  'eth': require('../../assets/lambang/eth.png') as number,
  'eur': require('../../assets/lambang/eur.png') as number,
  'fet': require('../../assets/lambang/fet.png') as number,
  'fil': require('../../assets/lambang/fil.png') as number,
  'gbp': require('../../assets/lambang/gbp.png') as number,
  'glm': require('../../assets/lambang/glm.png') as number,
  'gmt': require('../../assets/lambang/gmt.png') as number,
  'gram': require('../../assets/lambang/gram.png') as number,
  'hbar': require('../../assets/lambang/hbar.png') as number,
  'hive': require('../../assets/lambang/hive.png') as number,
  'holo': require('../../assets/lambang/holo.png') as number,
  'icp': require('../../assets/lambang/icp.png') as number,
  'ilv': require('../../assets/lambang/ilv.png') as number,
  'iost': require('../../assets/lambang/iost.png') as number,
  'iotx': require('../../assets/lambang/iotx.png') as number,
  'jpy': require('../../assets/lambang/jpy.png') as number,
  'jst': require('../../assets/lambang/jst.png') as number,
  'jup': require('../../assets/lambang/jup.png') as number,
  'kava': require('../../assets/lambang/kava.png') as number,
  'link': require('../../assets/lambang/link.png') as number,
  'lsk': require('../../assets/lambang/lsk.png') as number,
  'ltc': require('../../assets/lambang/ltc.png') as number,
  'met': require('../../assets/lambang/met.png') as number,
  'mina': require('../../assets/lambang/mina.png') as number,
  'mtl': require('../../assets/lambang/mtl.png') as number,
  'near': require('../../assets/lambang/near.png') as number,
  'nzd': require('../../assets/lambang/nzd.png') as number,
  'op': require('../../assets/lambang/op.png') as number,
  'paxg': require('../../assets/lambang/paxg.png') as number,
  'pendle': require('../../assets/lambang/pendle.png') as number,
  'pepe': require('../../assets/lambang/pepe.png') as number,
  'pha': require('../../assets/lambang/pha.png') as number,
  'pol': require('../../assets/lambang/pol.png') as number,
  'polyx': require('../../assets/lambang/polyx.png') as number,
  'powr': require('../../assets/lambang/powr.png') as number,
  'prom': require('../../assets/lambang/prom.png') as number,
  'pundix': require('../../assets/lambang/pundix.png') as number,
  'ray': require('../../assets/lambang/ray.png') as number,
  'sei': require('../../assets/lambang/sei.png') as number,
  'shib': require('../../assets/lambang/shib.png') as number,
  'sol': require('../../assets/lambang/sol.png') as number,
  'soph': require('../../assets/lambang/soph.png') as number,
  'steem': require('../../assets/lambang/steem.png') as number,
  'strax': require('../../assets/lambang/strax.png') as number,
  'stx': require('../../assets/lambang/stx.png') as number,
  'sui': require('../../assets/lambang/sui.png') as number,
  'tao': require('../../assets/lambang/tao.png') as number,
  'the': require('../../assets/lambang/the.png') as number,
  'theta': require('../../assets/lambang/theta.png') as number,
  'tia': require('../../assets/lambang/tia.png') as number,
  'tree': require('../../assets/lambang/tree.png') as number,
  'trx': require('../../assets/lambang/trx.png') as number,
  'tut': require('../../assets/lambang/tut.png') as number,
  'uni': require('../../assets/lambang/uni.png') as number,
  'usd': require('../../assets/lambang/usd.png') as number,
  'vtho': require('../../assets/lambang/vtho.png') as number,
  'waxp': require('../../assets/lambang/waxp.png') as number,
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
 * Pasar tanpa lambang TIDAK dibiarkan kosong: ia dapat lingkaran berhuruf.
 * Lubang di deret ikon terbaca sebagai gambar yang gagal dimuat, dan itu
 * membuat seluruh daftarnya terasa rusak.
 */
export function LambangPasar({ simbol, ukuran = 22 }: { simbol: string; ukuran?: number }) {
  const kunci = kunciLambang(simbol);
  const gaya = { width: ukuran, height: ukuran, borderRadius: R.bulat };
  if (kunci === null) {
    return (
      <View style={[gaya, g.ganti]}>
        <Text style={[g.huruf, { fontSize: Math.round(ukuran * 0.42) }]}>
          {simbol.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }
  return <Image source={LAMBANG[kunci]} style={gaya} accessibilityIgnoresInvertColors />;
}

const g = StyleSheet.create({
  ganti: { alignItems: 'center', justifyContent: 'center', backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis },
  huruf: { color: W.teksRedup, fontWeight: '700' },
});
