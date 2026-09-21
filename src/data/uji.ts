/**
 * SEKAT UJI — dibuka HANYA oleh profil build `uji` di eas.json, lewat
 * `EXPO_PUBLIC_TANPA_TEMBOK=1`, untuk emulator di GitHub Actions.
 *
 * Emulator tidak bisa masuk lewat Google maupun Telegram, sedangkan layar
 * yang paling sering rusak (Chart) hidup di balik tembok masuk. Dengan sekat
 * ini build uji membuka tab-tab tanpa sesi: Chart dan Pasar bekerja penuh
 * karena endpoint-nya memang publik; layar akun cukup menggambar keadaan
 * "belum masuk".
 *
 * Profil `pratinjau` dan `produksi` TIDAK boleh memasangnya — dijaga
 * `skrip/periksa-toko.mjs`. Nilainya disisipkan saat bundel dibuat, jadi di
 * build biasa cabang ini terkompilasi jadi konstanta `false`.
 */
export const TANPA_TEMBOK = process.env.EXPO_PUBLIC_TANPA_TEMBOK === '1';
