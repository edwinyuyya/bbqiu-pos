// ============================================================================
// PAKET & HARGA
// ----------------------------------------------------------------------------
// PENTING: angka di bawah ini adalah ANGKA CONTOH yang disusun dari kisaran
// biaya wajar di Jogja & Jawa Tengah. Sebelum website dipublikasikan, hitung
// ulang dengan biaya asli vendor Anda. Rumus dan rinciannya ada di
// `docs/rencana-bisnis.md`.
//
// Cara kerja `tarif`: harga per orang menurun saat jumlah peserta naik.
// Kalkulator di halaman /paket membaca array ini, jadi cukup ubah angkanya.
// ============================================================================

export const paket = [
  {
    id: 'private-berdua',
    nama: 'Private Berdua',
    sorot: 'Paling sering ditanyakan',
    untukSiapa:
      'Pasangan, atau satu orang yang ingin ditemani satu pendamping. Tidak digabung dengan siapa pun.',
    jawabanSingkat: 'Ya, berdua saja bisa. Ini paket yang dirancang khusus untuk itu.',
    durasi: '1 hari (10–12 jam)',
    destinasiMax: '2–3 lokasi dalam satu wilayah',
    tarif: [{ min: 2, max: 2, harga: 1450000 }],
    minPax: 2,
    maxPax: 2,
    termasuk: [
      'Mobil pribadi ber-AC beserta pengemudi',
      'BBM, tol, dan parkir',
      'Pemandu pendamping sepanjang perjalanan',
      'Koordinasi dan penghormatan untuk juru kunci di tiap lokasi',
      'Tiket masuk seluruh lokasi',
      'Uborampe dasar: kembang setaman dan dupa',
      'Air mineral dan 2 kali makan',
      'Asuransi perjalanan',
    ],
    tidakTermasuk: [
      'Penginapan (bisa ditambah, lihat tambahan di bawah)',
      'Pendamping spiritual senior (tambahan)',
      'Uborampe untuk ritual khusus di luar paket dasar',
      'Pengeluaran pribadi dan oleh-oleh',
    ],
  },

  {
    id: 'rombongan',
    nama: 'Rombongan Keluarga & Teman',
    sorot: 'Makin ramai, makin murah per orang',
    untukSiapa:
      'Satu keluarga besar, kantor, komunitas, atau grup pertemanan. Rombongan Anda sendiri, tidak dicampur rombongan lain.',
    jawabanSingkat:
      'Ya, bisa. Berapa pun jumlah Anda, dari 3 sampai 10 orang, tinggal pilih kendaraan yang cocok.',
    durasi: '1 hari (10–12 jam)',
    destinasiMax: '3–4 lokasi dalam satu wilayah',
    tarif: [
      { min: 3, max: 4, harga: 1150000 },
      { min: 5, max: 7, harga: 890000 },
      { min: 8, max: 10, harga: 720000 },
    ],
    minPax: 3,
    maxPax: 10,
    termasuk: [
      'Kendaraan ber-AC sesuai jumlah peserta (Innova, HiAce, atau Elf) beserta pengemudi',
      'BBM, tol, dan parkir',
      'Pemandu pendamping sepanjang perjalanan',
      'Koordinasi dan penghormatan untuk juru kunci di tiap lokasi',
      'Tiket masuk seluruh lokasi',
      'Uborampe dasar untuk rombongan',
      'Air mineral dan 2 kali makan',
      'Dokumentasi foto ringan',
      'Asuransi perjalanan',
    ],
    tidakTermasuk: [
      'Penginapan (bisa ditambah)',
      'Pendamping spiritual senior (tambahan)',
      'Uborampe untuk ritual khusus per orang',
      'Pengeluaran pribadi dan oleh-oleh',
    ],
  },

  {
    id: 'open-trip',
    nama: 'Open Trip Gabungan',
    sorot: 'Paling terjangkau',
    untukSiapa:
      'Anda berangkat sendiri atau berdua, lalu digabung dengan peserta lain sampai kuota terisi. Cocok untuk yang ingin berkenalan dengan sesama penekun.',
    jawabanSingkat:
      'Ya, ada. Kuota 12–15 orang per keberangkatan, jadwal tetap dua kali sebulan.',
    durasi: '1 hari (10–12 jam)',
    destinasiMax: '3 lokasi, rute sudah ditentukan',
    tarif: [{ min: 12, max: 15, harga: 385000 }],
    minPax: 1,
    maxPax: 15,
    hargaTetap: 385000, // open trip: harga per kepala tidak berubah
    termasuk: [
      'HiAce atau Elf ber-AC beserta pengemudi',
      'BBM, tol, dan parkir',
      'Pemandu pendamping untuk rombongan',
      'Koordinasi dan penghormatan untuk juru kunci',
      'Tiket masuk seluruh lokasi',
      'Uborampe dasar bersama',
      'Air mineral dan 1 kali makan',
      'Asuransi perjalanan',
    ],
    tidakTermasuk: [
      'Uborampe pribadi untuk laku masing-masing',
      'Makan di luar jadwal',
      'Penginapan',
      'Pendampingan spiritual perorangan — di open trip pendamping dibagi bersama',
    ],
    catatan:
      'Rute open trip sudah tetap dan tidak bisa diubah per peserta. Kalau Anda punya hajat ' +
      'atau laku khusus yang butuh waktu sendiri, ambil paket Private atau Laku Tirakat.',
  },

  {
    id: 'laku-tirakat',
    nama: 'Laku Tirakat Bermalam',
    sorot: 'Untuk yang datang dengan ujub',
    untukSiapa:
      'Peserta yang punya hajat tertentu dan ingin menjalankan laku dengan waktu yang cukup, bukan sekadar mampir.',
    jawabanSingkat:
      'Bisa perorangan sampai 4 orang. Semakin sedikit peserta, semakin leluasa waktunya.',
    durasi: '2 hari 1 malam',
    destinasiMax: '1–2 lokasi, dengan waktu panjang di lokasi utama',
    tarif: [
      { min: 1, max: 1, harga: 4200000 },
      { min: 2, max: 2, harga: 2750000 },
      { min: 3, max: 4, harga: 2100000 },
    ],
    minPax: 1,
    maxPax: 4,
    termasuk: [
      'Mobil pribadi ber-AC beserta pengemudi selama 2 hari',
      'BBM, tol, dan parkir',
      'Penginapan 1 malam (hotel bintang 3 atau homestay dekat lokasi)',
      'Pendamping spiritual berpengalaman sepanjang rangkaian',
      'Konsultasi persiapan sebelum berangkat, lewat telepon atau tatap muka',
      'Koordinasi dan izin khusus dengan juru kunci untuk laku di luar jam umum',
      'Uborampe lengkap sesuai laku yang dijalankan',
      'Tiket masuk, makan, dan air mineral',
      'Asuransi perjalanan',
    ],
    tidakTermasuk: [
      'Upgrade kelas hotel',
      'Penerbangan atau kereta dari kota asal',
      'Pengeluaran pribadi',
    ],
    catatan:
      'Sebelum memberi harga, kami mengobrol dulu dengan Anda tanpa biaya untuk memahami ujub dan ' +
      'kesiapan Anda. Kalau menurut kami perjalanan ini tidak tepat untuk situasi Anda saat ini, ' +
      'kami akan katakan terus terang dan tidak menjualnya.',
  },

  {
    id: 'ziarah-wali',
    nama: 'Ziarah Wali & Raja Jawa',
    sorot: 'Rangkaian lengkap',
    untukSiapa:
      'Rombongan pengajian, keluarga besar, atau komunitas yang ingin menuntaskan rangkaian ziarah dalam satu perjalanan.',
    jawabanSingkat: 'Bisa untuk 6 sampai 15 orang, dengan bus atau HiAce.',
    durasi: '3 hari 2 malam',
    destinasiMax: '6–8 lokasi lintas kabupaten',
    tarif: [
      { min: 6, max: 9, harga: 2250000 },
      { min: 10, max: 15, harga: 1850000 },
    ],
    minPax: 6,
    maxPax: 15,
    termasuk: [
      'HiAce atau bus medium ber-AC beserta pengemudi selama 3 hari',
      'BBM, tol, dan parkir',
      'Penginapan 2 malam, sekamar berdua',
      'Pemandu dan pemimpin tahlil sepanjang perjalanan',
      'Koordinasi dan penghormatan untuk juru kunci di seluruh lokasi',
      'Tiket masuk dan sewa busana adat di lokasi yang mewajibkan',
      'Uborampe dasar seluruh lokasi',
      '6 kali makan dan air mineral',
      'Dokumentasi foto dan video ringkas',
      'Asuransi perjalanan',
    ],
    tidakTermasuk: [
      'Kamar sendiri tanpa berbagi (tambahan)',
      'Penerbangan atau kereta dari kota asal',
      'Pengeluaran pribadi dan oleh-oleh',
    ],
  },
];

