// Data situs publik BBQIU (/bbqiu). Menu di sini SATU SUMBER dengan menu yang
// dipakai POS (lihat importMenuBBQIU di gas/Code.gs) — harga dan nama item
// disalin dari sana supaya harga di website tidak pernah beda dengan harga di
// kasir. Kalau harga naik, ubah di dua tempat itu sekaligus.

export const BRAND = {
  nama: 'BBQIU',
  subjudul: 'Grill, Suki & Eatery',
  tagline: 'Grill, Suki & Eatery — bakar sendiri, mulai 3.900 per tusuk',
  deskripsi:
    'BBQIU Grill, Suki & Eatery: panggangan di setiap meja, sate bakar, daging premium, dan steamboat dalam satu meja — dipesan per tusuk, bukan paket mahal.',
  wa: process.env.NEXT_PUBLIC_WA_NUMBER || '6281234567890',
  instagram: process.env.NEXT_PUBLIC_IG || 'bbqiu.id',
  email: process.env.NEXT_PUBLIC_EMAIL_CS || 'halo@bbqiu.id',
  alamat: process.env.NEXT_PUBLIC_ALAMAT || 'Jl. Contoh Raya No. 18, Kota Anda',
  jam: 'Setiap hari · 16.00 – 23.00 WIB',
};

export function waLink(pesan) {
  return `https://wa.me/${BRAND.wa}?text=${encodeURIComponent(pesan)}`;
}

export function rupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID');
}

