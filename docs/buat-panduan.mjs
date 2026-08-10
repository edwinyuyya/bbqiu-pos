// Membuat PDF panduan dari potongan bab di docs/panduan/bab/.
//
// Satu buku lengkap untuk arsip, dan satu buku tipis per divisi. Staf hanya
// membaca bagian yang jadi tanggung jawabnya — buku 26 halaman yang isinya
// 80% bukan urusannya cenderung tidak dibaca sama sekali.
//
// Isi bab ditulis satu kali dan dipakai ulang oleh beberapa buku, supaya
// panduan kasir dan panduan lengkap tidak pernah berbeda isinya.
//
// Cara pakai:
//   npm i -D playwright-core
//   node docs/buat-panduan.mjs
//
// Chromium diambil dari CHROME_PATH bila diisi; kalau tidak, dicari di
// lokasi yang umum.
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const dirBab = path.join(dir, 'panduan', 'bab');
const dirHasil = path.join(dir, 'panduan');

const gaya = fs.readFileSync(path.join(dir, 'panduan', 'gaya.css'), 'utf8');

// judul dipakai untuk daftar isi; peran jadi lencana di sampingnya
const BAB = {
  peta:      { berkas: '01-peta-sistem.html',  judul: 'Peta Sistem — bagaimana pesanan mengalir' },
  aturan:    { berkas: '02-aturan-emas.html',  judul: 'Enam Aturan Emas', peran: 'WAJIB DIBACA' },
  pelanggan: { berkas: '03-pelanggan-qr.html', judul: 'Pelanggan Memesan Lewat QR Meja' },
  kasir:     { berkas: '04-kasir.html',        judul: 'Kasir', peran: 'KASIR' },
  uang:      { berkas: '05-uang-harian.html',  judul: 'Uang Harian — Omzet & Pengeluaran', peran: 'KASIR' },
  dapur:     { berkas: '06-dapur.html',        judul: 'Dapur', peran: 'DAPUR' },
  waiter:    { berkas: '07-waiter.html',       judul: 'Waiter', peran: 'WAITER' },
  antrian:   { berkas: '08-antrian.html',      judul: 'Antrian Tunggu', peran: 'WAITER' },
  reservasi: { berkas: '09-reservasi.html',    judul: 'Reservasi & Pra-pesanan', peran: 'WAITER' },
  gudang:    { berkas: '10-gudang.html',       judul: 'Gudang, Stok & Produksi', peran: 'GUDANG' },
  admin:     { berkas: '11-admin.html',        judul: 'Admin — Menu, Harga, Diskon', peran: 'ADMIN' },
  owner:     { berkas: '12-owner.html',        judul: 'Dashboard Owner & Biaya Tetap', peran: 'OWNER' },
  cetak:     { berkas: '13-cetak-struk.html',  judul: 'Mencetak Struk 58mm' },
  masalah:   { berkas: '14-masalah.html',      judul: 'Kalau Ada Masalah' },
  ringkasan: { berkas: '15-ringkasan.html',    judul: 'Ringkasan Satu Halaman' },
};

