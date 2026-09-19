/**
 * KUNCI PUBLIK Clerk — sama dengan yang dipakai web (`VITE_CLERK_PUBLISHABLE_KEY`).
 *
 * Ini kunci PUBLISHABLE: ia memang dikirim ke tiap peramban yang membuka
 * analismarket.com, jadi menyimpannya di sini tidak membuka apa pun yang
 * belum terbuka. Yang RAHASIA (`CLERK_SECRET_KEY`) cuma ada di server bot
 * dan tidak pernah menyentuh repo ini.
 *
 * Satu instance Clerk untuk web dan app: akun yang masuk lewat Google di
 * web adalah akun yang sama di app, dan tautan Telegram-nya ikut.
 */
export const KUNCI_CLERK = 'pk_live_Y2xlcmsuYW5hbGlzbWFya2V0LmNvbSQ';
