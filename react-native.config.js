/**
 * MODUL NATIVE YANG TIDAK BOLEH IKUT DITAUTKAN.
 *
 * `@clerk/clerk-expo` menyeret `@solana-mobile/*` untuk dompet Web3. Modul
 * itu punya manifes Android yang MENDAFTARKAN app ini sebagai penangan
 * `solana-wallet://` — di APK 19 Sep ia benar-benar ada, tanpa satu baris
 * pun di repo ini yang memintanya. App baca chart tidak boleh mengaku
 * sebagai dompet.
 *
 * Dua mekanisme sekaligus (expo.autolinking.exclude di package.json dan
 * berkas ini) karena Expo dan RN CLI menautkan lewat jalur berbeda.
 * Kebenarannya diperiksa dari APK: `node skrip/periksa-apk.mjs <apk>`.
 */
module.exports = {
  dependencies: {
    '@solana-mobile/mobile-wallet-adapter-protocol': { platforms: { android: null, ios: null } },
    '@solana-mobile/mobile-wallet-adapter-protocol-web3js': { platforms: { android: null, ios: null } },
    '@solana-mobile/wallet-adapter-mobile': { platforms: { android: null, ios: null } },
    '@solana-mobile/wallet-standard-mobile': { platforms: { android: null, ios: null } },
  },
};
