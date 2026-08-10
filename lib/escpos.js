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
