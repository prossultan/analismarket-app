/**
 * TEMA — satu keadaan modul, dibaca saat RENDER.
 *
 * Masalah yang diselesaikan: `StyleSheet.create` dievaluasi saat modul
 * dimuat, jadi warna di dalamnya beku selamanya — tema terang tidak bisa
 * "menimpa" konstanta yang sudah dibaca. Jalan keluarnya bukan hook di 27
 * berkas, melainkan `gayaTema()`: gaya ditulis sebagai FUNGSI dari palet dan
 * baru dibangun saat properti pertamanya diakses, satu kali per tema, lalu
 * di-cache. Komponen tidak perlu tahu apa-apa; ia cukup dirender ulang.
 *
 * Yang merender ulang seluruh pohon saat tema berganti adalah `key` di akar
 * navigasi (App.tsx) — keadaan navigasinya disimpan dan dipulihkan supaya
 * layar yang sedang dibuka tidak hilang.
 */
import { useEffect, useState } from 'react';
import { PALET_GELAP, PALET_TERANG, _pasangPalet, type Palet } from './token';

export type Tema = 'gelap' | 'terang';

let aktif: Tema = 'gelap';
const pendengar = new Set<() => void>();

export function temaAktif(): Tema { return aktif; }
export function paletAktif(): Palet { return aktif === 'terang' ? PALET_TERANG : PALET_GELAP; }

export function setTema(t: Tema): void {
  if (t === aktif) return;
  aktif = t;
  _pasangPalet(paletAktif());
  for (const f of pendengar) f();
}

/** Berlangganan pergantian tema. Cuma akar app yang perlu ini. */
export function useTema(): Tema {
  const [t, setT] = useState<Tema>(aktif);
  useEffect(() => {
    const f = (): void => { setT(aktif); };
    pendengar.add(f);
    return () => { pendengar.delete(f); };
  }, []);
  return t;
}

/**
 * Gaya yang dibangun per tema, malas, di-cache.
 *
 * Mengembalikan Proxy: `g.kartu` menjawab `buat(palet)[kartu]` untuk tema yang
 * SEDANG aktif. Dua objek gaya (gelap, terang) hidup berdampingan; berganti
 * tema tidak membangun ulang apa pun yang sudah pernah dibangun.
 */
export function gayaTema<T extends object>(buat: (W: Palet) => T): T {
  const cache: Partial<Record<Tema, T>> = {};
  const ambil = (): T => {
    const ada = cache[aktif];
    if (ada !== undefined) return ada;
    const baru = buat(paletAktif());
    cache[aktif] = baru;
    return baru;
  };
  return new Proxy({} as T, {
    get: (_, k) => (ambil() as Record<string | symbol, unknown>)[k],
    has: (_, k) => k in (ambil() as object),
    ownKeys: () => Reflect.ownKeys(ambil() as object),
    getOwnPropertyDescriptor: (_, k) => Reflect.getOwnPropertyDescriptor(ambil() as object, k),
  });
}

/**
 * Penyimpan pilihan tema — dipasang akar app supaya tombol di kepala (yang
 * tidak memegang `setelan`) tetap bisa menyimpan pilihannya ke perangkat.
 */
let simpanTema: (t: Tema) => void = () => {};
export function pasangPenyimpanTema(f: (t: Tema) => void): void { simpanTema = f; }
export function gantiTema(t: Tema): void { setTema(t); simpanTema(t); }
