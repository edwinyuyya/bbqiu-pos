// Membuat PDF label harga siap cetak sticker untuk showcase chiller.
//
// Berbeda dari tombol cetak di halaman Admin: berkas ini untuk dibawa ke
// percetakan sticker. Tata letaknya pas di A4, tanpa kepala/kaki halaman
// (bahan sticker mahal, jangan dipakai mencetak tulisan yang dibuang), dan
// tiap label diberi garis potong tipis sebagai acuan gunting atau plotter.
//
// Tampilan labelnya dibaca dari app/globals.css supaya PDF ini tidak pernah
// berbeda dengan yang terlihat di layar Admin.
//
// Cara pakai:
//   node docs/buat-label-harga.mjs
//
// Sumber data: docs/label/menu.json (hasil ekspor dari basis data).
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const dirLabel = path.join(dir, 'label');

const MERCHANT = process.env.NEXT_PUBLIC_MERCHANT_NAME || 'BBQIU';

// Ambil hanya bagian label dari globals.css — sisanya (tema aplikasi,
// struk termal) tidak ada urusannya dengan lembar sticker.
function gayaLabel() {
  const css = fs.readFileSync(path.join(dir, '..', 'app', 'globals.css'), 'utf8');
  const i = css.indexOf('/* ---------- Label harga untuk showcase chiller');
  if (i < 0) throw new Error('Blok CSS label harga tidak ditemukan di globals.css');
  return css.slice(i);
}

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function aman(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// Susunan yang pas di A4 tanpa memaksa; sisa tepi dipakai sebagai jarak aman
// mesin cetak, yang hampir selalu tidak bisa mencetak sampai ujung kertas.
const UKURAN = {
  '90x55': { kelas: 'label-90', kolom: 2, baris: 5, jarak: 2, berkas: 'Label-Harga-90x55.pdf' },
  '60x40': { kelas: 'label-60', kolom: 3, baris: 6, jarak: 3, berkas: 'Label-Harga-60x40.pdf' },
};

function satuLabel(item, kelas) {
  const diskon = Number(item.discount_percent) > 0 ? Number(item.discount_percent) : 0;
  const harga = diskon ? Math.round(item.price * (1 - diskon / 100)) : Number(item.price);
  return `<div class="label-harga ${kelas}">
  <div class="kepala">
    <span>${aman(MERCHANT)}</span>
    ${item.needs_cook_method ? '<span>GRILL / STEAMBOAT</span>' : ''}
  </div>
  <div class="badan">
    <div class="nama">${aman(item.name)}</div>
    ${item.description ? `<div class="ket">${aman(item.description)}</div>` : ''}
    <div class="harga">${rupiah(harga)}</div>
    <div class="kaki">
      <span>per porsi</span>
      ${diskon ? `<span>coret ${rupiah(item.price)} &middot; &minus;${diskon}%</span>` : ''}
    </div>
  </div>
</div>`;
}

function lembar(items, uk) {
  const perHalaman = uk.kolom * uk.baris;
  const halaman = [];
  for (let i = 0; i < items.length; i += perHalaman) {
    halaman.push(items.slice(i, i + perHalaman));
  }
  const isi = halaman.map((h) => `<div class="halaman">
  <div class="kisi">${h.map((it) => satuLabel(it, uk.kelas)).join('\n')}</div>
</div>`).join('\n');

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Label Harga ${MERCHANT}</title>
<style>
${gayaLabel()}

/* --- tata letak lembar sticker --- */
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
.halaman {
  width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center;
  page-break-after: always; break-after: page;
}
.halaman:last-child { page-break-after: auto; break-after: auto; }
.kisi {
  display: grid;
  grid-template-columns: repeat(${uk.kolom}, max-content);
  gap: ${uk.jarak}mm;
  align-content: center;
}
/* Garis potong tipis: cukup untuk jadi acuan, tidak mencolok kalau tersisa
   sedikit di tepi sticker yang terpotong miring. */
.label-harga { border: 0.25mm solid #9a9a9a !important; }
</style></head><body>
${isi}
</body></html>`;
}

const kandidat = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean).find((p) => p === process.env.CHROME_PATH || fs.existsSync(p));

const menu = JSON.parse(fs.readFileSync(path.join(dirLabel, 'menu.json'), 'utf8'));
const browser = await chromium.launch({ executablePath: kandidat });
const page = await browser.newPage();

for (const [nama, uk] of Object.entries(UKURAN)) {
  const tmp = path.join(dirLabel, `.${nama}.html`);
  fs.writeFileSync(tmp, lembar(menu, uk));
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await page.pdf({
    path: path.join(dirLabel, uk.berkas),
    width: '210mm', height: '297mm',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  // SIMPAN_HTML=1 menahan berkas HTML-nya untuk diperiksa saat menyetel
  // tata letak; tanpa itu berkas sementara dibuang seperti biasa.
  if (!process.env.SIMPAN_HTML) fs.unlinkSync(tmp);
  const perHalaman = uk.kolom * uk.baris;
  console.log(
    `✓ ${uk.berkas.padEnd(26)} ${menu.length} label · ` +
    `${Math.ceil(menu.length / perHalaman)} lembar A4 · ${perHalaman}/lembar`
  );
}

await browser.close();
console.log('\nSelesai. Berkas ada di', dirLabel);