// ---- TAMBAHAN OPSIONAL ------------------------------------------------------

export const tambahan = [
  {
    id: 'pendamping-senior',
    nama: 'Pendamping spiritual senior',
    harga: 1500000,
    satuan: 'per perjalanan',
    ket: 'Pendamping dengan jam terbang panjang, khusus untuk laku yang butuh penanganan tertentu.',
  },
  {
    id: 'uborampe-lengkap',
    nama: 'Uborampe lengkap',
    harga: 750000,
    satuan: 'per orang',
    ket: 'Kembang setaman lengkap, cok bakal, tumpeng kecil, kain mori, dupa, dan menyan madu. Disiapkan sesuai laku Anda.',
  },
  {
    id: 'uborampe-dasar-tambahan',
    nama: 'Uborampe dasar tambahan',
    harga: 150000,
    satuan: 'per orang',
    ket: 'Kembang setaman dan dupa untuk peserta yang ingin membawa sendiri-sendiri.',
  },
  {
    id: 'hotel',
    nama: 'Tambah menginap',
    harga: 450000,
    satuan: 'per malam per kamar',
    ket: 'Hotel bintang 3 atau homestay terdekat. Naik kelas ke bintang 4 tersedia dengan selisih harga.',
  },
  {
    id: 'dokumentasi',
    nama: 'Dokumentasi foto & video',
    harga: 850000,
    satuan: 'per perjalanan',
    ket: 'Fotografer khusus, hasil sudah diedit. Tidak diunggah ke mana pun tanpa izin tertulis Anda.',
  },
  {
    id: 'jemput-bandara',
    nama: 'Jemput bandara atau stasiun',
    harga: 250000,
    satuan: 'sekali jalan',
    ket: 'YIA, Adisutjipto, Stasiun Tugu, atau Lempuyangan.',
  },
];

// ---- Fungsi bantu (dipakai kalkulator) --------------------------------------

export function hargaPerOrang(paketItem, pax) {
  if (paketItem.hargaTetap) return paketItem.hargaTetap;
  const baris = paketItem.tarif.find((t) => pax >= t.min && pax <= t.max);
  if (baris) return baris.harga;
  // Di luar rentang: pakai baris terdekat sebagai perkiraan.
  const urut = [...paketItem.tarif].sort((a, b) => a.min - b.min);
  if (pax < urut[0].min) return urut[0].harga;
  return urut[urut.length - 1].harga;
}

export function rentangHarga(paketItem) {
  const semua = paketItem.tarif.map((t) => t.harga);
  const min = Math.min(...semua);
  const max = Math.max(...semua);
  return { min, max, sama: min === max };
}
