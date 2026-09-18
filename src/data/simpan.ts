/**
 * Pengaturan yang hidup DI HP, bukan di akun.
 *
 * App belum punya identitas — `/api/saya/*` masih menuntut Telegram — jadi
 * tidak ada tempat di server untuk menyimpan pilihan orang. Menyimpannya di
 * HP jujur terhadap keadaan itu: pilihan bertahan antar buka-tutup, dan tidak
 * berpura-pura ikut pindah HP.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Setelan = { pasar: string; tf: string; mesin: string };

export const SETELAN_BAWAAN: Setelan = { pasar: 'SOLUSDT', tf: 'h1', mesin: '' };

const KUNCI = 'am:setelan:v1';

export async function bacaSetelan(): Promise<Setelan> {
  try {
    const t = await AsyncStorage.getItem(KUNCI);
    if (t === null) return SETELAN_BAWAAN;
    const j = JSON.parse(t) as Partial<Setelan>;
    /* Medan yang hilang jatuh ke bawaan satu per satu — bukan seluruh objek
       dibuang. Setelan versi lama tidak boleh menghapus pilihan yang masih sah. */
    return {
      pasar: typeof j.pasar === 'string' && j.pasar !== '' ? j.pasar : SETELAN_BAWAAN.pasar,
      tf: typeof j.tf === 'string' && j.tf !== '' ? j.tf : SETELAN_BAWAAN.tf,
      mesin: typeof j.mesin === 'string' ? j.mesin : SETELAN_BAWAAN.mesin,
    };
  } catch {
    return SETELAN_BAWAAN;
  }
}

export async function simpanSetelan(s: Setelan): Promise<void> {
  try {
    await AsyncStorage.setItem(KUNCI, JSON.stringify(s));
  } catch {
    /* Penyimpanan penuh atau ditolak bukan alasan menjatuhkan app. Pilihannya
       tetap berlaku untuk sesi ini; yang hilang cuma ingatannya. */
  }
}
