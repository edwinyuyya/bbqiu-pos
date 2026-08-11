// Aturan alur pesanan.
//
// WAJIB_BAYAR_DULU = false -> dapur langsung memasak begitu pesanan masuk,
// pembayaran menyusul saat tamu mau pulang. Ini alur normal restoran dine-in.
//
// Sempat disetel true, dan itu keliru untuk tempat ini. Grill & steamboat
// adalah tempat orang duduk lama: tamu pesan, makan, baru bayar. Memaksa
// bayar di depan membuat staf sering lupa menekan "Tandai Lunas", dan
// akibatnya dapur diam sementara tamu menunggu — pernah sampai 45 menit
// dengan empat meja tertahan sekaligus, tanpa ada yang menyadari.
//
// Ubah ke true kalau suatu saat alurnya berubah jadi bayar di muka
// (mis. take-away atau bazar). Satu baris ini mengubah tiga tempat sekaligus:
// Kitchen Display, cetak struk station, dan tanda di halaman Kasir.
export const WAJIB_BAYAR_DULU = false;

export const PESAN_MENUNGGU_BAYAR =
  'Pesanan diteruskan ke dapur setelah pembayaran diterima.';
