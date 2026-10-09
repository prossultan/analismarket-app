import { chromium } from '/home/analismarket/analismarket-web/node_modules/playwright/index.mjs'
/**
 * RENDER semua.html → PNG (7 papan, lembar ringkasan, 29 layar satu-satu).
 *
 *   node opendesign/mockups/polish-2026/ambil-data.mjs        # data produksi terbaru
 *   cd ~/analismarket-web && npx tsx ~/analismarket-app/opendesign/mockups/polish-2026/render-semua.mts
 *
 * Dijalankan dari repo web karena Playwright terpasang di sana.
 */
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const AKAR = dirname(fileURLToPath(import.meta.url))
const [M, OUT, mode] = [process.argv[2] ?? AKAR, process.argv[3] ?? AKAR + '/png/semua', process.argv[4] ?? 'semua']
const b = await chromium.launch()
const galat: string[] = []
const buka = async (skala: number) => {
  const ctx = await b.newContext({ viewport: { width: 2500, height: 1400 }, deviceScaleFactor: skala })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => galat.push('PAGEERROR ' + String(e).slice(0, 300)))
  p.on('console', (m) => { if (m.type() === 'error') galat.push('CONSOLE ' + m.text().slice(0, 200)) })
  p.on('requestfailed', (r) => galat.push('GAGAL ' + r.url().slice(-90)))
  await p.goto('file://' + M + '/semua.html', { waitUntil: 'load', timeout: 90000 })
  await p.waitForSelector('body[data-siap="1"]', { timeout: 60000 })
  await p.waitForTimeout(800)
  return p
}
const NAMA = ['masuk-beranda', 'pasar', 'akademi', 'pantau-kabar', 'amplus', 'akun', 'info']
if (mode === 'semua' || mode === 'papan') {
  const p = await buka(1.25)
  const papan = p.locator('section.papan-s')
  const n = await papan.count()
  for (let i = 0; i < n; i++) { await papan.nth(i).screenshot({ path: `${OUT}/papan-${i + 1}-${NAMA[i]}.png` }); console.log('papan', i + 1) }
  await p.locator('#kontak').screenshot({ path: `${OUT}/00-semua-layar.png` }); console.log('kontak')
  await p.context().close()
}
if (mode === 'semua' || mode === 'hp') {
  const p = await buka(2)
  const sel = p.locator('section.papan-s .sel')
  const n = await sel.count()
  for (let i = 0; i < n; i++) {
    const nama = (await sel.nth(i).locator('.cap b').innerText()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const no = await sel.nth(i).locator('.cap small').innerText()
    await sel.nth(i).locator('.hp').screenshot({ path: `${OUT}/hp-${no}-${nama}.png` })
  }
  console.log('hp', n)
  await p.context().close()
}
console.log('galat', galat.length, JSON.stringify(galat.slice(0, 8)))
await b.close()
