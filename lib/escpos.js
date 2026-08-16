// Pembuat perintah ESC/POS untuk printer struk termal 58mm.
//
// KENAPA TIDAK PAKAI window.print() SAJA?
// Printer bluetooth 58mm murah berbicara ESC/POS lewat Bluetooth Classic
// (profil SPP). Kerangka cetak Android hanya mengenal printer yang
// didaftarkan oleh sebuah "print service" (Mopria dan sejenisnya) — printer
// yang dipasangkan lewat menu Bluetooth biasa TIDAK ada di sana. Jadi dialog
// cetak browser cuma menawarkan "Simpan sebagai PDF", atau gagal saat
// mencoba mengubah halaman jadi gambar. Solusinya: kirim byte perintahnya
// langsung, jangan minta browser menggambar halaman.
//
// Kertas 58mm: area cetaknya 48mm (384 titik pada 203 dpi) = 32 karakter
// per baris dengan Font A. Angka 58 adalah lebar kertasnya, bukan lebar
// cetaknya — salah satu sebab kolom harga sering terpotong.

const ESC = 0x1b;
const GS = 0x1d;

export const LEBAR_58MM = 32;

// Printer termal hanya punya tabel karakter 1 byte. Emoji, em-dash, dan
// tanda kutip melengkung keluar jadi sampah — jadi diterjemahkan dulu.
const GANTI = {
  '—': '-', '–': '-', '‑': '-', '−': '-',
  '·': '-', '•': '*', '…': '...',
  '“': '"', '”': '"', '„': '"',
  '‘': "'", '’': "'",
  '×': 'x', '÷': '/', '≈': '~',
  ' ': ' ',
};

export function keAscii(s) {
  let t = String(s ?? '');
  for (const [dari, ke] of Object.entries(GANTI)) t = t.split(dari).join(ke);
  // Pisahkan tanda diakritik (é -> e) lalu buang sisa yang bukan ASCII,
  // termasuk emoji.
  t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return t.replace(/[^\x20-\x7e\n]/g, '');
}

// Potong teks panjang jadi beberapa baris selebar kertas, memutus di spasi
// bila memungkinkan.
//
// Spasi di depan dipertahankan dan diulang pada sambungan barisnya. Tanpa itu
// catatan item ("  * pedas") yang kepanjangan turun rata kiri dan terbaca
// seperti item baru — di dapur itu berarti satu porsi ekstra dimasak.
export function bungkus(teks, lebar) {
  const asli = keAscii(teks);
  const indentasi = (asli.match(/^ +/) || [''])[0].slice(0, Math.max(0, lebar - 4));
  const ruang = Math.max(1, lebar - indentasi.length);

  const kata = asli.trim().split(/\s+/).filter(Boolean);
  const baris = [];
  let kini = '';
  for (const k of kata) {
    if (!kini) kini = k;
    else if ((kini + ' ' + k).length <= ruang) kini += ' ' + k;
    else { baris.push(kini); kini = k; }
    while (kini.length > ruang) { baris.push(kini.slice(0, ruang)); kini = kini.slice(ruang); }
  }
  if (kini) baris.push(kini);
  if (!baris.length) return [''];
  return baris.map((b) => indentasi + b);
}

export class Struk {
  constructor(lebar = LEBAR_58MM) {
    this.lebar = lebar;
    this.b = [];
    this.perintah(ESC, 0x40);        // inisialisasi
    this.perintah(ESC, 0x74, 0x00);  // tabel karakter PC437
  }

  perintah(...bytes) { this.b.push(...bytes); return this; }

  // rata: 0 kiri, 1 tengah, 2 kanan
  rata(n) { return this.perintah(ESC, 0x61, n); }
  tebal(on) { return this.perintah(ESC, 0x45, on ? 1 : 0); }
  // 0 normal, 1 tinggi ganda, 0x10 lebar ganda, 0x11 keduanya
  ukuran(n) { return this.perintah(GS, 0x21, n); }

  teks(s) {
    for (const ch of keAscii(s)) this.b.push(ch.charCodeAt(0));
    return this;
  }

  baris(s = '') {
    for (const l of bungkus(s, this.lebar)) { this.teks(l); this.b.push(0x0a); }
    return this;
  }