const BUKU = [
  {
    berkas: 'Panduan-BBQIU-Lengkap.pdf',
    judul: 'Panduan Lengkap<br>Sistem BBQIU',
    sub: 'Seluruh divisi dalam satu buku',
    untuk: 'Arsip, pemilik, dan pelatihan staf baru',
    bab: ['peta', 'aturan', 'pelanggan', 'kasir', 'uang', 'dapur', 'waiter',
      'antrian', 'reservasi', 'gudang', 'admin', 'owner', 'cetak', 'masalah', 'ringkasan'],
  },
  {
    berkas: 'Panduan-Kasir.pdf',
    judul: 'Panduan Kasir',
    sub: 'Pembayaran, tagihan, uang harian',
    untuk: 'Petugas kasir',
    bab: ['peta', 'aturan', 'pelanggan', 'kasir', 'uang', 'cetak', 'masalah', 'ringkasan'],
  },
  {
    berkas: 'Panduan-Waiter.pdf',
    judul: 'Panduan Waiter',
    sub: 'Meja, antrian, reservasi',
    untuk: 'Waiter dan penerima tamu',
    bab: ['peta', 'aturan', 'pelanggan', 'waiter', 'antrian', 'reservasi', 'masalah', 'ringkasan'],
  },
  {
    berkas: 'Panduan-Dapur.pdf',
    judul: 'Panduan Dapur',
    sub: 'Layar dapur & struk station',
    untuk: 'Juru masak dan kepala dapur',
    bab: ['peta', 'aturan', 'dapur', 'cetak', 'masalah', 'ringkasan'],
  },
  {
    berkas: 'Panduan-Gudang.pdf',
    judul: 'Panduan Gudang & Stok',
    sub: 'Barang datang, produksi, opname',
    untuk: 'Petugas gudang dan belanja',
    bab: ['peta', 'aturan', 'gudang', 'masalah', 'ringkasan'],
  },
  {
    berkas: 'Panduan-Admin-Owner.pdf',
    judul: 'Panduan Admin &amp; Owner',
    sub: 'Menu, harga, promo, laporan, biaya tetap',
    untuk: 'Pemilik dan admin sistem',
    bab: ['peta', 'aturan', 'admin', 'owner', 'uang', 'gudang', 'masalah'],
  },
];

function sampul(buku) {
  return `<div class="page cover">
  <div class="logo">🔥</div>
  <h1>${buku.judul}</h1>
  <div class="sub">${buku.sub}</div>
  <div class="tag">
    BBQIU Grill, Suki &amp; Eatery<br>
    <span class="small">Untuk: <b>${buku.untuk}</b>. Simpan di dekat tempat kerja Anda.</span>
  </div>
</div>`;
}

function daftarIsi(baris) {
  const isi = baris.map((b) =>
    `<div><span><span class="bab">${b.no}.</span> ${b.judul}` +
    (b.peran ? ` <span class="peran">${b.peran}</span>` : '') +
    `</span><span class="muted">${b.halaman}</span></div>`
  ).join('\n    ');

  return `<div class="page">
  <h2>Daftar Isi</h2>
  <div class="toc">
    ${isi}
  </div>

  <div class="box info" style="margin-top:26px">
    <p class="judul">Cara membaca buku ini</p>
    <p>Buku ini sudah disaring untuk peran Anda — semuanya perlu dibaca. Mulailah dari bab Aturan Emas; itu bagian yang paling sering menyelamatkan.</p>
  </div>
  <div class="box ingat">
    <p class="judul">Arti tanda dalam buku ini</p>
    <p><b style="color:#b91c1c">Kotak merah</b> = kesalahan yang merugikan uang atau bikin pelanggan marah. Baca pelan-pelan.</p>
    <p><b style="color:#15803d">Kotak hijau</b> = tips supaya kerja lebih cepat.</p>
    <p><b style="color:#1d4ed8">Kotak biru</b> = penjelasan tambahan, boleh dilewati kalau sedang buru-buru.</p>
  </div>
</div>`;
}

