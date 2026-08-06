// ============================================================================
// KONFIGURASI UTAMA — ganti isinya sesuai identitas usaha Anda.
// Semua halaman menarik data dari sini, jadi cukup edit satu file ini.
// ============================================================================

export const site = {
  // Nama brand. Ganti kalau sudah punya nama final.
  nama: 'Laku Jawa',
  tagline: 'Perjalanan Spiritual & Ziarah Tanah Jawa',

  // Kalimat pembuka di halaman depan.
  deskripsi:
    'Pendampingan perjalanan ke tempat-tempat keramat di Jogja dan Jawa Tengah — ' +
    'ziarah, laku spiritual, dan wisata budaya, dengan juru kunci resmi, ' +
    'harga terbuka, dan tanpa janji palsu.',

  // Dipakai untuk <meta> dan sitemap. Ganti setelah domain aktif.
  url: 'https://lakujawa.id',

  // ---- KONTAK ----------------------------------------------------------
  // Nomor WhatsApp format internasional TANPA tanda + dan tanpa spasi.
  // Contoh: 0812-3456-7890  ->  6281234567890
  whatsapp: '6281234567890',
  email: 'halo@lakujawa.id',
  kota: 'Yogyakarta',
  alamat: 'Jl. Contoh No. 1, Yogyakarta (ganti dengan alamat asli)',

  // ---- SOSIAL MEDIA ----------------------------------------------------
  instagram: 'lakujawa.id',
  tiktok: 'lakujawa.id',
  youtube: '', // kosongkan kalau belum ada

  // ---- LEGALITAS (isi setelah terbit, ini pembeda besar di mata calon klien) --
  legalitas: {
    // Kosongkan string kalau belum ada — otomatis tidak ditampilkan.
    nib: '',
    badanUsaha: '', // contoh: 'CV Laku Jawa Nusantara'
    asosiasi: '', // contoh: 'Anggota ASITA DIY'
  },

  // ---- JANJI LAYANAN (tampil di beranda) -------------------------------
  janji: [
    {
      judul: 'Juru kunci resmi, bukan calo',
      isi:
        'Setiap lokasi kami dampingi lewat juru kunci atau pengelola yang diakui ' +
        'warga dan pemerintah desa setempat. Kami tidak bekerja sama dengan orang ' +
        'yang mengaku-ngaku punya akses khusus.',
    },
    {
      judul: 'Harga terbuka sejak awal',
      isi:
        'Rincian biaya kami kirim sebelum Anda bayar: transport, penginapan, tiket, ' +
        'uborampe, dan penghormatan untuk juru kunci. Tidak ada tagihan dadakan di lokasi.',
    },
    {
      judul: 'Tidak menjual jaminan hasil',
      isi:
        'Kami memfasilitasi perjalanan dan laku, bukan menjual kepastian. Siapa pun ' +
        'yang menjanjikan kekayaan, jodoh, atau kesembuhan dengan nominal tertentu, ' +
        'patut Anda curigai — termasuk kalau itu kami.',
    },
    {
      judul: 'Privasi dijaga',
      isi:
        'Tujuan dan hajat Anda adalah urusan pribadi. Tidak ada dokumentasi yang ' +
        'kami unggah tanpa izin tertulis Anda.',
    },
  ],
};

// Membuat tautan WhatsApp lengkap dengan pesan yang sudah terisi.
export function waLink(pesan) {
  const teks = encodeURIComponent(pesan || 'Halo, saya ingin bertanya soal paket perjalanan.');
  return `https://wa.me/${site.whatsapp}?text=${teks}`;
}

// Format angka jadi Rupiah: 1450000 -> "Rp 1.450.000"
export function rupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}
