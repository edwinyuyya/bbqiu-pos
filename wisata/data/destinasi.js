// ============================================================================
// DAFTAR DESTINASI
// ----------------------------------------------------------------------------
// Cara menambah destinasi: salin satu blok objek di bawah, ganti isinya.
// `slug` harus unik dan tanpa spasi — itu yang jadi alamat halamannya
// (contoh: slug 'parangkusumo' -> /destinasi/parangkusumo).
//
// FOTO & VIDEO
//   foto:  taruh file di folder `public/foto/`, lalu tulis '/foto/namafile.jpg'
//          Kalau array `foto` dibiarkan kosong, website otomatis menampilkan
//          motif batik buatan sebagai gantinya — jadi halaman tetap rapi
//          walau Anda belum sempat memotret.
//   video: tempel ID video YouTube saja, bukan URL penuh.
//          https://youtube.com/watch?v=AbCdEf123  ->  'AbCdEf123'
// ============================================================================

export const destinasi = [
  {
    slug: 'parangkusumo',
    nama: 'Cepuri Parangkusumo',
    lokasi: 'Parangtritis, Kretek, Bantul',
    kabupaten: 'Bantul, DIY',
    kategori: ['laku', 'budaya'],
    tingkat: 'Ringan',
    durasi: 'Setengah hari, umumnya malam hari',
    warna: '#2f4858',
    foto: [],
    video: '',
    ringkas:
      'Pesanggrahan di tepi Pantai Selatan, tempat upacara Labuhan Kraton Yogyakarta digelar turun-temurun.',
    sejarah:
      'Cepuri Parangkusumo adalah pelataran berpagar batu di belakang gumuk pasir Parangtritis, ' +
      'berisi dua batu yang dalam tutur Jawa disebut Batu Cinta — ditandai sebagai tempat pertemuan ' +
      'Panembahan Senopati, pendiri Mataram Islam, dengan penguasa Laut Selatan. Sampai hari ini ' +
      'Kraton Yogyakarta rutin menggelar Labuhan Alit di sini setiap tanggal 30 Rajab, mengantar ' +
      'ubarampe berupa potongan kuku, rambut, dan busana Sultan ke laut. Terlepas dari kepercayaan ' +
      'pribadi masing-masing pengunjung, kawasan ini adalah situs upacara kenegaraan Kraton yang ' +
      'masih hidup, bukan sekadar cerita rakyat.',
    tujuanUmum: [
      'Menyaksikan atau mengikuti rangkaian Labuhan Alit Kraton',
      'Laku semedi dan tirakat malam, umumnya pada malam Selasa Kliwon dan Jumat Kliwon',
      'Nyekar dan mengirim doa di pelataran Cepuri',
      'Belajar sejarah Mataram Islam dan tradisi sedekah laut',
    ],
    laku: [
      'Semedi hening di pelataran Cepuri, biasanya lepas tengah malam sampai menjelang subuh',
      'Melarung kembang setaman ke laut sebagai laku sedekah',
      'Puasa mutih atau ngebleng yang dimulai beberapa hari sebelum keberangkatan',
    ],
    uborampe: [
      'Kembang setaman (mawar, melati, kenanga, kantil)',
      'Dupa atau menyan madu',
      'Kain mori putih untuk alas duduk',
      'Air kendi dan kelapa muda hijau untuk laku tertentu',
    ],
    adab: [
      'Lepas alas kaki saat masuk pelataran Cepuri.',
      'Minta izin lebih dulu kepada juru kunci yang berjaga, jangan langsung masuk.',
      'Jangan memotret orang yang sedang bersemedi tanpa izin.',
      'Ombak Pantai Selatan berbahaya — jangan berenang, dan jangan berdiri terlalu dekat garis air saat melarung.',
      'Larangan adat memakai busana hijau di kawasan Pantai Selatan masih dipegang banyak warga. Kami sarankan menghormatinya.',
    ],
    waktuTerbaik:
      'Malam Selasa Kliwon dan Jumat Kliwon paling ramai peziarah. Untuk suasana tenang, pilih malam biasa. ' +
      'Labuhan Alit jatuh pada 30 Rajab, tanggalnya bergeser tiap tahun.',
    jurukunci:
      'Kawasan Cepuri dijaga abdi dalem yang ditugaskan Kraton, bergantian sesuai jadwal. ' +
      'Kami koordinasi lebih dulu agar rombongan Anda diterima dan tidak berbenturan dengan agenda Kraton.',
  },

  {
    slug: 'imogiri',
    nama: 'Pajimatan Imogiri',
    lokasi: 'Makam Raja-Raja Mataram, Imogiri',
    kabupaten: 'Bantul, DIY',
    kategori: ['ziarah', 'budaya'],
    tingkat: 'Sedang',
    durasi: 'Setengah hari',
    warna: '#4a3f35',
    foto: [],
    video: '',
    ringkas:
      'Kompleks pemakaman raja-raja Mataram di puncak bukit, dicapai lewat 409 anak tangga batu.',
    sejarah:
      'Dibangun Sultan Agung Hanyakrakusuma sekitar tahun 1632 sebagai pemakaman keluarga besar ' +
      'Mataram. Sesudah Perjanjian Giyanti membelah Mataram, kompleks ini tetap dipakai bersama ' +
      'oleh Kasunanan Surakarta dan Kasultanan Yogyakarta — masing-masing punya bagian sendiri, ' +
      'dijaga abdi dalem masing-masing. Sultan Agung, Amangkurat, dan para Sultan Yogyakarta ' +
      'dimakamkan di sini. Bagi banyak orang Jawa, Imogiri adalah puncak dari rangkaian ziarah ' +
      'leluhur, bukan sekadar objek wisata sejarah.',
    tujuanUmum: [
      'Ziarah ke makam Sultan Agung dan raja-raja Mataram',
      'Napak tilas silsilah keluarga bagi keturunan abdi dalem atau kerabat Kraton',
      'Studi sejarah dan arsitektur pemakaman kerajaan Jawa',
      'Mengambil air dari Padasan Enggung untuk laku tertentu',
    ],
    laku: [
      'Tahlil dan doa di depan cungkup makam',
      'Nyekar dengan kembang setaman',
      'Wirid atau tirakat semalam bagi peziarah yang mendapat izin khusus',
    ],
    uborampe: [
      'Kembang setaman',
      'Minyak wangi non-alkohol',
      'Sewa busana adat peranakan (wajib, tersedia di lokasi)',
    ],
    adab: [
      'WAJIB berbusana adat: pria memakai peranakan dan kain jarik tanpa baju dalam, wanita memakai kemben dan jarik. Bisa disewa di gerbang, sudah kami masukkan ke biaya paket.',
      'Makam hanya dibuka pada hari tertentu — umumnya Senin, Jumat, dan Minggu, dengan jam terbatas. Di luar itu hanya halaman luar yang bisa dimasuki.',
      'Dilarang memotret di dalam area cungkup makam.',
      'Bicara seperlunya dan pelan. Ini kompleks pemakaman yang masih aktif dijaga.',
      '409 anak tangga cukup curam. Beri tahu kami kalau ada peserta lansia atau berlutut lemah — kami siapkan jalur dan jeda.',
    ],
    waktuTerbaik:
      'Pagi hari sebelum pukul 10.00 agar tidak kepanasan di tangga. Cek jadwal buka makam — ini yang paling sering bikin peziarah gagal masuk.',
    jurukunci:
      'Dijaga abdi dalem juru kunci dari Kraton Yogyakarta dan Kasunanan Surakarta. ' +
      'Kami mengurus izin masuk dan pendampingan sebelum hari keberangkatan, termasuk memastikan hari itu makam benar-benar dibuka.',
  },

  {
    slug: 'sumbu-filosofi',
    nama: 'Sumbu Filosofi Yogyakarta',
    lokasi: 'Panggung Krapyak — Kraton — Tugu Pal Putih',
    kabupaten: 'Kota Yogyakarta, DIY',
    kategori: ['budaya'],
    tingkat: 'Ringan',
    durasi: 'Setengah hari',
    warna: '#7a5c2e',
    foto: [],
    video: '',
    ringkas:
      'Garis imajiner sepanjang enam kilometer yang menyusun kota Yogyakarta sebagai perumpamaan perjalanan hidup manusia.',
    sejarah:
      'Ditetapkan UNESCO sebagai Warisan Dunia pada 2023. Sumbu ini menghubungkan Panggung Krapyak ' +
      'di selatan, Kraton di tengah, dan Tugu Pal Putih di utara dalam satu garis lurus. Bagi orang ' +
      'Jawa, rutenya dibaca sebagai dua arah: dari selatan ke utara adalah sangkan paraning dumadi — ' +
      'perjalanan manusia dari lahir menuju Sang Pencipta; dari utara ke selatan adalah perjalanan ' +
      'kembali ke dunia. Setiap bangunan, pohon, dan nama kampung di sepanjang jalur punya bacaan ' +
      'simbolis yang jarang diketahui pengunjung biasa.',
    tujuanUmum: [
      'Memahami filosofi Jawa lewat tata ruang kota, bukan lewat teori',
      'Pembuka rangkaian perjalanan — kami sering menaruhnya di hari pertama sebagai pengantar',
      'Wisata budaya untuk rombongan keluarga dengan anak, karena ringan dan aman',
      'Dokumentasi foto dengan latar heritage',
    ],
    laku: [
      'Laku jalan kaki menyusuri sumbu dari selatan ke utara, dilakukan hening sambil merenung',
      'Mubeng beteng — mengelilingi benteng Kraton, biasanya pada malam 1 Sura',
    ],
    uborampe: ['Tidak ada uborampe khusus. Cukup alas kaki yang nyaman dan air minum.'],
    adab: [
      'Berbusana sopan, terutama saat memasuki area Kraton dan Masjid Gedhe.',
      'Kraton punya jam kunjung terbatas dan tutup saat ada acara adat.',
      'Hormati abdi dalem yang bertugas — mereka bukan pemandu wisata, tapi pengabdi Kraton.',
    ],
    waktuTerbaik:
      'Pagi atau sore. Untuk pengalaman paling dalam, ikut Mubeng Beteng pada malam 1 Sura — ' +
      'ribuan orang berjalan tanpa bicara mengelilingi benteng.',
    jurukunci:
      'Kami mendampingkan pemandu budaya bersertifikat yang paham bacaan simbolis tiap titik, ' +
      'bukan sekadar hafalan tanggal.',
  },

  {
    slug: 'merapi',
    nama: 'Merapi & Petilasan Juru Kunci',
    lokasi: 'Kaliadem, Klangon, dan lereng selatan Merapi',
    kabupaten: 'Sleman, DIY',
    kategori: ['laku', 'budaya'],
    tingkat: 'Sedang',
    durasi: 'Sehari penuh',
    warna: '#4b3b3b',
    foto: [],
    video: '',
    ringkas:
      'Lereng gunung yang jadi tempat Labuhan Merapi, dengan jejak erupsi 2010 yang masih terbaca jelas.',
    sejarah:
      'Merapi punya kedudukan khusus dalam kosmologi Jawa sebagai penyeimbang Pantai Selatan, dengan ' +
      'Kraton Yogyakarta di antaranya. Setiap tahun Kraton menggelar Labuhan Merapi di Alas Bedengan, ' +
      'diantar juru kunci yang diangkat resmi oleh Sultan. Nama Mbah Maridjan dikenal luas sesudah ' +
      'ia bertahan di posnya dan wafat dalam erupsi 2010 — kini petilasan dan Museum Sisa Hartaku ' +
      'di Kepuharjo menyimpan sisa-sisa peristiwa itu. Perjalanan ke sini menggabungkan laku budaya ' +
      'dengan pelajaran yang sangat konkret soal hidup berdampingan dengan gunung api aktif.',
    tujuanUmum: [
      'Menghadiri atau menyaksikan rangkaian Labuhan Merapi',
      'Ziarah ke petilasan dan makam juru kunci',
      'Memahami tradisi kearifan lokal warga lereng dalam membaca tanda-tanda gunung',
      'Wisata jip lava tour bagi rombongan yang ingin sisi petualangannya',
    ],
    laku: [
      'Nyekar di makam juru kunci',
      'Ikut kenduri warga lereng bila jadwalnya bertepatan',
      'Semedi di titik-titik petilasan dengan izin pengelola',
    ],
    uborampe: [
      'Kembang setaman',
      'Kemenyan dan dupa',
      'Nasi tumpeng kecil bila mengikuti kenduri bersama warga',
    ],
    adab: [
      'Merapi gunung api aktif. Status dan zona aman berubah sewaktu-waktu — kami selalu cek BPPTKG sebelum berangkat dan siap membatalkan titik tertentu demi keselamatan.',
      'Jangan mengambil batu atau benda apa pun dari kawasan bekas erupsi.',
      'Museum Sisa Hartaku berisi barang milik korban. Bersikap sepantasnya, jangan bercanda di dalamnya.',
      'Udara dingin dan berdebu — bawa jaket dan masker.',
    ],
    waktuTerbaik:
      'Musim kemarau (Mei–September) untuk jarak pandang terbaik. Labuhan Merapi digelar sehari sesudah ' +
      'penobatan Sultan menurut penanggalan Jawa.',
    jurukunci:
      'Kami bekerja sama dengan juru kunci penerus yang diangkat Kraton dan komunitas warga lereng ' +
      'yang terlatih sebagai pemandu — mereka yang paling tahu kapan sebuah jalur aman dilewati.',
  },

  {
    slug: 'gunung-lawu',
    nama: 'Gunung Lawu: Cetho, Sukuh & Hargo Dalem',
    lokasi: 'Lereng barat Lawu, Karanganyar',
    kabupaten: 'Karanganyar, Jawa Tengah',
    kategori: ['laku', 'budaya', 'pendakian'],
    tingkat: 'Berat',
    durasi: '2 hari 1 malam',
    warna: '#3d4a34',
    foto: [],
    video: '',
    ringkas:
      'Dua candi akhir zaman Majapahit di lereng berkabut, dan petilasan di puncak yang jadi tujuan tirakat paling dicari.',
    sejarah:
      'Candi Cetho dan Candi Sukuh dibangun pada abad ke-15, di masa senjakala Majapahit, dengan bentuk ' +
      'punden berundak yang lebih tua daripada gaya candi Hindu-Buddha umumnya — banyak ahli membacanya ' +
      'sebagai kembalinya corak megalitik pra-Hindu. Di Cetho, pemeluk Hindu masih menggelar ibadah ' +
      'sampai hari ini. Naik ke puncak Lawu terdapat Hargo Dalem, yang dalam tutur Jawa dikaitkan dengan ' +
      'moksa Prabu Brawijaya V, raja terakhir Majapahit. Sepanjang tahun, terutama pada malam-malam ' +
      'tertentu, pendaki dan pelaku tirakat naik ke sana dengan tujuan yang jauh dari sekadar rekreasi.',
    tujuanUmum: [
      'Tirakat dan semedi di Hargo Dalem atau Sendang Drajat',
      'Ziarah bagi yang merasa punya garis keturunan atau ikatan dengan Majapahit',
      'Wisata sejarah ke dua candi tanpa harus mendaki ke puncak',
      'Pendakian dengan makna, bukan sekadar mengejar puncak',
    ],
    laku: [
      'Tirakat semalam di Hargo Dalem',
      'Mandi atau mengambil air di Sendang Drajat',
      'Puasa pati geni sebelum pendakian, dilakukan sebagian pelaku laku',
      'Selamatan kecil di Cetho sebelum memulai pendakian',
    ],
    uborampe: [
      'Kembang setaman',
      'Dupa, kemenyan, dan cok bakal',
      'Kain mori',
      'Perbekalan gunung: jaket tebal, sleeping bag, senter, logistik',
    ],
    adab: [
      'Candi Cetho adalah tempat ibadah aktif umat Hindu. Wajib memakai kain poleng yang disediakan di gerbang, dan jangan mengganggu yang sedang sembahyang.',
      'Pendakian Lawu bukan untuk pemula. Suhu bisa mendekati nol derajat di puncak dan sudah ada korban hipotermia.',
      'Wajib lapor dan registrasi di basecamp. Kami uruskan, tapi identitas asli tetap harus Anda bawa.',
      'Jangan meninggalkan sampah, termasuk sisa uborampe yang tidak mudah terurai.',
      'Untuk peserta yang tidak sanggup mendaki, kami sediakan program alternatif di lereng — tidak perlu memaksakan diri.',
    ],
    waktuTerbaik:
      'Malam 1 Sura dan malam Jumat Legi adalah puncak keramaian pelaku tirakat. Hindari musim hujan ' +
      '(Desember–Februari) karena jalur licin dan berkabut tebal.',
    jurukunci:
      'Kami menggandeng juru kunci Hargo Dalem serta porter dan pemandu gunung bersertifikat dari ' +
      'basecamp setempat. Untuk paket ini pendamping fisik dan pendamping spiritual adalah dua orang berbeda.',
  },

  {
    slug: 'gunung-kemukus',
    nama: 'Makam Pangeran Samudro, Gunung Kemukus',
    lokasi: 'Waduk Kedung Ombo, Sumberlawang',
    kabupaten: 'Sragen, Jawa Tengah',
    kategori: ['ziarah'],
    tingkat: 'Ringan',
    durasi: 'Setengah hari',
    warna: '#3f4a52',
    foto: [],
    video: '',
    ringkas:
      'Makam tokoh penyebar Islam di bukit tepi waduk, yang sudah direvitalisasi menjadi kawasan ziarah resmi.',
    sejarah:
      'Makam Pangeran Samudro dipercaya sebagai tempat peristirahatan seorang tokoh penyebar Islam ' +
      'di masa Demak. Selama puluhan tahun nama Gunung Kemukus terlanjur dikaitkan dengan praktik ' +
      'menyimpang yang berkembang di sekitarnya. Sejak pertengahan 2010-an, Pemerintah Kabupaten ' +
      'Sragen menertibkan kawasan ini dan merevitalisasinya menjadi destinasi ziarah dan wisata ' +
      'waduk yang tertata. Kami sengaja memasukkannya ke daftar dengan catatan tegas di bawah ini.',
    catatan:
      'Kami HANYA memfasilitasi ziarah dan doa di makam Pangeran Samudro. Kami tidak memfasilitasi, ' +
      'tidak mengantar, dan tidak menghubungkan siapa pun dengan praktik ritual menyimpang yang ' +
      'pernah beredar mengatasnamakan tempat ini. Permintaan semacam itu akan kami tolak, tanpa ' +
      'kecuali. Bila ada pihak yang menawarkannya kepada Anda, itu penipuan sekaligus tindak pidana.',
    tujuanUmum: [
      'Ziarah dan tahlil di makam Pangeran Samudro',
      'Napak tilas jalur penyebaran Islam di pedalaman Jawa Tengah',
      'Wisata bentang alam Waduk Kedung Ombo',
    ],
    laku: ['Tahlil dan doa di makam', 'Nyekar dengan kembang setaman'],
    uborampe: ['Kembang setaman', 'Air minum'],
    adab: [
      'Berbusana sopan dan tertutup.',
      'Ikuti arahan pengelola resmi kawasan. Jangan melayani tawaran dari orang tak dikenal di area parkir.',
      'Hormati peziarah lain yang sedang berdoa.',
    ],
    waktuTerbaik: 'Pagi hari. Malam Jumat Pon secara tradisi paling ramai peziarah.',
    jurukunci:
      'Kawasan dikelola resmi oleh Pemerintah Kabupaten Sragen bersama juru kunci makam. ' +
      'Kami hanya berkoordinasi dengan pengelola resmi.',
  },

  {
    slug: 'goa-langse',
    nama: 'Goa Langse',
    lokasi: 'Tebing Pantai Selatan, Kalirejo, Girijati',
    kabupaten: 'Gunungkidul, DIY',
    kategori: ['laku'],
    tingkat: 'Berat',
    durasi: 'Sehari penuh atau menginap di goa',
    warna: '#33414a',
    foto: [],
    video: '',
    ringkas:
      'Goa di dinding tebing yang menghadap langsung Samudra Hindia, dicapai dengan menuruni tebing curam. Salah satu tempat tirakat paling berat di Jawa.',
    sejarah:
      'Goa Langse terletak di ceruk tebing karst setinggi kurang lebih tiga ratus meter di atas ' +
      'Pantai Selatan. Dalam tutur Jawa, goa ini dikaitkan dengan laku tapa para tokoh Mataram, ' +
      'dan sampai sekarang dipakai orang untuk tirakat berhari-hari. Aksesnya menuruni tebing ' +
      'lewat tangga besi dan tali tambang yang dipasang warga. Ini bukan destinasi wisata biasa; ' +
      'kami hanya melayani peserta yang benar-benar siap secara fisik dan mental.',
    catatan:
      'Kami melakukan penyaringan untuk destinasi ini. Peserta dengan gangguan jantung, vertigo, ' +
      'tekanan darah tinggi, kondisi kejiwaan yang sedang tidak stabil, atau sedang hamil, tidak ' +
      'kami berangkatkan — berapa pun bayarannya. Ini bukan soal uang, ini soal nyawa.',
    tujuanUmum: [
      'Tapa dan tirakat berhari-hari bagi pelaku laku yang sudah berpengalaman',
      'Semedi hening menghadap Samudra Hindia',
    ],
    laku: [
      'Tapa ngeluwang atau tapa kungkum sesuai laku masing-masing',
      'Puasa mutih beberapa hari sebelum turun ke goa',
      'Semedi semalam sampai beberapa malam di dalam goa',
    ],
    uborampe: [
      'Kembang setaman',
      'Kain mori putih',
      'Dupa dan kemenyan',
      'Logistik air dan makanan untuk seluruh durasi tirakat — tidak ada warung di bawah',
    ],
    adab: [
      'Wajib didampingi juru kunci dan pemandu tali. Tidak ada pengecualian.',
      'Jangan turun saat hujan atau angin kencang. Kami akan membatalkan dan menjadwal ulang tanpa biaya tambahan.',
      'Sinyal telepon tidak ada di dalam goa. Kami tinggalkan satu orang tim di atas tebing sepanjang waktu.',
      'Bawa naik kembali seluruh sampah dan sisa perbekalan.',
    ],
    waktuTerbaik:
      'Musim kemarau, saat tebing kering. Malam Selasa Kliwon dan Jumat Kliwon paling banyak dicari pelaku laku.',
    jurukunci:
      'Juru kunci Goa Langse tinggal di desa atas dan mengelola akses tali. Kami wajib ' +
      'mendaftarkan nama peserta lebih dulu — tidak bisa datang mendadak.',
  },

  {
    slug: 'sunan-bayat',
    nama: 'Makam Sunan Bayat',
    lokasi: 'Bukit Jabalkat, Paseban, Bayat',
    kabupaten: 'Klaten, Jawa Tengah',
    kategori: ['ziarah'],
    tingkat: 'Sedang',
    durasi: 'Setengah hari',
    warna: '#5a4a30',
    foto: [],
    video: '',
    ringkas:
      'Makam Ki Ageng Pandanaran, bekas Bupati Semarang yang meninggalkan jabatannya untuk menjadi penyebar agama.',
    sejarah:
      'Sunan Bayat atau Ki Ageng Pandanaran dikisahkan sebagai Bupati Semarang yang meninggalkan ' +
      'kedudukan dan kekayaannya setelah bertemu Sunan Kalijaga, lalu menyebarkan Islam di kawasan ' +
      'Bayat. Kompleks makamnya berdiri di puncak Bukit Jabalkat dengan gapura-gapura bercorak ' +
      'Majapahit akhir — perpaduan yang jarang ditemukan. Kisah pertobatannya membuat tempat ini ' +
      'banyak didatangi orang yang sedang menimbang keputusan besar dalam hidup: berhenti dari ' +
      'pekerjaan, memulai usaha, atau meninggalkan sesuatu yang sudah lama digenggam.',
    tujuanUmum: [
      'Ziarah wali dan tahlil',
      'Laku bagi yang sedang mengambil keputusan besar dalam hidup atau usaha',
      'Bagian dari rangkaian ziarah wali Jawa Tengah',
      'Mengamati akulturasi arsitektur Hindu-Majapahit dengan Islam',
    ],
    laku: ['Tahlil dan doa di depan cungkup', 'Nyekar', 'Tirakat semalam dengan izin juru kunci'],
    uborampe: ['Kembang setaman', 'Minyak wangi non-alkohol'],
    adab: [
      'Berbusana sopan dan tertutup, lepas alas kaki di area makam.',
      'Ada beberapa ratus anak tangga menuju puncak. Sediakan waktu dan jeda untuk peserta lansia.',
      'Antre dengan tertib bila sedang ramai — jangan menyerobot.',
    ],
    waktuTerbaik:
      'Pagi hari. Ramai pada malam Jumat dan menjelang Ramadan saat tradisi nyadran berlangsung.',
    jurukunci:
      'Dijaga juru kunci yang ditunjuk yayasan pengelola makam. Kami mengurus izin bila rombongan ' +
      'ingin tirakat di luar jam kunjungan umum.',
  },

  {
    slug: 'dieng',
    nama: 'Dataran Tinggi Dieng',
    lokasi: 'Kompleks Candi Arjuna, Telaga Warna, Kawah Sikidang',
    kabupaten: 'Wonosobo & Banjarnegara, Jawa Tengah',
    kategori: ['budaya', 'ziarah'],
    tingkat: 'Sedang',
    durasi: '2 hari 1 malam',
    warna: '#3a4f4a',
    foto: [],
    video: '',
    ringkas:
      'Dataran di ketinggian dua ribu meter yang namanya berarti tempat bersemayam para dewa — dengan candi Hindu tertua di Jawa.',
    sejarah:
      'Nama Dieng dibaca dari di hyang, tempat bersemayam para dewa. Kompleks Candi Arjuna berasal ' +
      'dari abad ke-7 sampai ke-8 Masehi, menjadikannya candi Hindu tertua yang masih berdiri di ' +
      'Pulau Jawa — jauh lebih tua daripada Prambanan. Sampai kini Dieng punya tradisi hidup berupa ' +
      'ruwatan anak berambut gimbal, upacara memotong rambut anak-anak yang tumbuh gimbal secara ' +
      'alami, yang dipercaya warga sebagai titipan leluhur. Upacara ini masih digelar dan menjadi ' +
      'salah satu ritual paling khas di Jawa.',
    tujuanUmum: [
      'Menyaksikan atau mengikuti prosesi ruwatan rambut gimbal',
      'Ziarah dan semedi di kompleks Candi Arjuna',
      'Wisata alam untuk rombongan keluarga: telaga, kawah, dan matahari terbit Sikunir',
      'Studi arkeologi masa Mataram Kuno',
    ],
    laku: [
      'Semedi di pelataran candi dengan izin pengelola',
      'Mengikuti prosesi ruwatan bila jadwalnya bertepatan',
      'Mengambil air dari sumber di kompleks candi',
    ],
    uborampe: [
      'Kembang setaman',
      'Dupa',
      'Untuk ruwatan, uborampe disiapkan pemangku adat setempat — kami koordinasikan, tidak kami sediakan sendiri',
    ],
    adab: [
      'Suhu bisa turun sampai mendekati nol derajat menjelang subuh, kadang sampai muncul embun beku. Jaket tebal wajib.',
      'Kawah Sikidang mengeluarkan gas beracun. Jangan melewati batas pagar, ikuti arah angin yang ditunjukkan pemandu.',
      'Ruwatan rambut gimbal adalah upacara keluarga, bukan pertunjukan. Minta izin sebelum memotret dari dekat.',
      'Ketinggian dua ribu meter — peserta dengan riwayat asma harap membawa obat.',
    ],
    waktuTerbaik:
      'Ruwatan besar biasanya digelar dalam rangkaian Dieng Culture Festival, umumnya pertengahan tahun. ' +
      'Untuk suasana sepi, hindari akhir pekan panjang.',
    jurukunci:
      'Kami berkoordinasi dengan pemangku adat Dieng dan juru pelihara candi dari Balai Pelestarian ' +
      'Cagar Budaya. Untuk ruwatan, jadwal ditentukan pemangku adat — tidak bisa dipesan sesuka waktu.',
  },

  {
    slug: 'sunan-kalijaga',
    nama: 'Makam Sunan Kalijaga, Kadilangu',
    lokasi: 'Kadilangu, Demak',
    kabupaten: 'Demak, Jawa Tengah',
    kategori: ['ziarah'],
    tingkat: 'Ringan',
    durasi: 'Setengah hari',
    warna: '#4a4030',
    foto: [],
    video: '',
    ringkas:
      'Makam wali yang paling lekat dengan budaya Jawa, berdekatan dengan Masjid Agung Demak.',
    sejarah:
      'Sunan Kalijaga dikenal sebagai wali yang menyebarkan Islam lewat jalur budaya — wayang, ' +
      'gamelan, tembang, dan tradisi grebeg — alih-alih menghapus yang sudah ada. Karena itu ' +
      'makamnya di Kadilangu jadi tujuan penting bagi siapa pun yang menekuni kesenian Jawa, ' +
      'laku kejawen, maupun ziarah wali. Di dekatnya berdiri Masjid Agung Demak, masjid tertua ' +
      'di Jawa, dengan soko tatal yang legendaris. Keduanya biasa diziarahi dalam satu perjalanan.',
    tujuanUmum: [
      'Ziarah wali, umumnya sebagai bagian dari rangkaian Wali Songo',
      'Laku bagi penekun kesenian Jawa: dalang, pesinden, penabuh gamelan',
      'Studi sejarah masuknya Islam ke Jawa',
      'Menyaksikan tradisi Grebeg Besar Demak',
    ],
    laku: ['Tahlil dan doa', 'Nyekar', 'Wirid di serambi makam'],
    uborampe: ['Kembang setaman', 'Minyak wangi non-alkohol'],
    adab: [
      'Berbusana sopan dan tertutup. Wanita disarankan berkerudung.',
      'Area makam sangat ramai pada malam Jumat dan musim ziarah — siapkan kesabaran mengantre.',
      'Jaga barang bawaan, kawasan padat pengunjung.',
      'Berhati-hati dengan penawaran jasa doa berbayar dari orang tak dikenal di luar pengelola resmi.',
    ],
    waktuTerbaik:
      'Grebeg Besar Demak digelar pada Iduladha. Untuk ziarah tenang, pilih hari kerja pagi.',
    jurukunci:
      'Dikelola yayasan makam Sunan Kalijaga. Kami mengurus pendampingan dan, bila diminta, ' +
      'menyambungkan dengan pemimpin tahlil resmi dari yayasan.',
  },
];

// ---- Fungsi bantu (tidak perlu diubah) -------------------------------------

export function cariDestinasi(slug) {
  return destinasi.find((d) => d.slug === slug);
}

export const labelKategori = {
  ziarah: 'Ziarah',
  laku: 'Laku Spiritual',
  budaya: 'Wisata Budaya',
  pendakian: 'Pendakian',
};