function dokumen(judul, isi) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>${judul}</title>
<style>${gaya}</style></head><body>
${isi}
</body></html>`;
}

const OPSI_PDF = {
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
};

function jumlahHalaman(buf) {
  const m = buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : 1;
}

// Nomor halaman di daftar isi harus benar, kalau tidak daftar isinya justru
// menyesatkan. Satu <div class="page"> TIDAK selalu jadi satu halaman cetak —
// bab yang isinya panjang meluber. Jadi tiap bab dirender sendiri dulu untuk
// dihitung; karena antar bab selalu ada pemisah halaman, jumlahnya tidak
// terpengaruh bab sebelumnya.
const cacheHalaman = new Map();
async function hitungHalaman(page, kunci, html) {
  if (cacheHalaman.has(kunci)) return cacheHalaman.get(kunci);
  const tmp = path.join(dirHasil, `.ukur-${kunci}.html`);
  fs.writeFileSync(tmp, dokumen('ukur', html));
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  const n = jumlahHalaman(await page.pdf(OPSI_PDF));
  fs.unlinkSync(tmp);
  cacheHalaman.set(kunci, n);
  return n;
}

async function susun(page, buku) {
  const potongan = [];
  const bab = [];

  for (const [i, kunci] of buku.bab.entries()) {
    const info = BAB[kunci];
    if (!info) throw new Error(`Bab tidak dikenal: ${kunci}`);
    const html = fs.readFileSync(path.join(dirBab, info.berkas), 'utf8')
      .replaceAll('{{NO}}', String(i + 1));
    potongan.push(html);
    // Diukur dengan nomor bab apa pun; jumlah halamannya sama.
    bab.push({ no: i + 1, ...info, tebal: await hitungHalaman(page, kunci, html) });
  }

  // Daftar isi bisa memakan satu atau dua halaman tergantung banyaknya bab,
  // dan itu menggeser nomor semua bab. Jadi diukur, bukan diasumsikan —
  // diulang sampai angkanya berhenti berubah (cukup 2-3 putaran).
  let awal = 3;
  let depan = '';
  for (let putaran = 0; putaran < 4; putaran++) {
    let h = awal;
    const baris = bab.map((b) => {
      const r = { ...b, halaman: h };
      h += b.tebal;
      return r;
    });
    depan = `${sampul(buku)}\n${daftarIsi(baris)}`;
    const tebalDepan = await hitungHalaman(page, `depan-${buku.berkas}-${putaran}`, depan);
    if (tebalDepan + 1 === awal) break;
    awal = tebalDepan + 1;
  }

  // Berapa halaman buku ini seharusnya, menurut hitungan yang dipakai
  // daftar isi. Dicocokkan dengan hasil render sungguhan di bawah — kalau
  // meleset, berarti ada nomor halaman di daftar isi yang salah.
  const perkiraan = (awal - 1) + bab.reduce((s, b) => s + b.tebal, 0);

  return {
    html: dokumen(buku.judul.replace(/<br>/g, ' '), `${depan}\n${potongan.join('\n')}`),
    perkiraan,
  };
}

const kandidat = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean).find((p) => p === process.env.CHROME_PATH || fs.existsSync(p));

const browser = await chromium.launch({ executablePath: kandidat });
const page = await browser.newPage();
let gagal = 0;

for (const buku of BUKU) {
  const sementara = path.join(dirHasil, `.${buku.berkas}.html`);
  const { html, perkiraan } = await susun(page, buku);
  fs.writeFileSync(sementara, html);
  await page.goto('file://' + sementara, { waitUntil: 'networkidle' });
  const buf = await page.pdf({
    ...OPSI_PDF,
    path: path.join(dirHasil, buku.berkas),
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font-size:8pt;color:#8a7a6b;padding:0 14mm;display:flex;' +
      'justify-content:space-between;font-family:sans-serif">' +
      `<span>${buku.judul.replace(/<br>/g, ' ')} — BBQIU</span><span class="pageNumber"></span></div>`,
  });
  fs.unlinkSync(sementara);

  const nyata = jumlahHalaman(buf);
  const cocok = nyata === perkiraan;
  if (!cocok) gagal++;
  console.log(
    `${cocok ? '✓' : '✗'} ${buku.berkas.padEnd(28)} ${String(nyata).padStart(2)} halaman` +
    (cocok ? '' : `  <-- daftar isi menghitung ${perkiraan}, nomor halamannya meleset`)
  );
}

await browser.close();

if (gagal) {
  console.error(`\n${gagal} buku punya nomor halaman yang meleset di daftar isi.`);
  process.exit(1);
}
console.log('\nSelesai. Berkas ada di', dirHasil);