  // Kiri–kanan dalam satu baris (nama vs harga). Kalau kolom kiri kepanjangan,
  // dia turun sendiri supaya angka di kanan tidak pernah terpotong.
  duaKolom(kiri, kanan) {
    const kn = keAscii(kanan);
    const sisa = this.lebar - kn.length;
    const kr = keAscii(kiri);
    if (kr.length <= sisa - 1) {
      this.teks(kr + ' '.repeat(this.lebar - kr.length - kn.length) + kn);
      this.b.push(0x0a);
    } else {
      this.baris(kr);
      this.teks(' '.repeat(this.lebar - kn.length) + kn);
      this.b.push(0x0a);
    }
    return this;
  }

  // Cetak bitmap 1-bit lewat GS v 0 (raster bit image).
  //
  // Dipakai untuk QR. Menyerahkan QR sebagai <img> lalu menekan window.print()
  // tidak bisa diandalkan pada printer bluetooth 58mm: dialog cetak Android
  // tidak melihat printer SPP, dan kalaupun tercetak, halamannya diskalakan
  // printer sehingga QR mengecil sampai tidak terbaca. Byte raster dikirim apa
  // adanya — satu titik di sini sama dengan satu titik di kertas.
  //
  // titik: fungsi (x, y) -> true kalau hitam. lebar/tinggi dalam titik.
  // Lebar dibulatkan ke atas ke kelipatan 8 karena tiap byte memuat 8 titik.
  raster(lebar, tinggi, titik) {
    const bytesPerBaris = Math.ceil(lebar / 8);
    const data = new Uint8Array(bytesPerBaris * tinggi);
    for (let y = 0; y < tinggi; y++) {
      for (let x = 0; x < lebar; x++) {
        if (!titik(x, y)) continue;
        // Bit paling kiri = bit tertinggi dalam byte.
        data[y * bytesPerBaris + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
    this.perintah(GS, 0x76, 0x30, 0x00);
    this.perintah(bytesPerBaris & 0xff, (bytesPerBaris >> 8) & 0xff);
    this.perintah(tinggi & 0xff, (tinggi >> 8) & 0xff);
    this.b.push(...data);
    return this;
  }

  // QR dari matriks modul (array 0/1 sepanjang size*size).
  //
  // skala = berapa titik printer per satu modul QR. Di 203dpi, 1 titik =
  // 0,125mm; skala 8 memberi modul 1mm — jauh di atas ambang baca kamera HP,
  // dan QR-nya sendiri jadi sekitar 33mm untuk QR 33 modul.
  qr(modul, size, skala = 8, lebarKertas = 384) {
    const sisi = size * skala;
    // Dipusatkan, dan tepi putihnya ikut dicetak: pemindai butuh zona sunyi
    // di sekeliling kode, dan kertas termal tidak menyediakannya sendiri.
    const kiri = Math.max(0, Math.floor((lebarKertas - sisi) / 2));
    const lebar = Math.min(lebarKertas, kiri + sisi);
    return this.raster(lebar, sisi, (x, y) => {
      const mx = x - kiri;
      if (mx < 0 || mx >= sisi) return false;
      return modul[((y / skala) | 0) * size + ((mx / skala) | 0)] === 1;
    });
  }

  tengah(s) { this.rata(1); this.baris(s); return this.rata(0); }
  garis(ch = '-') { return this.baris(ch.repeat(this.lebar)); }
  kosong(n = 1) { for (let i = 0; i < n; i++) this.b.push(0x0a); return this; }

  // Maju kertas lalu potong. Printer tanpa pisau mengabaikan perintah potong,
  // jadi aman dikirim ke semuanya.
  selesai() { return this.perintah(ESC, 0x64, 4).perintah(GS, 0x56, 0x01); }

  bytes() { return new Uint8Array(this.b); }

  base64() {
    let s = '';
    const a = this.bytes();
    // Dicicil supaya argumen fromCharCode tidak kepanjangan pada struk besar.
    for (let i = 0; i < a.length; i += 4096) {
      s += String.fromCharCode(...a.subarray(i, i + 4096));
    }
    return btoa(s);
  }
}