// ---------------------------------------------------------------- MENU
// Nama item dirapikan kapitalisasinya untuk tampilan web; harga persis sama
// dengan yang tersimpan di POS.
export const MENU = [
  {
    slug: 'sate-3900',
    nama: 'Sate 3.900',
    ikon: '🥬',
    ringkas: 'Tusukan pembuka yang bikin meja langsung ramai. Sayur, tahu, jeroan — semuanya 3.900.',
    harga: 3900,
    station: 'Panggangan',
    items: [
      ['Buncis', 3900],
      ['Jagung Manis', 3900],
      ['Bawang Bombay', 3900],
      ['Kulit Ayam', 3900],
      ['Tofu Jepang', 3900],
      ['Usus Ayam', 3900],
      ['Tahu', 3900],
      ['Sosis Ayam', 3900],
      ['Sate Jamur Tiram', 3900],
      ['Sate Sawi Sendok', 3900],
      ['Sate Kangkung', 3900],
    ],
  },
  {
    slug: 'sate-6900',
    nama: 'Sate 6.900',
    ikon: '🍢',
    ringkas: 'Kelas paling laris. Bakso, jamur, dan ayam bumbu shaokao yang jadi alasan orang balik lagi.',
    harga: 6900,
    station: 'Panggangan',
    items: [
      ['Sate Ayam', 6900],
      ['Sate Ayam Bombay', 6900],
      ['Sate Brokoli', 6900],
      ['Bakso Ayam', 6900],
      ['Bakso Sapi', 6900],
      ['Jamur Enoki', 6900],
      ['Jamur Hioko', 6900],
      ['Jamur Kancing', 6900],
    ],
  },
  {
    slug: 'sate-9900',
    nama: 'Sate Spesial 9.900',
    ikon: '🔥',
    ringkas: 'Bagian yang biasanya cuma ada di rumah makan Tionghoa: kikil, paru, otot sapi, cumi.',
    harga: 9900,
    station: 'Panggangan',
    items: [
      ['Otot Sapi', 9900],
      ['Kikil Sapi', 9900],
      ['Paru Sapi', 9900],
      ['Sate Cumi', 9900],
      ['Smoked Beef Brokoli', 9900],
      ['Smoked Chicken', 9900],
      ['Odeng', 9900],
      ['Siomay', 9900],
    ],
  },
  {
    slug: 'sate-14900',
    nama: 'Sate Premium 14.900',
    ikon: '⭐',
    ringkas: 'Daging sapi pilihan dan udang jumbo dalam bentuk tusukan — premium tanpa harus pesan paket.',
    harga: 14900,
    station: 'Panggangan',
    items: [
      ['Saikoro', 14900],
      ['Sirloin', 14900],
      ['Beef Bacon', 14900],
      ['Shortplate Enoki', 14900],
      ['Smoked Beef Enoki', 14900],
      ['Patty', 14900],
      ['Udang Jumbo', 14900],
      ['Kambing', 14900],
    ],
  },
  {
    slug: 'daging-premium',
    nama: 'Daging Premium (Grill)',
    ikon: '🥩',
    ringkas: 'Potongan utuh untuk dibakar di panggangan meja. Porsi small, jadi bisa coba banyak jenis.',
    harga: 22900,
    station: 'Panggangan',
    items: [
      ['Saikoro', 24900],
      ['Chuck Crest Small', 24900],
      ['US Karubi Small (Spesial)', 22900],
      ['Sirloin Small', 22900],
      ['Tenderloin Small', 22900],
      ['Tendon Small', 22900],
      ['Lidah Small', 22900],
      ['Beef Bacon', 22900],
    ],
  },
  {
    slug: 'grill-suki',
    nama: 'Grill & Suki',
    ikon: '🍤',
    ringkas: 'Bebas dipilih: mau dibakar di panggangan atau dicelup ke kuah suki. Satu item, dua cara makan.',
    harga: 9900,
    station: 'Panggangan / Suki',
    items: [
      ['Udang', 24900],
      ['Fillet Salmon', 19900],
      ['Sosis Sapi', 19900],
      ['Dendeng (porsi)', 19900],
      ['Crab Nugget', 19900],
      ['Otak-otak Singapore', 19900],
      ['Bakso Sapi', 19900],
      ['Beef Patty', 17900],
      ['Smoked Beef', 17900],
      ['Siomay Bikinan Sendiri', 17900],
      ['Salmon Ball', 17900],
      ['Fillet Tuna', 17900],
      ['Fillet Dory', 17900],
      ['Fillet Ayam', 17900],
      ['Kulit Ayam', 17900],
      ['Crab Stick', 14900],
      ['Sosis Ayam', 14900],
      ['Chikuwa', 14900],
      ['Bakso Kakap', 14900],
      ['Jamur Enoki', 12900],
      ['Jamur Hioko', 12900],
      ['Onion Grill', 9900],
      ['Jagung Manis', 9900],
    ],
  },
  {
    slug: 'suki',
    nama: 'Suki / Steamboat',
    ikon: '🍲',
    ringkas: 'Kuah panas di sisi meja untuk menyeimbangkan bakaran. Sayur dan tahu segar.',
    harga: 9900,
    station: 'Suki',
    items: [
      ['Brokoli', 19900],
      ['Tofu', 14900],
      ['Jamur Kuping', 12900],
      ['Jamur Salju', 12900],
      ['Sawi Sendok', 9900],
      ['Sawi Putih', 9900],
      ['Tahu Sutra', 9900],
    ],
  },
  {
    slug: 'nasi-snack',
    nama: 'Nasi & Snack',
    ikon: '🍚',
    ringkas: 'Pendamping wajib. Nasi goreng dan kentang untuk yang datang bareng anak-anak.',
    harga: 6900,
    station: 'Dapur',
    items: [
      ['Nasi Putih', 6900],
      ['French Fries', 12900],
      ['Nasi Goreng Bawang', 24900],
      ['Soy Sauce Fried Rice', 24900],
      ['Egg Fried Rice', 30900],
      ['French Fries Brown (sharing)', 34900],
    ],
  },
];

export const PAKET = {
  nama: 'Paket Value Set',
  harga: 85000,
  ringkas: 'Sudah termasuk 2 nasi. Cara paling gampang buat pertama kali datang berdua.',
  isi: [
    'Campuran sate dari kelas 3.900 sampai spesial',
    'Item Grill & Suki pilihan dapur hari itu',
    '2 porsi nasi putih',
    'Kuah suki untuk satu meja',
  ],
};

