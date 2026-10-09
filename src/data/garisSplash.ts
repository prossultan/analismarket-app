/**
 * GARIS HARGA SPLASH PERTAMA — 40 harga tutup BTCUSDT h1 yang ASLI,
 * dibekukan di build (diambil dari `/api/bacaan` produksi, 7 Okt 16.00 UTC
 * sampai 9 Okt 07.00 UTC 2026).
 *
 * Kenapa beku, bukan diambil saat itu: splash pertama tayang SEBELUM ada
 * jaringan yang bisa diandalkan — pemasangan baru, belum ada simpanan,
 * belum tentu ada sambungan. Garis yang menunggu jaringan adalah garis yang
 * tidak pernah tampil. Ini bentuk pasar sungguhan; angkanya tidak dicetak
 * di mana pun, jadi ia tidak bisa basi sebagai harga.
 */
export const GARIS_SPLASH: readonly number[] = [
  83386.09, 83158.99, 83422.02, 83434.68, 83432.01, 83159.21, 83225.89, 83321.81, 83369.84, 83099.21,
  83168.01, 82757, 82652.01, 82684.01, 82885.38, 82998.75, 82866.05, 83119.48, 82734, 82506.01,
  82310, 82182.01, 82704, 81037.99, 80953.84, 80748.46, 81512, 81775.52, 81814, 81713.98,
  81896.73, 81754.45, 81808, 81974, 82113.4, 82427.72, 82250.01, 82352.39, 82574.75, 82664.01,
];
