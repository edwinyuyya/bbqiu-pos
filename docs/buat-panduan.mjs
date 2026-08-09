// Membuat PDF panduan staf dari docs/panduan-staf.html
//
// Cara pakai:
//   npm i -D playwright-core
//   node docs/buat-panduan.mjs
//
// Chromium diambil dari PLAYWRIGHT_BROWSERS_PATH bila ada; kalau tidak,
// isi CHROME_PATH dengan lokasi Chrome/Chromium di komputer Anda.
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sumber = path.join(dir, 'panduan-staf.html');
const hasil = path.join(dir, 'Panduan-BBQIU.pdf');

const kandidat = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean);

const browser = await chromium.launch({ executablePath: kandidat[0] });
const page = await browser.newPage();
await page.goto('file://' + sumber, { waitUntil: 'networkidle' });
await page.pdf({
  path: hasil,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-size:8pt;color:#8a7a6b;padding:0 14mm;display:flex;' +
    'justify-content:space-between;font-family:sans-serif">' +
    '<span>Panduan Penggunaan Sistem BBQIU</span><span class="pageNumber"></span></div>',
  margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
});
await browser.close();
console.log('Selesai:', hasil);