// Angka acuan produk unggulan — dipakai di halaman /bbqiu/produk.
export const UNGGULAN = [
  {
    nama: 'Sate Premium 14.900',
    harga: 14900,
    ikon: '⭐',
    kenapa:
      'Saikoro dan sirloin dalam bentuk tusukan. Rasa daging premium tanpa harus memesan porsi besar — ini alasan orang mengajak teman balik lagi minggu depan.',
  },
  {
    nama: 'Paket Value Set',
    harga: 85000,
    ikon: '🎁',
    kenapa:
      'Satu harga, satu meja penuh, sudah termasuk 2 nasi. Menu pembuka untuk tamu yang belum tahu harus pesan apa.',
  },
  {
    nama: 'Grill & Suki Udang',
    harga: 24900,
    ikon: '🍤',
    kenapa:
      'Udang besar yang boleh dibakar atau dicelup kuah. Satu item dengan dua cara makan — ini yang paling sering difoto tamu.',
  },
  {
    nama: 'US Karubi Small',
    harga: 22900,
    ikon: '🥩',
    kenapa:
      'Potongan short rib khas Jepang dengan porsi kecil, jadi satu meja bisa mencicipi lima jenis daging dalam satu kunjungan.',
  },
  {
    nama: 'Sate 3.900',
    harga: 3900,
    ikon: '🥬',
    kenapa:
      'Titik masuk termurah di seluruh menu. Tamu memesan sepuluh tusuk tanpa berpikir — dan itu yang membuat rata-rata belanja per meja naik.',
  },
  {
    nama: 'Suki Steamboat',
    harga: 9900,
    ikon: '🍲',
    kenapa:
      'Penyeimbang bakaran. Kehadiran kuah membuat tamu bertahan lebih lama di meja dan memesan ronde kedua.',
  },
];

// ------------------------------------------------------------ KEMITRAAN
// CATATAN: angka investasi di bawah adalah ANGKA CONTOH untuk kerangka
// halaman. Sesuaikan dengan penawaran resmi sebelum situs dipublikasikan.
export const PAKET_MITRA = [
  {
    nama: 'Booth Express',
    investasi: 85000000,
    ukuran: '2 × 3 meter',
    balik: '8 – 12 bulan',
    unggulan: true,
    cocok: 'Foodcourt mall, area kampus, ruko kecil',
    isi: [
      'Booth + panggangan + peralatan dapur',
      'Sistem kasir BBQIU POS (QR meja, dapur, stok)',
      'Pelatihan 7 hari untuk 3 orang kru',
      'Bahan baku awal & bumbu rahasia 1 bulan',
      'Materi promosi pembukaan',
    ],
  },
  {
    nama: 'Resto Standar',
    investasi: 285000000,
    ukuran: '60 – 100 m² · 12–18 meja',
    balik: '14 – 20 bulan',
    unggulan: false,
    cocok: 'Ruko dua lantai, area kuliner kota',
    isi: [
      'Desain interior + panggangan di setiap meja',
      'Full sistem: kasir, dapur, gudang, laporan owner',
      'Pelatihan 14 hari + pendampingan buka 7 hari',
      'Supply chain daging & bumbu terpusat',
      'Dukungan marketing 3 bulan pertama',
    ],
  },
  {
    nama: 'Master Area',
    investasi: 0,
    ukuran: 'Satu kota / kabupaten',
    balik: 'Dihitung per wilayah',
    unggulan: false,
    cocok: 'Investor yang ingin memegang hak wilayah',
    isi: [
      'Hak pengembangan eksklusif satu wilayah',
      'Bagi hasil dari setiap outlet di wilayah',
      'Pendampingan rekrutmen & training center',
      'Skema investasi disusun bersama',
    ],
  },
];

export const SKEMA_KERJASAMA = [
  {
    ikon: '🏪',
    nama: 'Mitra Outlet',
    ringkas:
      'Buka BBQIU di kota Anda dengan merek, resep, sistem, dan rantai pasok yang sudah berjalan.',
    poin: ['Booth Express sampai Resto Standar', 'Survei lokasi dibantu tim pusat', 'Sistem POS ikut dalam paket'],
  },
  {
    ikon: '🚚',
    nama: 'Mitra Pemasok',
    ringkas:
      'Pemasok daging, sayur, dan kemasan dengan kontrak volume tetap dan pembayaran terjadwal.',
    poin: ['Kontrak bulanan, bukan pesanan lepas', 'Standar mutu tertulis & jelas', 'Pembayaran sesuai jadwal'],
  },
  {
    ikon: '🎪',
    nama: 'Event & Katering',
    ringkas:
      'Panggangan BBQIU untuk gathering kantor, arisan, dan bazar. Tim datang dengan alat lengkap.',
    poin: ['Minimal 30 porsi', 'Kru + peralatan panggang dibawa', 'Menu bisa disesuaikan anggaran'],
  },
  {
    ikon: '🤝',
    nama: 'Kolaborasi Brand',
    ringkas:
      'Kerja sama promo dengan brand minuman, bank, e-wallet, dan komunitas kuliner.',
    poin: ['Promo bersama di meja & struk', 'Akses ke basis pelanggan aktif', 'Laporan hasil kampanye'],
  },
];

export const PROSES_MITRA = [
  ['Kirim minat', 'Isi form di halaman ini atau chat WhatsApp. Sebutkan kota dan perkiraan modal.'],
  ['Presentasi & angka', 'Tim mengirim proposal lengkap: rincian investasi, proyeksi omzet, dan struktur biaya.'],
  ['Survei lokasi', 'Kami menilai lokasi calon outlet — lalu lintas orang, parkir, dan daya listrik.'],
  ['Tanda tangan', 'Perjanjian kemitraan, pembayaran tahap pertama, dan penjadwalan pembangunan.'],
  ['Bangun & latih', 'Outlet dibangun, kru dilatih di outlet berjalan, sistem POS dipasang dan diuji.'],
  ['Grand opening', 'Tim pusat mendampingi minggu pertama sampai operasional stabil.'],
];

export const FAQ_MITRA = [
  [
    'Apakah saya harus punya pengalaman restoran?',
    'Tidak. Justru sebagian besar mitra datang dari bidang lain. Yang wajib adalah kesediaan turun ke outlet pada bulan-bulan awal — pemilik yang hadir selalu menghasilkan outlet yang lebih sehat.',
  ],
  [
    'Bahan baku harus beli dari pusat?',
    'Bumbu, saus, dan daging marinasi wajib dari pusat karena itu yang menjaga rasa tetap sama di semua outlet. Sayur dan kebutuhan harian boleh dibeli lokal dengan standar yang kami tetapkan.',
  ],
  [
    'Berapa royalti bulanannya?',
    'Skema royalti dan biaya sistem dijelaskan lengkap di proposal, termasuk apa saja yang Anda terima sebagai gantinya. Tidak ada biaya yang muncul belakangan.',
  ],
  [
    'Kalau lokasi saya ternyata kurang bagus?',
    'Survei lokasi dilakukan sebelum perjanjian ditandatangani. Kalau menurut tim lokasinya tidak layak, kami akan mengatakannya — mencegah satu outlet gagal jauh lebih murah daripada memperbaikinya.',
  ],
  [
    'Apakah wilayah saya diproteksi?',
    'Ya. Setiap outlet mendapat radius eksklusif yang ditulis dalam perjanjian, sehingga outlet baru tidak dibuka berdekatan dengan outlet Anda.',
  ],
  [
    'Sistem kasirnya bagaimana?',
    'Setiap outlet memakai BBQIU POS: pesanan lewat QR meja, cetak otomatis ke station panggangan/suki/dapur, kontrol stok dan HPP, serta laporan omzet harian yang bisa dilihat pemilik dari mana saja.',
  ],
];

export const ANGKA = [
  ['79+', 'item menu aktif'],
  ['3.900', 'harga tusuk termurah'],
  ['4', 'kelas sate dalam satu meja'],
  ['18', 'meja dengan panggangan sendiri'],
];
